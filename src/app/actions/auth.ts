"use server";

import {
  AuditEntityType,
  EntrepreneurStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSessionCookie, createSessionCookie } from "@/lib/session";
import {
  loginSchema,
  registerEntrepreneurSchema,
} from "@/lib/validations/auth";
import { slugifyText } from "@/lib/slug";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

export interface AuthActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
}

async function generateUniqueEntrepreneurSlug(
  businessName: string,
): Promise<string> {
  const baseSlug = slugifyText(businessName, "emprendimiento");
  const existing = await db.entrepreneur.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!existing) {
    return baseSlug;
  }

  for (let attempt = 2; attempt <= 50; attempt++) {
    const candidate = `${baseSlug}-${attempt}`;
    const found = await db.entrepreneur.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!found) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

export async function registerEntrepreneurAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const rawValues = {
    ownerName: String(formData.get("ownerName") ?? ""),
    businessName: String(formData.get("businessName") ?? ""),
    username: String(formData.get("username") ?? ""),
    whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
    neighborhood: String(formData.get("neighborhood") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const safeEchoValues = {
    ownerName: rawValues.ownerName,
    businessName: rawValues.businessName,
    username: rawValues.username,
    whatsappNumber: rawValues.whatsappNumber,
    neighborhood: rawValues.neighborhood,
    bio: rawValues.bio,
  };

  const parsed = registerEntrepreneurSchema.safeParse(rawValues);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return {
      error: "Por favor revisá los campos marcados.",
      fieldErrors: flattened.fieldErrors,
      values: safeEchoValues,
    };
  }

  const data = parsed.data;

  const existingUser = await db.user.findUnique({
    where: { username: data.username },
    select: { id: true },
  });

  if (existingUser) {
    return {
      error: "Ya existe una cuenta registrada con ese nombre de usuario.",
      fieldErrors: {
        username: ["Este nombre de usuario ya está en uso. Elegí otro."],
      },
      values: safeEchoValues,
    };
  }

  const slug = await generateUniqueEntrepreneurSlug(data.businessName);
  const normalizedPhone = normalizeWhatsappNumber(data.whatsappNumber);
  const passwordHash = await bcrypt.hash(data.password, 12);

  let createdUserId = "";
  let createdEntrepreneurId = "";

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          email: null,
          passwordHash,
          role: UserRole.USER_NEW,
          isActive: true,
        },
      });

      const entrepreneur = await tx.entrepreneur.create({
        data: {
          userId: user.id,
          businessName: data.businessName,
          slug,
          ownerName: data.ownerName,
          whatsappNumber: normalizedPhone,
          neighborhood: data.neighborhood ?? null,
          bio: data.bio ?? null,
          status: EntrepreneurStatus.PENDING,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          entityType: AuditEntityType.ENTREPRENEUR,
          entityId: entrepreneur.id,
          action: "REGISTER_PENDING",
          metadata: {
            businessName: entrepreneur.businessName,
            whatsappNumber: entrepreneur.whatsappNumber,
          },
        },
      });

      return { user, entrepreneur };
    });

    createdUserId = result.user.id;
    createdEntrepreneurId = result.entrepreneur.id;
  } catch {
    return {
      error:
        "Ocurrió un error al registrar tu cuenta. Intentá nuevamente en unos instantes.",
      values: safeEchoValues,
    };
  }

  await createSessionCookie({
    userId: createdUserId,
    username: data.username,
    email: null,
    role: UserRole.USER_NEW,
    entrepreneurId: createdEntrepreneurId,
  });

  redirect("/dashboard");
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const rawUsername = String(formData.get("username") ?? "");
  const rawPassword = String(formData.get("password") ?? "");

  const parsed = loginSchema.safeParse({
    username: rawUsername,
    password: rawPassword,
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return {
      error: "Revisá tu nombre de usuario y contraseña.",
      fieldErrors: flattened.fieldErrors,
      values: { username: rawUsername },
    };
  }

  const { username, password } = parsed.data;

  const user = await db.user.findUnique({
    where: { username },
    include: {
      entrepreneur: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return {
      error: "Nombre de usuario o contraseña incorrectos.",
      values: { username },
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return {
      error: "Nombre de usuario o contraseña incorrectos.",
      values: { username },
    };
  }

  if (user.entrepreneur?.status === EntrepreneurStatus.SUSPENDED) {
    return {
      error:
        "Tu cuenta de emprendedor se encuentra temporalmente suspendida. Comunicate con el área de Modernización y Empleo.",
      values: { username },
    };
  }

  await createSessionCookie({
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    entrepreneurId: user.entrepreneur?.id ?? null,
  });

  if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
    redirect("/admin");
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
