import { AuditEntityType, ProductStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  isGastronomyCategory,
  mapPanelProductItem,
  PanelAuthError,
  requireAuthenticatedEntrepreneur,
  revalidateEntrepreneurAndCatalogSurfaces,
} from "@/lib/server/entrepreneur-panel";
import {
  processAndSaveProductImage,
  removeStoredImageVariantsByRelativePath,
  removeUploadedProductImageVariants,
  type SavedProductImageVariants,
} from "@/lib/server/image-upload";
import { createProductSchema } from "@/lib/validations/product";

const uuidParamSchema = z.string().uuid("Identificador de producto inválido.");

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

  const { id: rawId } = await context.params;
  const idParsed = uuidParamSchema.safeParse(rawId);
  if (!idParsed.success) {
    return NextResponse.json(
      { ok: false, error: "El producto indicado no es válido." },
      { status: 400 },
    );
  }

  const { entrepreneur, session, isTrusted } = authContext;

  const existingProduct = await db.product.findFirst({
    where: {
      id: idParsed.data,
      entrepreneurId: entrepreneur.id,
    },
    select: {
      id: true,
      slug: true,
      status: true,
      approvedAt: true,
      images: {
        select: {
          relativePath: true,
        },
      },
    },
  });

  if (!existingProduct) {
    return NextResponse.json(
      { ok: false, error: "No encontramos ese producto en tu emprendimiento." },
      { status: 404 },
    );
  }

  if (existingProduct.status === ProductStatus.SUSPENDED) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Este producto fue pausado por la Muni y no se puede editar desde acá.",
      },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "No pudimos leer los cambios del producto." },
      { status: 400 },
    );
  }

  const rawValues = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    ingredients: String(formData.get("ingredients") ?? ""),
  };

  const parsed = createProductSchema.safeParse(rawValues);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return NextResponse.json(
      {
        ok: false,
        error: "Revisá los datos del producto antes de guardar.",
        fieldErrors: flattened.fieldErrors,
      },
      { status: 400 },
    );
  }

  const category = await db.category.findFirst({
    where: {
      id: parsed.data.categoryId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!category) {
    return NextResponse.json(
      {
        ok: false,
        error: "El rubro elegido no está disponible.",
        fieldErrors: {
          categoryId: ["Elegí un rubro válido de la lista."],
        },
      },
      { status: 400 },
    );
  }

  const rawImage = formData.get("image");
  const hasNewImage = rawImage instanceof File && rawImage.size > 0;
  let savedNewImage: SavedProductImageVariants | null = null;

  if (hasNewImage) {
    try {
      savedNewImage = await processAndSaveProductImage(rawImage);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo procesar la nueva foto.";
      return NextResponse.json(
        {
          ok: false,
          error: message,
          fieldErrors: { image: [message] },
        },
        { status: 400 },
      );
    }
  }

  const cleanIngredients = isGastronomyCategory(category)
    ? parsed.data.ingredients
    : null;
  const now = new Date();

  let nextStatus: ProductStatus;
  if (isTrusted) {
    nextStatus =
      existingProduct.status === ProductStatus.PAUSED
        ? ProductStatus.PAUSED
        : ProductStatus.APPROVED;
  } else {
    nextStatus = ProductStatus.PENDING;
  }

  const previousImagePaths = existingProduct.images.map(
    (img) => img.relativePath,
  );

  try {
    const updatedProduct = await db.$transaction(async (tx) => {
      if (savedNewImage) {
        await tx.productImage.deleteMany({
          where: { productId: existingProduct.id },
        });
        await tx.productImage.create({
          data: {
            productId: existingProduct.id,
            relativePath: savedNewImage.relativePath,
            width: savedNewImage.width,
            height: savedNewImage.height,
            sortOrder: 0,
            isPrimary: true,
          },
        });
      }

      const updated = await tx.product.update({
        where: { id: existingProduct.id },
        data: {
          categoryId: category.id,
          title: parsed.data.title,
          description: parsed.data.description,
          ingredients: cleanIngredients,
          status: nextStatus,
          rejectionReason: null,
          approvedAt:
            nextStatus === ProductStatus.APPROVED
              ? existingProduct.approvedAt ?? now
              : nextStatus === ProductStatus.PAUSED
                ? existingProduct.approvedAt
                : null,
          approvedById:
            nextStatus === ProductStatus.PENDING ? null : undefined,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          ingredients: true,
          status: true,
          rejectionReason: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: {
              relativePath: true,
              width: true,
              height: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.PRODUCT,
          entityId: existingProduct.id,
          action:
            nextStatus === ProductStatus.PENDING
              ? "UPDATE_PRODUCT_PENDING"
              : "UPDATE_PRODUCT_AUTO_APPROVED",
          metadata: {
            entrepreneurId: entrepreneur.id,
            entrepreneurBusinessName: entrepreneur.businessName,
            title: updated.title,
            slug: updated.slug,
            previousStatus: existingProduct.status,
            newStatus: nextStatus,
            imageReplaced: Boolean(savedNewImage),
            note:
              nextStatus === ProductStatus.PENDING
                ? "Producto editado por el emprendedor y enviado nuevamente a revisión."
                : "Producto editado por cuenta de confianza sin volver a cola de revisión.",
          },
        },
      });

      return updated;
    });

    if (savedNewImage) {
      await Promise.all(
        previousImagePaths.map((oldPath) =>
          removeStoredImageVariantsByRelativePath(oldPath),
        ),
      );
    }

    revalidateEntrepreneurAndCatalogSurfaces(updatedProduct.slug);

    return NextResponse.json({
      ok: true,
      publishedDirectly: nextStatus === ProductStatus.APPROVED,
      product: mapPanelProductItem(updatedProduct),
    });
  } catch {
    if (savedNewImage) {
      await removeUploadedProductImageVariants(savedNewImage);
    }
    return NextResponse.json(
      {
        ok: false,
        error:
          "No pudimos guardar los cambios del producto. Intentá de nuevo.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
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

  const { id: rawId } = await context.params;
  const idParsed = uuidParamSchema.safeParse(rawId);
  if (!idParsed.success) {
    return NextResponse.json(
      { ok: false, error: "El producto indicado no es válido." },
      { status: 400 },
    );
  }

  const { entrepreneur, session } = authContext;

  const existingProduct = await db.product.findFirst({
    where: {
      id: idParsed.data,
      entrepreneurId: entrepreneur.id,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      images: {
        select: {
          relativePath: true,
        },
      },
    },
  });

  if (!existingProduct) {
    return NextResponse.json(
      { ok: false, error: "No encontramos ese producto en tu emprendimiento." },
      { status: 404 },
    );
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.product.delete({
        where: { id: existingProduct.id },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.PRODUCT,
          entityId: existingProduct.id,
          action: "DELETE_PRODUCT",
          metadata: {
            entrepreneurId: entrepreneur.id,
            entrepreneurBusinessName: entrepreneur.businessName,
            title: existingProduct.title,
            slug: existingProduct.slug,
            previousStatus: existingProduct.status,
            note: "Producto eliminado por el emprendedor desde /mi-emprendimiento.",
          },
        },
      });
    });

    await Promise.all(
      existingProduct.images.map((img) =>
        removeStoredImageVariantsByRelativePath(img.relativePath),
      ),
    );

    revalidateEntrepreneurAndCatalogSurfaces(existingProduct.slug);

    return NextResponse.json({
      ok: true,
      deletedId: existingProduct.id,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No pudimos eliminar el producto en este momento.",
      },
      { status: 500 },
    );
  }
}
