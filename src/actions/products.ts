"use server";

import {
  AuditEntityType,
  EntrepreneurStatus,
  ProductStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  processAndSaveProductImage,
  removeUploadedProductImageVariants,
  type SavedProductImageVariants,
} from "@/lib/server/image-upload";
import { getSession, isEntrepreneurRole } from "@/lib/session";
import { slugifyText } from "@/lib/slug";
import { createProductSchema } from "@/lib/validations/product";

export interface CreateProductActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: {
    title?: string[];
    description?: string[];
    categoryId?: string[];
    image?: string[];
  };
  values?: {
    title?: string;
    description?: string;
    categoryId?: string;
  };
  productId?: string;
}

async function generateUniqueProductSlug(title: string): Promise<string> {
  const baseSlug = slugifyText(title, "producto", 150);
  const existing = await db.product.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!existing) {
    return baseSlug;
  }

  for (let attempt = 2; attempt <= 20; attempt++) {
    const candidate = `${baseSlug}-${attempt}`;
    const found = await db.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!found) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

/**
 * Server Action para procesar el alta de un nuevo producto desde el Panel del Emprendedor.
 * - Solo recibe Título, Descripción, Categoría e Imagen (nunca precio).
 * - Valida sesión ENTREPRENEUR y asocia obligatoriamente al emprendedor autenticado.
 * - Inserta el producto con status PENDING para moderación municipal.
 * - Registra la creación en audit_logs e invalida /dashboard y /admin.
 */
export async function createProductAction(
  _prevState: CreateProductActionState,
  formData: FormData,
): Promise<CreateProductActionState> {
  const session = await getSession();
  if (!session || !isEntrepreneurRole(session.role)) {
    return {
      ok: false,
      error: "Tu sesión expiró o no tenés permisos para cargar productos.",
    };
  }

  const rawValues = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
  };

  const echoValues = {
    title: rawValues.title,
    description: rawValues.description,
    categoryId: rawValues.categoryId,
  };

  const parsed = createProductSchema.safeParse(rawValues);
  const rawImage = formData.get("image");
  const hasImageFile = rawImage instanceof File && rawImage.size > 0;

  if (!parsed.success || !hasImageFile) {
    const flattened = parsed.success
      ? { fieldErrors: {} as Record<string, string[]> }
      : parsed.error.flatten();

    return {
      ok: false,
      error: "Revisá los datos del formulario antes de enviar.",
      fieldErrors: {
        title: flattened.fieldErrors.title,
        description: flattened.fieldErrors.description,
        categoryId: flattened.fieldErrors.categoryId,
        image: hasImageFile
          ? undefined
          : ["Subí al menos una foto del producto (máximo 8 MB)."],
      },
      values: echoValues,
    };
  }

  const entrepreneur = await db.entrepreneur.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      businessName: true,
      status: true,
    },
  });

  if (!entrepreneur) {
    return {
      ok: false,
      error: "No encontramos el perfil de tu emprendimiento.",
      values: echoValues,
    };
  }

  if (entrepreneur.status === EntrepreneurStatus.SUSPENDED) {
    return {
      ok: false,
      error:
        "Tu cuenta está suspendida temporalmente. Comunicate con Modernización y Empleo.",
      values: echoValues,
    };
  }

  const category = await db.category.findFirst({
    where: {
      id: parsed.data.categoryId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!category) {
    return {
      ok: false,
      error: "La categoría seleccionada no existe o no está disponible.",
      fieldErrors: {
        categoryId: ["Seleccioná una categoría válida del listado."],
      },
      values: echoValues,
    };
  }

  let savedImage: SavedProductImageVariants;
  try {
    savedImage = await processAndSaveProductImage(rawImage);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "No se pudo procesar la imagen subida.",
      fieldErrors: {
        image: [
          err instanceof Error
            ? err.message
            : "No se pudo procesar la imagen subida.",
        ],
      },
      values: echoValues,
    };
  }

  const slug = await generateUniqueProductSlug(parsed.data.title);

  try {
    const createdProduct = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          entrepreneurId: entrepreneur.id,
          categoryId: category.id,
          title: parsed.data.title,
          slug,
          description: parsed.data.description,
          status: ProductStatus.PENDING,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      });

      await tx.productImage.create({
        data: {
          productId: product.id,
          relativePath: savedImage.relativePath,
          width: savedImage.width,
          height: savedImage.height,
          sortOrder: 0,
          isPrimary: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.PRODUCT,
          entityId: product.id,
          action: "CREATE_PRODUCT_PENDING",
          metadata: {
            entrepreneurId: entrepreneur.id,
            entrepreneurBusinessName: entrepreneur.businessName,
            title: product.title,
            slug: product.slug,
            categoryId: category.id,
            categoryName: category.name,
            status: ProductStatus.PENDING,
            imageRelativePath: savedImage.relativePath,
            note: "Producto cargado por el emprendedor y enviado a revisión municipal.",
          },
        },
      });

      return product;
    });

    revalidatePath("/mi-emprendimiento");
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      ok: true,
      productId: createdProduct.id,
    };
  } catch {
    await removeUploadedProductImageVariants(savedImage);
    return {
      ok: false,
      error:
        "Ocurrió un error al guardar el producto. Intentá nuevamente en unos instantes.",
      values: echoValues,
    };
  }
}
