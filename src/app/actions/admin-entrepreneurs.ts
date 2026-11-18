"use server";

import {
  AuditEntityType,
  EntrepreneurStatus,
  UserRole,
} from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, toActionError } from "@/lib/server/admin-auth";
import { revalidateAdminMutation } from "@/lib/server/admin-revalidate";
import {
  setEntrepreneurStatusSchema,
  setEntrepreneurTrustSchema,
} from "@/lib/validations/admin";

export interface AdminActionResult {
  ok: boolean;
  error?: string;
}

const ENTREPRENEUR_ROLES: UserRole[] = [
  UserRole.USER_NEW,
  UserRole.USER_TRUSTED,
  UserRole.ENTREPRENEUR,
];

/**
 * Cambia el permiso de publicación: USER_NEW (requiere revisión) ↔ USER_TRUSTED (publicación directa).
 * Mantiene sincronizados `users.role` y `entrepreneurs.is_trusted`.
 */
export async function setEntrepreneurTrustAction(input: {
  entrepreneurId: string;
  trusted: boolean;
}): Promise<AdminActionResult> {
  const parsed = setEntrepreneurTrustSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const admin = await requireAdmin();
    const { entrepreneurId, trusted } = parsed.data;
    const nextRole = trusted ? UserRole.USER_TRUSTED : UserRole.USER_NEW;

    await db.$transaction(async (tx) => {
      const entrepreneur = await tx.entrepreneur.findUnique({
        where: { id: entrepreneurId },
        select: {
          id: true,
          businessName: true,
          isTrusted: true,
          user: { select: { id: true, role: true } },
        },
      });

      if (!entrepreneur) {
        throw new Error("No encontramos ese emprendimiento.");
      }
      if (!ENTREPRENEUR_ROLES.includes(entrepreneur.user.role)) {
        throw new Error("Esta cuenta no es de un emprendedor.");
      }

      await tx.user.update({
        where: { id: entrepreneur.user.id },
        data: { role: nextRole },
      });
      await tx.entrepreneur.update({
        where: { id: entrepreneur.id },
        data: { isTrusted: trusted },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.ENTREPRENEUR,
          entityId: entrepreneur.id,
          action: "SET_ENTREPRENEUR_TRUST",
          metadata: {
            businessName: entrepreneur.businessName,
            previousStatus: entrepreneur.user.role,
            newStatus: nextRole,
            note: trusted
              ? "Pasó a publicación directa (USER_TRUSTED)."
              : "Volvió a requerir revisión previa (USER_NEW).",
          },
        },
      });
    });

    revalidateAdminMutation();
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo cambiar el permiso de publicación.");
  }
}

/**
 * Suspende (con motivo) o reactiva una cuenta de emprendimiento.
 * Suspender oculta todos sus productos del catálogo y bloquea su panel.
 */
export async function setEntrepreneurStatusAction(input: {
  entrepreneurId: string;
  action: "suspend" | "reactivate";
  reason?: string;
}): Promise<AdminActionResult> {
  const parsed = setEntrepreneurStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const admin = await requireAdmin();
    const { entrepreneurId, action, reason } = parsed.data;
    const suspending = action === "suspend";
    const nextStatus = suspending
      ? EntrepreneurStatus.SUSPENDED
      : EntrepreneurStatus.APPROVED;

    await db.$transaction(async (tx) => {
      const entrepreneur = await tx.entrepreneur.findUnique({
        where: { id: entrepreneurId },
        select: { id: true, businessName: true, status: true },
      });

      if (!entrepreneur) {
        throw new Error("No encontramos ese emprendimiento.");
      }
      if (suspending && entrepreneur.status === EntrepreneurStatus.SUSPENDED) {
        throw new Error("Este emprendimiento ya está suspendido.");
      }
      if (!suspending && entrepreneur.status !== EntrepreneurStatus.SUSPENDED) {
        throw new Error("Este emprendimiento no está suspendido.");
      }

      await tx.entrepreneur.update({
        where: { id: entrepreneur.id },
        data: {
          status: nextStatus,
          rejectionReason: suspending ? (reason ?? null) : null,
          ...(suspending
            ? {}
            : { approvedAt: new Date(), approvedById: admin.userId }),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.ENTREPRENEUR,
          entityId: entrepreneur.id,
          action: suspending ? "SUSPEND_ENTREPRENEUR" : "REACTIVATE_ENTREPRENEUR",
          metadata: {
            businessName: entrepreneur.businessName,
            previousStatus: entrepreneur.status,
            newStatus: nextStatus,
            ...(suspending && reason ? { rejectionReason: reason } : {}),
          },
        },
      });
    });

    revalidateAdminMutation();
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo cambiar el estado del emprendimiento.");
  }
}
