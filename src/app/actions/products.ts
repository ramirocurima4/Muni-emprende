"use server";

import { AuditEntityType, ProductStatus } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { getSession, isEntrepreneurRole } from "@/lib/session";
import {
  type ToggleProductAvailabilityInput,
  toggleProductAvailabilitySchema,
} from "@/lib/validations/product";

export interface ToggleProductAvailabilityResult {
  ok: boolean;
  status?: ProductStatus;
  error?: string;
}

/**
 * Alterna rápidamente la disponibilidad de un producto aprobado entre APPROVED y PAUSED
 * desde el Panel del Emprendedor, saltando la cola de moderación pero dejando
 * registro obligatorio en audit_logs e invalidando caché y rutas públicas.
 */
export async function toggleProductAvailabilityAction(
  input: ToggleProductAvailabilityInput,
): Promise<ToggleProductAvailabilityResult> {
  const session = await getSession();
  if (!session || !isEntrepreneurRole(session.role)) {
    return {
      ok: false,
      error: "Tu sesión expiró o no tenés permisos de emprendedor.",
    };
  }

  const parsed = toggleProductAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Solicitud inválida.",
    };
  }

  const { productId, available } = parsed.data;
  const targetStatus = available
    ? ProductStatus.APPROVED
    : ProductStatus.PAUSED;

  try {
    const result = await db.$transaction(async (tx) => {
      const entrepreneur = await tx.entrepreneur.findUnique({
        where: { userId: session.userId },
        select: {
          id: true,
          businessName: true,
        },
      });

      if (!entrepreneur) {
        throw new Error("No encontramos el perfil de tu emprendimiento.");
      }

      const product = await tx.product.findFirst({
        where: {
          id: productId,
          entrepreneurId: entrepreneur.id,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      });

      if (!product) {
        throw new Error(
          "El producto no existe o no pertenece a tu emprendimiento.",
        );
      }

      if (
        product.status !== ProductStatus.APPROVED &&
        product.status !== ProductStatus.PAUSED
      ) {
        throw new Error(
          "Solo podés activar o pausar productos que ya fueron aprobados por moderación.",
        );
      }

      if (product.status === targetStatus) {
        return {
          slug: product.slug,
          status: targetStatus,
          changed: false,
        };
      }

      await tx.product.update({
        where: { id: product.id },
        data: { status: targetStatus },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.PRODUCT,
          entityId: product.id,
          action:
            targetStatus === ProductStatus.PAUSED
              ? "PAUSE_PRODUCT"
              : "RESUME_PRODUCT",
          metadata: {
            entrepreneurId: entrepreneur.id,
            entrepreneurBusinessName: entrepreneur.businessName,
            title: product.title,
            slug: product.slug,
            previousStatus: product.status,
            newStatus: targetStatus,
            bypassedModeration: true,
            note:
              targetStatus === ProductStatus.PAUSED
                ? "Pausado manualmente por el emprendedor desde el interruptor rápido."
                : "Reactivado manualmente por el emprendedor desde el interruptor rápido.",
          },
        },
      });

      return {
        slug: product.slug,
        status: targetStatus,
        changed: true,
      };
    });

    if (result.changed) {
      updateTag("public-catalog");
      updateTag("public-products");
      updateTag("public-categories");
      updateTag(`product-${result.slug}`);
      revalidatePath("/dashboard");
      revalidatePath("/catalogo");
      revalidatePath("/");
      revalidatePath(`/productos/${result.slug}`);
      revalidatePath("/admin");
    }

    return {
      ok: true,
      status: result.status,
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la disponibilidad del producto.",
    };
  }
}
