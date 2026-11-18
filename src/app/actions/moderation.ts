"use server";

import {
  AuditEntityType,
  EntrepreneurStatus,
  ProductStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, toActionError } from "@/lib/server/admin-auth";
import { revalidateAdminMutation } from "@/lib/server/admin-revalidate";
import {
  approveEntitySchema,
  rejectEntitySchema,
} from "@/lib/validations/moderation";

export interface ModerationActionResult {
  ok: boolean;
  error?: string;
}

type ProductTransition = {
  /** Estados desde los que se permite la transición. */
  from: ProductStatus[];
  to: ProductStatus;
  auditAction: string;
  note: string;
};

const PRODUCT_TRANSITIONS = {
  approve: {
    from: [ProductStatus.PENDING, ProductStatus.REJECTED, ProductStatus.SUSPENDED],
    to: ProductStatus.APPROVED,
    auditAction: "APPROVE_PRODUCT",
    note: "Producto aprobado por la administración.",
  },
  reject: {
    from: [ProductStatus.PENDING, ProductStatus.APPROVED, ProductStatus.PAUSED],
    to: ProductStatus.REJECTED,
    auditAction: "REJECT_PRODUCT",
    note: "Se pidió una corrección al emprendedor.",
  },
  suspend: {
    from: [ProductStatus.PENDING, ProductStatus.APPROVED, ProductStatus.PAUSED, ProductStatus.REJECTED],
    to: ProductStatus.SUSPENDED,
    auditAction: "SUSPEND_PRODUCT",
    note: "Producto pausado por la administración.",
  },
  reactivate: {
    from: [ProductStatus.SUSPENDED],
    to: ProductStatus.APPROVED,
    auditAction: "REACTIVATE_PRODUCT",
    note: "Producto reactivado por la administración.",
  },
} satisfies Record<string, ProductTransition>;

/**
 * Transición de estado de un producto con registro obligatorio en audit_logs.
 * `reason` queda visible para el emprendedor (corrección o pausa).
 */
async function transitionProduct(
  kind: keyof typeof PRODUCT_TRANSITIONS,
  productId: string,
  reason: string | null,
): Promise<ModerationActionResult> {
  try {
    const admin = await requireAdmin();
    const transition: ProductTransition = PRODUCT_TRANSITIONS[kind];
    const now = new Date();

    const slug = await db.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, title: true, slug: true, status: true },
      });

      if (!existing) {
        throw new Error("El producto solicitado no existe.");
      }
      if (!transition.from.includes(existing.status)) {
        throw new Error(
          "El producto ya cambió de estado. Actualizá la pantalla para ver cómo quedó.",
        );
      }

      const approving = transition.to === ProductStatus.APPROVED;

      await tx.product.update({
        where: { id: productId },
        data: {
          status: transition.to,
          rejectionReason: approving ? null : reason,
          approvedAt: approving ? now : null,
          approvedById: approving ? admin.userId : null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.PRODUCT,
          entityId: productId,
          action: transition.auditAction,
          metadata: {
            title: existing.title,
            slug: existing.slug,
            previousStatus: existing.status,
            newStatus: transition.to,
            ...(reason ? { rejectionReason: reason } : {}),
            note: transition.note,
          },
        },
      });

      return existing.slug;
    });

    revalidateAdminMutation({ productSlug: slug });
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo actualizar el producto.");
  }
}

export async function approveProductAction(
  formData: FormData,
): Promise<ModerationActionResult> {
  const parsed = approveEntitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  return transitionProduct("approve", parsed.data.id, null);
}

/** "Pedir corrección": el producto queda observado con un motivo visible para el emprendedor. */
export async function rejectProductAction(
  formData: FormData,
): Promise<ModerationActionResult> {
  const parsed = rejectEntitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
    rejectionReason: String(formData.get("rejectionReason") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Motivo inválido." };
  }
  return transitionProduct("reject", parsed.data.id, parsed.data.rejectionReason);
}

/** "Pausar": oculta el producto del catálogo; el emprendedor ve el motivo. */
export async function suspendProductAction(
  formData: FormData,
): Promise<ModerationActionResult> {
  const parsed = rejectEntitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
    rejectionReason: String(formData.get("rejectionReason") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Motivo inválido." };
  }
  return transitionProduct("suspend", parsed.data.id, parsed.data.rejectionReason);
}

export async function reactivateProductAction(
  formData: FormData,
): Promise<ModerationActionResult> {
  const parsed = approveEntitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  return transitionProduct("reactivate", parsed.data.id, null);
}

// ============================================================================
// Emprendimientos nuevos (habilitación)
// ============================================================================

export async function approveEntrepreneurAction(
  formData: FormData,
): Promise<ModerationActionResult> {
  const parsed = approveEntitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const admin = await requireAdmin();
    const { id } = parsed.data;

    await db.$transaction(async (tx) => {
      const existing = await tx.entrepreneur.findUnique({
        where: { id },
        select: { id: true, businessName: true, status: true },
      });
      if (!existing) {
        throw new Error("El emprendimiento solicitado no existe.");
      }

      await tx.entrepreneur.update({
        where: { id },
        data: {
          status: EntrepreneurStatus.APPROVED,
          approvedAt: new Date(),
          approvedById: admin.userId,
          rejectionReason: null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
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

    revalidateAdminMutation();
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo habilitar el emprendimiento.");
  }
}

export async function rejectEntrepreneurAction(
  formData: FormData,
): Promise<ModerationActionResult> {
  const parsed = rejectEntitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
    rejectionReason: String(formData.get("rejectionReason") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Motivo inválido." };
  }

  try {
    const admin = await requireAdmin();
    const { id, rejectionReason } = parsed.data;

    await db.$transaction(async (tx) => {
      const existing = await tx.entrepreneur.findUnique({
        where: { id },
        select: { id: true, businessName: true, status: true },
      });
      if (!existing) {
        throw new Error("El emprendimiento solicitado no existe.");
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
          actorUserId: admin.userId,
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

    revalidateAdminMutation();
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo pedir la corrección.");
  }
}
