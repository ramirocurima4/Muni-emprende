import {
  EntrepreneurStatus,
  ProductStatus,
  UserRole,
} from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { getUploadImageUrl } from "@/lib/images";
import { getSession, isEntrepreneurRole, type SessionPayload } from "@/lib/session";
import { slugifyText } from "@/lib/slug";

export interface PanelCategoryItem {
  id: string;
  name: string;
  slug: string;
  isGastronomy: boolean;
}

export interface PanelProductItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  ingredients: string | null;
  status: ProductStatus;
  rejectionReason: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  image: {
    relativePath: string;
    thumbUrl: string;
    fullUrl: string;
    width: number;
    height: number;
  } | null;
  createdAtIso: string;
}

export interface PanelEntrepreneurProfile {
  id: string;
  businessName: string;
  slug: string;
  ownerName: string;
  whatsappNumber: string;
  neighborhood: string;
  bio: string;
  avatarUrl: string | null;
  status: EntrepreneurStatus;
  rejectionReason: string | null;
  isTrusted: boolean;
  role: UserRole;
  username: string;
}

export interface AuthenticatedEntrepreneurContext {
  session: SessionPayload;
  isTrusted: boolean;
  entrepreneur: {
    id: string;
    userId: string;
    businessName: string;
    slug: string;
    ownerName: string;
    whatsappNumber: string;
    neighborhood: string | null;
    bio: string | null;
    avatarPath: string | null;
    isTrusted: boolean;
    status: EntrepreneurStatus;
    rejectionReason: string | null;
    user: {
      role: UserRole;
      username: string;
      isActive: boolean;
    };
  };
}

export class PanelAuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Obtiene y valida el emprendimiento del usuario autenticado leyendo el estado vivo en PostgreSQL
 * (incluyendo role y isTrusted actualizados).
 */
export async function requireAuthenticatedEntrepreneur(): Promise<AuthenticatedEntrepreneurContext> {
  const session = await getSession();
  if (!session) {
    throw new PanelAuthError(
      "Tu sesión se cerró. Volvé a ingresar con tu usuario.",
      401,
    );
  }

  if (!isEntrepreneurRole(session.role)) {
    throw new PanelAuthError(
      "Esta sección es solo para cuentas de emprendedores.",
      403,
    );
  }

  const entrepreneur = await db.entrepreneur.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      userId: true,
      businessName: true,
      slug: true,
      ownerName: true,
      whatsappNumber: true,
      neighborhood: true,
      bio: true,
      avatarPath: true,
      isTrusted: true,
      status: true,
      rejectionReason: true,
      user: {
        select: {
          role: true,
          username: true,
          isActive: true,
        },
      },
    },
  });

  if (!entrepreneur || !entrepreneur.user.isActive) {
    throw new PanelAuthError(
      "No encontramos una cuenta activa asociada a tu emprendimiento.",
      404,
    );
  }

  if (entrepreneur.status === EntrepreneurStatus.SUSPENDED) {
    throw new PanelAuthError(
      "Tu cuenta está suspendida temporalmente. Comunicate con el equipo de la Muni.",
      403,
    );
  }

  const isTrusted =
    entrepreneur.user.role === UserRole.USER_TRUSTED || entrepreneur.isTrusted;

  return {
    session,
    entrepreneur,
    isTrusted,
  };
}

/**
 * Determina si una categoría corresponde al rubro Gastronomía.
 */
export function isGastronomyCategory(category: {
  slug: string;
  name: string;
}): boolean {
  const slugLower = category.slug.toLowerCase();
  const nameLower = category.name.toLowerCase();
  return (
    slugLower === "gastronomia" ||
    slugLower.includes("gastronom") ||
    nameLower.includes("gastronom")
  );
}

/**
 * Mapea un producto de Prisma al formato limpio usado por el Panel del Emprendedor.
 */
export function mapPanelProductItem(product: {
  id: string;
  title: string;
  slug: string;
  description: string;
  ingredients: string | null;
  status: ProductStatus;
  rejectionReason: string | null;
  createdAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    relativePath: string;
    width: number;
    height: number;
  }>;
}): PanelProductItem {
  const primaryImage = product.images[0] ?? null;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    ingredients: product.ingredients,
    status: product.status,
    rejectionReason: product.rejectionReason,
    category: product.category,
    image: primaryImage
      ? {
          relativePath: primaryImage.relativePath,
          thumbUrl: getUploadImageUrl(primaryImage.relativePath, "thumb"),
          fullUrl: getUploadImageUrl(primaryImage.relativePath, "full"),
          width: primaryImage.width,
          height: primaryImage.height,
        }
      : null,
    createdAtIso: product.createdAt.toISOString(),
  };
}

export function mapPanelEntrepreneurProfile(
  context: AuthenticatedEntrepreneurContext,
): PanelEntrepreneurProfile {
  const { entrepreneur, isTrusted } = context;

  return {
    id: entrepreneur.id,
    businessName: entrepreneur.businessName,
    slug: entrepreneur.slug,
    ownerName: entrepreneur.ownerName,
    whatsappNumber: entrepreneur.whatsappNumber,
    neighborhood: entrepreneur.neighborhood ?? "",
    bio: entrepreneur.bio ?? "",
    avatarUrl: entrepreneur.avatarPath
      ? getUploadImageUrl(entrepreneur.avatarPath, "thumb")
      : null,
    status: entrepreneur.status,
    rejectionReason: entrepreneur.rejectionReason,
    isTrusted,
    role: entrepreneur.user.role,
    username: entrepreneur.user.username,
  };
}

/**
 * Carga productos y categorías activas para el panel del emprendedor.
 */
export async function loadEntrepreneurPanelCollections(entrepreneurId: string): Promise<{
  products: PanelProductItem[];
  categories: PanelCategoryItem[];
}> {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { entrepreneurId },
      orderBy: [{ createdAt: "desc" }],
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
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  return {
    products: products.map(mapPanelProductItem),
    categories: categories.map((cat) => ({
      ...cat,
      isGastronomy: isGastronomyCategory(cat),
    })),
  };
}

/**
 * Genera un slug único para un producto a partir de su título.
 */
export async function generateUniqueProductSlug(title: string): Promise<string> {
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
 * Invalida cachés públicas y rutas del panel tras una mutación de emprendimiento o producto.
 */
export function revalidateEntrepreneurAndCatalogSurfaces(
  productSlug?: string | null,
): void {
  revalidateTag("public-catalog", { expire: 0 });
  revalidateTag("public-products", { expire: 0 });
  revalidateTag("public-categories", { expire: 0 });
  if (productSlug) {
    revalidateTag(`product-${productSlug}`, { expire: 0 });
    revalidatePath(`/productos/${productSlug}`);
  }
  revalidatePath("/mi-emprendimiento");
  revalidatePath("/dashboard");
  revalidatePath("/catalogo");
  revalidatePath("/");
  revalidatePath("/admin");
}
