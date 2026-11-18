"use server";

import {
  AuditEntityType,
  EntrepreneurStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin, toActionError } from "@/lib/server/admin-auth";
import { revalidateAdminMutation } from "@/lib/server/admin-revalidate";
import { generateUniqueEntrepreneurSlug } from "@/lib/server/entrepreneur-slug";
import { generateTemporaryPassword } from "@/lib/server/password";
import {
  createUserSchema,
  resetPasswordSchema,
  setUserActiveSchema,
} from "@/lib/validations/admin";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

const BCRYPT_ROUNDS = 12;

export interface CreateUserActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  created?: { username: string; temporaryPassword: string; roleLabel: string };
}

export interface ResetPasswordResult {
  ok: boolean;
  error?: string;
  username?: string;
  temporaryPassword?: string;
}

export interface SetUserActiveResult {
  ok: boolean;
  error?: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administración",
  MODERATOR: "Moderación (reservado)",
  USER_NEW: "Emprendedor con revisión previa",
  USER_TRUSTED: "Emprendedor con publicación directa",
};

/**
 * Crea un usuario de cualquier clase con una contraseña temporal generada por el sistema.
 * Para USER_NEW / USER_TRUSTED también crea su emprendimiento ya habilitado.
 * La contraseña se devuelve una sola vez y no se guarda en ningún registro.
 */
export async function createUserAction(
  _prevState: CreateUserActionState,
  formData: FormData,
): Promise<CreateUserActionState> {
  const raw = {
    username: String(formData.get("username") ?? ""),
    role: String(formData.get("role") ?? ""),
    ownerName: String(formData.get("ownerName") ?? ""),
    businessName: String(formData.get("businessName") ?? ""),
    whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
    neighborhood: String(formData.get("neighborhood") ?? ""),
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los campos marcados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: raw,
    };
  }

  try {
    const admin = await requireAdmin();
    const data = parsed.data;

    const existing = await db.user.findUnique({
      where: { username: data.username },
      select: { id: true },
    });
    if (existing) {
      return {
        ok: false,
        error: "Ya existe un usuario con ese nombre.",
        fieldErrors: { username: ["Ese nombre de usuario ya está en uso. Probá con otro."] },
        values: raw,
      };
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
    const isEntrepreneurAccount =
      data.role === "USER_NEW" || data.role === "USER_TRUSTED";
    const slug = isEntrepreneurAccount
      ? await generateUniqueEntrepreneurSlug(data.businessName ?? data.username)
      : null;

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          passwordHash,
          role: UserRole[data.role],
          isActive: true,
        },
      });

      if (isEntrepreneurAccount && slug) {
        await tx.entrepreneur.create({
          data: {
            userId: user.id,
            businessName: data.businessName ?? data.username,
            slug,
            ownerName: data.ownerName ?? data.username,
            whatsappNumber: normalizeWhatsappNumber(data.whatsappNumber ?? ""),
            neighborhood: data.neighborhood,
            isTrusted: data.role === "USER_TRUSTED",
            status: EntrepreneurStatus.APPROVED,
            approvedAt: new Date(),
            approvedById: admin.userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.USER,
          entityId: user.id,
          action: "CREATE_USER",
          metadata: {
            username: user.username,
            newStatus: user.role,
            ...(data.businessName ? { businessName: data.businessName } : {}),
            note: "Usuario creado desde el panel de administración.",
          },
        },
      });
    });

    revalidateAdminMutation();
    return {
      ok: true,
      created: {
        username: data.username,
        temporaryPassword,
        roleLabel: ROLE_LABELS[data.role] ?? data.role,
      },
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        ok: false,
        error: "Ya existe un usuario con ese nombre.",
        fieldErrors: { username: ["Ese nombre de usuario ya está en uso. Probá con otro."] },
        values: raw,
      };
    }
    return { ...toActionError(err, "No se pudo crear el usuario."), values: raw };
  }
}

/**
 * Blanquea la contraseña de un usuario: genera una nueva, la guarda hasheada y la devuelve una sola vez.
 * El motivo del registro en audit_logs nunca incluye la contraseña.
 */
export async function resetUserPasswordAction(input: {
  userId: string;
}): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const admin = await requireAdmin();
    const target = await db.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, username: true, role: true },
    });
    if (!target) {
      return { ok: false, error: "No encontramos ese usuario." };
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: { passwordHash },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.USER,
          entityId: target.id,
          action: "RESET_PASSWORD",
          metadata: {
            username: target.username,
            note: "Contraseña blanqueada desde el panel de administración.",
          },
        },
      });
    });

    revalidateAdminMutation();
    return { ok: true, username: target.username, temporaryPassword };
  } catch (err) {
    return toActionError(err, "No se pudo blanquear la contraseña.");
  }
}

/**
 * Habilita o deshabilita el acceso de un usuario del equipo.
 * No permite desactivarse a uno mismo ni dejar al sistema sin administradores activos.
 */
export async function setUserActiveAction(input: {
  userId: string;
  active: boolean;
}): Promise<SetUserActiveResult> {
  const parsed = setUserActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const admin = await requireAdmin();
    const { userId, active } = parsed.data;

    if (!active && userId === admin.userId) {
      return { ok: false, error: "No podés quitarte el acceso a vos mismo/a." };
    }

    await db.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, role: true, isActive: true },
      });
      if (!target) {
        throw new Error("No encontramos ese usuario.");
      }

      if (!active && target.role === UserRole.ADMIN) {
        const otherActiveAdmins = await tx.user.count({
          where: { role: UserRole.ADMIN, isActive: true, id: { not: target.id } },
        });
        if (otherActiveAdmins === 0) {
          throw new Error("Tiene que quedar al menos una persona administradora activa.");
        }
      }

      await tx.user.update({ where: { id: target.id }, data: { isActive: active } });
      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.USER,
          entityId: target.id,
          action: "SET_USER_ACTIVE",
          metadata: {
            username: target.username,
            previousStatus: target.isActive ? "ACTIVO" : "SIN ACCESO",
            newStatus: active ? "ACTIVO" : "SIN ACCESO",
          },
        },
      });
    });

    revalidateAdminMutation();
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo cambiar el acceso del usuario.");
  }
}
