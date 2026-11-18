import { AuditEntityType, ProductStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  generateUniqueProductSlug,
  isGastronomyCategory,
  loadEntrepreneurPanelCollections,
  mapPanelEntrepreneurProfile,
  mapPanelProductItem,
  PanelAuthError,
  requireAuthenticatedEntrepreneur,
  revalidateEntrepreneurAndCatalogSurfaces,
} from "@/lib/server/entrepreneur-panel";
import {
  processAndSaveProductImage,
  removeUploadedProductImageVariants,
  type SavedProductImageVariants,
} from "@/lib/server/image-upload";
import { createProductSchema } from "@/lib/validations/product";

export async function GET() {
  try {
    const context = await requireAuthenticatedEntrepreneur();
    const { products, categories } = await loadEntrepreneurPanelCollections(
      context.entrepreneur.id,
    );

    return NextResponse.json({
      ok: true,
      profile: mapPanelEntrepreneurProfile(context),
      products,
      categories,
    });
  } catch (err) {
    if (err instanceof PanelAuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: "No pudimos cargar tu emprendimiento." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let context: Awaited<ReturnType<typeof requireAuthenticatedEntrepreneur>>;
  try {
    context = await requireAuthenticatedEntrepreneur();
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

  const { entrepreneur, session, isTrusted } = context;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "No pudimos leer los datos del producto." },
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
  const rawImage = formData.get("image");
  const hasImageFile = rawImage instanceof File && rawImage.size > 0;

  if (!parsed.success || !hasImageFile) {
    const flattened = parsed.success
      ? { fieldErrors: {} as Record<string, string[]> }
      : parsed.error.flatten();

    return NextResponse.json(
      {
        ok: false,
        error: "Revisá los datos del producto antes de guardar.",
        fieldErrors: {
          title: flattened.fieldErrors.title,
          description: flattened.fieldErrors.description,
          categoryId: flattened.fieldErrors.categoryId,
          ingredients: flattened.fieldErrors.ingredients,
          image: hasImageFile
            ? undefined
            : ["Subí una foto del producto para que se vea en el catálogo."],
        },
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

  let savedImage: SavedProductImageVariants;
  try {
    savedImage = await processAndSaveProductImage(rawImage);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo procesar la foto del producto.";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        fieldErrors: { image: [message] },
      },
      { status: 400 },
    );
  }

  const slug = await generateUniqueProductSlug(parsed.data.title);
  const cleanIngredients = isGastronomyCategory(category)
    ? parsed.data.ingredients
    : null;
  const now = new Date();
  const initialStatus = isTrusted
    ? ProductStatus.APPROVED
    : ProductStatus.PENDING;

  try {
    const createdProduct = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          entrepreneurId: entrepreneur.id,
          categoryId: category.id,
          title: parsed.data.title,
          slug,
          description: parsed.data.description,
          ingredients: cleanIngredients,
          status: initialStatus,
          approvedAt: isTrusted ? now : null,
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
        },
      });

      const imageRecord = await tx.productImage.create({
        data: {
          productId: product.id,
          relativePath: savedImage.relativePath,
          width: savedImage.width,
          height: savedImage.height,
          sortOrder: 0,
          isPrimary: true,
        },
        select: {
          relativePath: true,
          width: true,
          height: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.PRODUCT,
          entityId: product.id,
          action: isTrusted
            ? "CREATE_PRODUCT_AUTO_APPROVED"
            : "CREATE_PRODUCT_PENDING",
          metadata: {
            entrepreneurId: entrepreneur.id,
            entrepreneurBusinessName: entrepreneur.businessName,
            title: product.title,
            slug: product.slug,
            categoryId: category.id,
            categoryName: category.name,
            status: initialStatus,
            trustedAutoPublish: isTrusted,
            imageRelativePath: savedImage.relativePath,
            note: isTrusted
              ? "Producto publicado directamente por cuenta de confianza (USER_TRUSTED)."
              : "Producto cargado por el emprendedor y enviado a revisión municipal.",
          },
        },
      });

      return {
        ...product,
        images: [imageRecord],
      };
    });

    revalidateEntrepreneurAndCatalogSurfaces(createdProduct.slug);

    return NextResponse.json(
      {
        ok: true,
        publishedDirectly: isTrusted,
        product: mapPanelProductItem(createdProduct),
      },
      { status: 201 },
    );
  } catch {
    await removeUploadedProductImageVariants(savedImage);
    return NextResponse.json(
      {
        ok: false,
        error:
          "No pudimos guardar tu producto ahora. Intentá nuevamente en unos segundos.",
      },
      { status: 500 },
    );
  }
}
