import { AuditEntityType, ProductStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  PanelAuthError,
  requireAuthenticatedEntrepreneur,
  revalidateEntrepreneurAndCatalogSurfaces,
} from "@/lib/server/entrepreneur-panel";
import { toggleProductAvailabilitySchema } from "@/lib/validations/product";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let authContext: Awaited<ReturnType<typeof requireAuthenticatedEntrepreneur>>;
  try {
    authContext = await requireAuthenticatedEntrepreneur();
  } catch (err) {
    if (err instanceof PanelAuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: "No pudimos verificar tu sesión." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const parsed = toggleProductAvailabilitySchema.safeParse({
    productId: id,
    available:
      typeof body === "object" && body !== null && "available" in body
        ? (body as { available: unknown }).available
        : undefined,
    bump:
      typeof body === "object" && body !== null && "bump" in body
        ? Boolean((body as { bump: unknown }).bump)
        : false,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
      },
      { status: 400 },
    );
  }

  const { entrepreneur, session } = authContext;
  const targetStatus = parsed.data.available
    ? ProductStatus.APPROVED
    : ProductStatus.PAUSED;
  const shouldBump = parsed.data.bump && targetStatus === ProductStatus.APPROVED;

  try {
    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: parsed.data.productId,
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
        return { error: "No encontramos ese producto en tu emprendimiento.", statusCode: 404 as const };
      }

      if (
        product.status !== ProductStatus.APPROVED &&
        product.status !== ProductStatus.PAUSED
      ) {
        return {
          error:
            "Este producto todavía no fue publicado; solo podés marcar disponible o agotado en productos aprobados.",
          statusCode: 400 as const,
        };
      }

      if (product.status === targetStatus && !shouldBump) {
        return {
          slug: product.slug,
          status: targetStatus,
          changed: false,
          bumped: false,
        };
      }

      const now = new Date();
      await tx.product.update({
        where: { id: product.id },
        data: {
          status: targetStatus,
          updatedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.PRODUCT,
          entityId: product.id,
          action: shouldBump
            ? "BUMP_PRODUCT_TODAY"
            : targetStatus === ProductStatus.PAUSED
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
            note: shouldBump
              ? "Tanda activada para hoy y subida al inicio del catálogo por el emprendedor."
              : targetStatus === ProductStatus.PAUSED
                ? "Marcado como agotado hoy por el emprendedor."
                : "Marcado nuevamente como disponible por el emprendedor.",
          },
        },
      });

      return {
        slug: product.slug,
        status: targetStatus,
        changed: true,
        bumped: shouldBump,
      };
    });

    if ("error" in result) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.statusCode },
      );
    }

    if (result.changed) {
      revalidateEntrepreneurAndCatalogSurfaces(result.slug);
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No pudimos cambiar la disponibilidad en este momento.",
      },
      { status: 500 },
    );
  }
}
