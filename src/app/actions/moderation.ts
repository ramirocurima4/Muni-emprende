"use server";

import {
  AuditEntityType,
  EntrepreneurStatus,
  ProductStatus,
} from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { getSession, type SessionPayload } from "@/lib/session";
import {
  approveEntitySchema,
  rejectEntitySchema,
} from "@/lib/validations/moderation";

export interface ModerationActionResult {
  ok: boolean;
  error?: string;
}

async function requireModeratorSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "ADMIN" && session.role !== "MODERATOR")
  ) {
    throw new Error("No tenés permisos para realizar acciones de moderación.");
  }
  return session;
}

function revalidateModerationSurfaces() {
  updateTag("public-catalog");
  updateTag("public-products");
  updateTag("public-categories");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/catalogo");
  revalidatePath("/");
}

export async function approveEntrepreneurAction(
  formData: FormData,
): Promise<ModerationActionResult> {
  let session: SessionPayload;
  try {
    session = await requireModeratorSession();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Acceso denegado.",
    };
  }

  const parsed = approveEntitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const { id } = parsed.data;
  const now = new Date();

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.entrepreneur.findUnique({
        where: { id },
        select: { id: true, businessName: true, status: true },
      });

      if (!existing) {
        throw new Error("El emprendedor solicitado no existe.");
      }

      await tx.entrepreneur.update({
        where: { id },
        data: {
          status: EntrepreneurStatus.APPROVED,
          approvedAt: now,
          approvedById: session.userId,
          rejectionReason: null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.ENTREPRENEUR,
          entityId: id,
          action: "APPROVE_ENTREPRENEUR",
          metadata: {
            businessName: existing.businessName,
            previousStatus: existing.status,
            newStatus: EntrepreneurStatus.APPROVED,
          },
        },
      });
    });

    revalidateModerationSurfaces();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "No se pudo aprobar el emprendedor.",
    };
  }
}

export async function rejectEntrepreneurAction(
  formData: FormData,
): Promise<ModerationActionResult> {
  let session: SessionPayload;
  try {
    session = await requireModeratorSession();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Acceso denegado.",
    };
  }

  const parsed = rejectEntitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
    rejectionReason: String(formData.get("rejectionReason") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Motivo de rechazo inválido.",
    };
  }

  const { id, rejectionReason } = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.entrepreneur.findUnique({
        where: { id },
        select: { id: true, businessName: true, status: true },
      });

      if (!existing) {
        throw new Error("El emprendedor solicitado no existe.");
      }

      await tx.entrepreneur.update({
        where: { id },
        data: {
          status: EntrepreneurStatus.REJECTED,
          rejectionReason,
          approvedAt: null,
          approvedById: null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.ENTREPRENEUR,
          entityId: id,
          action: "REJECT_ENTREPRENEUR",
          metadata: {
            businessName: existing.businessName,
            previousStatus: existing.status,
            newStatus: EntrepreneurStatus.REJECTED,
            rejectionReason,
          },
        },
      });
    });

    revalidateModerationSurfaces();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "No se pudo rechazar el emprendedor.",
    };
  }
}

export async function approveProductAction(
  formData: FormData,
): Promise<ModerationActionResult> {
  let session: SessionPayload;
  try {
    session = await requireModeratorSession();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Acceso denegado.",
    };
  }

  const parsed = approveEntitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const { id } = parsed.data;
  const now = new Date();

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id },
        select: { id: true, title: true, slug: true, status: true },
      });

      if (!existing) {
        throw new Error("El producto solicitado no existe.");
      }

      await tx.product.update({
        where: { id },
        data: {
          status: ProductStatus.APPROVED,
          approvedAt: now,
          approvedById: session.userId,
          rejectionReason: null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.PRODUCT,
          entityId: id,
          action: "APPROVE_PRODUCT",
          metadata: {
            title: existing.title,
            slug: existing.slug,
            previousStatus: existing.status,
            newStatus: ProductStatus.APPROVED,
          },
        },
      });
    });

    revalidateModerationSurfaces();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "No se pudo aprobar el producto.",
    };
  }
}

export async function rejectProductAction(
  formData: FormData,
): Promise<ModerationActionResult> {
  let session: SessionPayload;
  try {
    session = await requireModeratorSession();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Acceso denegado.",
    };
  }

  const parsed = rejectEntitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
    rejectionReason: String(formData.get("rejectionReason") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Motivo de rechazo inválido.",
    };
  }

  const { id, rejectionReason } = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id },
        select: { id: true, title: true, slug: true, status: true },
      });

      if (!existing) {
        throw new Error("El producto solicitado no existe.");
      }

      await tx.product.update({
        where: { id },
        data: {
          status: ProductStatus.REJECTED,
          rejectionReason,
          approvedAt: null,
          approvedById: null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.PRODUCT,
          entityId: id,
          action: "REJECT_PRODUCT",
          metadata: {
            title: existing.title,
            slug: existing.slug,
            previousStatus: existing.status,
            newStatus: ProductStatus.REJECTED,
            rejectionReason,
          },
        },
      });
    });

    revalidateModerationSurfaces();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "No se pudo rechazar el producto.",
    };
  }
}
