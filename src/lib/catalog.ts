import {
  EntrepreneurStatus,
  Prisma,
  ProductStatus,
  UserRole,
} from "@prisma/client";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { db } from "./db";

export const catalogSearchParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  categoria: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]+$/)
    .optional()
    .catch(undefined),
  emprendedor: z
    .string()
    .trim()
    .max(180)
    .regex(/^[a-zA-Z0-9-]+$/)
    .optional()
    .catch(undefined),
});

export type CatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>;

export interface ActiveCatalogEntrepreneur {
  id: string;
  businessName: string;
  slug: string;
  neighborhood: string | null;
  avatarPath: string | null;
}

export type ExpirationBadgeType = "TODAY" | "TEMPORARY" | null;

export interface PublicCategoryItem {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
}

export interface PublicProductCardItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  isCombo: boolean;
  expiresAt: string | null;
  expirationBadge: ExpirationBadgeType;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  entrepreneur: {
    id: string;
    businessName: string;
    slug: string;
    whatsappNumber: string;
    neighborhood: string | null;
  };
  primaryImage: {
    id: string;
    relativePath: string;
    width: number;
    height: number;
  } | null;
}

function computeExpirationBadge(
  expiresAt: Date | null,
  referenceNow: Date,
): ExpirationBadgeType {
  if (!expiresAt) return null;
  const remainingMs = expiresAt.getTime() - referenceNow.getTime();
  if (remainingMs <= 0) return null;
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  return remainingMs <= twentyFourHoursMs ? "TODAY" : "TEMPORARY";
}

export async function getPublicCategories(): Promise<PublicCategoryItem[]> {
  "use cache";
  cacheTag("public-catalog", "public-categories");
  cacheLife("minutes");

  const now = new Date();

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          products: {
            where: {
              status: ProductStatus.APPROVED,
              entrepreneur: {
                status: EntrepreneurStatus.APPROVED,
              },
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
          },
        },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    sortOrder: cat.sortOrder,
    productCount: cat._count.products,
  }));
}

export async function getPublicCatalogProducts(
  rawFilters: Record<string, string | string[] | undefined>,
): Promise<{
  products: PublicProductCardItem[];
  activeQuery?: string;
  activeCategorySlug?: string;
  activeEntrepreneurParam?: string;
  activeEntrepreneur: ActiveCatalogEntrepreneur | null;
}> {
  const normalizedInput = {
    q: Array.isArray(rawFilters.q) ? rawFilters.q[0] : rawFilters.q,
    categoria: Array.isArray(rawFilters.categoria)
      ? rawFilters.categoria[0]
      : rawFilters.categoria,
    emprendedor: Array.isArray(rawFilters.emprendedor)
      ? rawFilters.emprendedor[0]
      : rawFilters.emprendedor,
  };

  const parsed = catalogSearchParamsSchema.safeParse(normalizedInput);
  const filters: CatalogSearchParams = parsed.success
    ? parsed.data
    : { q: undefined, categoria: undefined, emprendedor: undefined };

  const { products, activeEntrepreneur } = await fetchCachedCatalogProducts(
    filters.q ?? "",
    filters.categoria ?? "",
    filters.emprendedor ?? "",
  );

  return {
    products,
    activeQuery: filters.q,
    activeCategorySlug: filters.categoria,
    activeEntrepreneurParam: filters.emprendedor,
    activeEntrepreneur,
  };
}

async function fetchCachedCatalogProducts(
  query: string,
  categorySlug: string,
  entrepreneurParam: string,
): Promise<{
  products: PublicProductCardItem[];
  activeEntrepreneur: ActiveCatalogEntrepreneur | null;
}> {
  "use cache";
  cacheTag("public-catalog", "public-products", "public-entrepreneurs");
  cacheLife("minutes");

  const now = new Date();
  let activeEntrepreneur: ActiveCatalogEntrepreneur | null = null;

  if (entrepreneurParam.length > 0) {
    const isUuid = z.string().uuid().safeParse(entrepreneurParam).success;
    activeEntrepreneur = await db.entrepreneur.findFirst({
      where: {
        status: EntrepreneurStatus.APPROVED,
        user: { isActive: true },
        ...(isUuid
          ? { OR: [{ id: entrepreneurParam }, { slug: entrepreneurParam }] }
          : { slug: entrepreneurParam }),
      },
      select: {
        id: true,
        businessName: true,
        slug: true,
        neighborhood: true,
        avatarPath: true,
      },
    });

    if (!activeEntrepreneur) {
      return { products: [], activeEntrepreneur: null };
    }
  }

  let matchingProductIds: string[] | undefined;

  if (query.length > 0) {
    const pattern = `%${query}%`;
    const entrepreneurFilterSql = activeEntrepreneur
      ? Prisma.sql`AND e.id = ${activeEntrepreneur.id}::uuid`
      : Prisma.empty;
    const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT p.id
      FROM products p
      INNER JOIN entrepreneurs e ON e.id = p.entrepreneur_id
      INNER JOIN users u ON u.id = e.user_id
      WHERE p.status = 'APPROVED'::"product_status"
        AND e.status = 'APPROVED'::"entrepreneur_status"
        AND u.is_active = TRUE
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
        ${entrepreneurFilterSql}
        AND (
          unaccent(p.title) ILIKE unaccent(${pattern})
          OR unaccent(p.description) ILIKE unaccent(${pattern})
          OR unaccent(e.business_name) ILIKE unaccent(${pattern})
          OR word_similarity(unaccent(${query}), unaccent(p.title)) > 0.35
        )
      ORDER BY
        word_similarity(unaccent(${query}), unaccent(p.title)) DESC,
        p.updated_at DESC,
        p.created_at DESC
    `);

    matchingProductIds = rows.map((r) => r.id);
    if (matchingProductIds.length === 0) {
      return { products: [], activeEntrepreneur };
    }
  }

  const products = await db.product.findMany({
    where: {
      status: ProductStatus.APPROVED,
      entrepreneur: {
        status: EntrepreneurStatus.APPROVED,
        user: { isActive: true },
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(activeEntrepreneur ? { entrepreneurId: activeEntrepreneur.id } : {}),
      ...(categorySlug
        ? { category: { slug: categorySlug, isActive: true } }
        : {}),
      ...(matchingProductIds ? { id: { in: matchingProductIds } } : {}),
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      entrepreneur: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          whatsappNumber: true,
          neighborhood: true,
        },
      },
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: {
          id: true,
          relativePath: true,
          width: true,
          height: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { approvedAt: "desc" }, { createdAt: "desc" }],
  });

  return {
    activeEntrepreneur,
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      isCombo: p.isCombo,
      expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
      expirationBadge: computeExpirationBadge(p.expiresAt, now),
      category: {
        id: p.category.id,
        name: p.category.name,
        slug: p.category.slug,
      },
      entrepreneur: {
        id: p.entrepreneur.id,
        businessName: p.entrepreneur.businessName,
        slug: p.entrepreneur.slug,
        whatsappNumber: p.entrepreneur.whatsappNumber,
        neighborhood: p.entrepreneur.neighborhood,
      },
      primaryImage: p.images[0] ?? null,
    })),
  };
}

export async function getPublicProductBySlug(slug: string) {
  "use cache";
  cacheTag("public-catalog", `product-${slug}`);
  cacheLife("minutes");

  const cleanSlug = z.string().trim().min(1).max(200).safeParse(slug);
  if (!cleanSlug.success) return null;

  const now = new Date();

  const product = await db.product.findFirst({
    where: {
      slug: cleanSlug.data,
      status: ProductStatus.APPROVED,
      entrepreneur: {
        status: EntrepreneurStatus.APPROVED,
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      entrepreneur: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          ownerName: true,
          whatsappNumber: true,
          neighborhood: true,
          bio: true,
          hasPickup: true,
          hasDelivery: true,
          atFair: true,
        },
      },
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          relativePath: true,
          width: true,
          height: true,
          isPrimary: true,
        },
      },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    ingredients: product.ingredients,
    isCombo: product.isCombo,
    expiresAt: product.expiresAt ? product.expiresAt.toISOString() : null,
    expirationBadge: computeExpirationBadge(product.expiresAt, now),
    category: product.category,
    entrepreneur: product.entrepreneur,
    images: product.images,
  };
}

export interface FeaturedHomeProductItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  ingredients: string | null;
  isCombo: boolean;
  expirationBadge: ExpirationBadgeType;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  entrepreneur: {
    id: string;
    businessName: string;
    ownerName: string;
    slug: string;
    whatsappNumber: string;
    neighborhood: string | null;
    bio: string | null;
    hasPickup: boolean;
    hasDelivery: boolean;
    atFair: boolean;
  };
  primaryImage: {
    id: string;
    relativePath: string;
    width: number;
    height: number;
  } | null;
}

const HOME_PRODUCT_INCLUDE = {
  category: {
    select: { id: true, name: true, slug: true },
  },
  entrepreneur: {
    select: {
      id: true,
      businessName: true,
      ownerName: true,
      slug: true,
      whatsappNumber: true,
      neighborhood: true,
      bio: true,
      hasPickup: true,
      hasDelivery: true,
      atFair: true,
    },
  },
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
    select: {
      id: true,
      relativePath: true,
      width: true,
      height: true,
    },
  },
};

function mapHomeShowcaseProduct(
  p: {
    id: string;
    title: string;
    slug: string;
    description: string;
    ingredients: string | null;
    isCombo: boolean;
    expiresAt: Date | null;
    category: { id: string; name: string; slug: string };
    entrepreneur: {
      id: string;
      businessName: string;
      ownerName: string;
      slug: string;
      whatsappNumber: string;
      neighborhood: string | null;
      bio: string | null;
      hasPickup: boolean;
      hasDelivery: boolean;
      atFair: boolean;
    };
    images: Array<{
      id: string;
      relativePath: string;
      width: number;
      height: number;
    }>;
  },
  referenceNow: Date,
): FeaturedHomeProductItem {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    ingredients: p.ingredients,
    isCombo: p.isCombo,
    expirationBadge: computeExpirationBadge(p.expiresAt, referenceNow),
    category: p.category,
    entrepreneur: p.entrepreneur,
    primaryImage: p.images[0] ?? null,
  };
}

export async function getFeaturedHomeProducts(
  limit = 8,
): Promise<FeaturedHomeProductItem[]> {
  "use cache";
  cacheTag("public-catalog", "public-products");
  cacheLife("minutes");

  const safeLimit = Math.min(Math.max(limit, 1), 16);
  const now = new Date();

  const products = await db.product.findMany({
    where: {
      status: ProductStatus.APPROVED,
      entrepreneur: {
        status: EntrepreneurStatus.APPROVED,
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: HOME_PRODUCT_INCLUDE,
    orderBy: [{ updatedAt: "desc" }, { approvedAt: "desc" }, { createdAt: "desc" }],
    take: safeLimit,
  });

  return products.map((p) => mapHomeShowcaseProduct(p, now));
}

const HOME_CATALOG_MAX_PRODUCTS = 12;
const HOME_CATALOG_MAX_PER_ENTREPRENEUR = 2;

export async function getHomeShowcaseData(): Promise<{
  gastronomyProducts: FeaturedHomeProductItem[];
  catalogProducts: FeaturedHomeProductItem[];
  totalCatalogCount: number;
}> {
  "use cache";
  cacheTag("public-catalog", "public-products", "public-entrepreneurs");
  cacheLife("minutes");

  const now = new Date();
  const baseWhere = {
    status: ProductStatus.APPROVED,
    entrepreneur: {
      status: EntrepreneurStatus.APPROVED,
      user: { isActive: true },
    },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  const [gastronomyRaw, diverseIdRows, totalCatalogCount] = await Promise.all([
    db.product.findMany({
      where: {
        ...baseWhere,
        category: { slug: "gastronomia", isActive: true },
      },
      include: HOME_PRODUCT_INCLUDE,
      orderBy: [{ updatedAt: "desc" }, { expiresAt: "asc" }, { approvedAt: "desc" }],
      take: 8,
    }),
    db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      WITH ranked AS (
        SELECT
          p.id,
          p.updated_at,
          p.created_at,
          ROW_NUMBER() OVER (
            PARTITION BY p.entrepreneur_id
            ORDER BY p.updated_at DESC, p.approved_at DESC NULLS LAST, p.created_at DESC
          ) AS rn
        FROM products p
        INNER JOIN entrepreneurs e ON e.id = p.entrepreneur_id
        INNER JOIN users u ON u.id = e.user_id
        INNER JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'APPROVED'::"product_status"
          AND e.status = 'APPROVED'::"entrepreneur_status"
          AND u.is_active = TRUE
          AND c.is_active = TRUE
          AND (p.expires_at IS NULL OR p.expires_at > NOW())
      )
      SELECT id
      FROM ranked
      WHERE rn <= ${HOME_CATALOG_MAX_PER_ENTREPRENEUR}
      ORDER BY updated_at DESC, created_at DESC
      LIMIT ${HOME_CATALOG_MAX_PRODUCTS}
    `),
    db.product.count({
      where: {
        ...baseWhere,
        category: { isActive: true },
      },
    }),
  ]);

  const diverseIds = diverseIdRows.map((row) => row.id);
  const allCatalogRaw =
    diverseIds.length > 0
      ? await db.product.findMany({
          where: {
            id: { in: diverseIds },
          },
          include: HOME_PRODUCT_INCLUDE,
        })
      : [];

  const orderIndex = new Map(diverseIds.map((id, idx) => [id, idx]));
  allCatalogRaw.sort(
    (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0),
  );

  const gastronomyProducts = gastronomyRaw.map((p) =>
    mapHomeShowcaseProduct(p, now),
  );
  const catalogProducts = allCatalogRaw.map((p) =>
    mapHomeShowcaseProduct(p, now),
  );

  return { gastronomyProducts, catalogProducts, totalCatalogCount };
}

export interface PublicEntrepreneurShowcaseItem {
  id: string;
  businessName: string;
  slug: string;
  neighborhood: string | null;
  avatarPath: string | null;
  whatsappNumber: string;
  productCount: number;
}

export async function getPublicActiveEntrepreneurs(
  limit = 36,
): Promise<PublicEntrepreneurShowcaseItem[]> {
  "use cache";
  cacheTag("public-catalog", "public-entrepreneurs", "public-products");
  cacheLife("minutes");

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const now = new Date();

  const rows = await db.entrepreneur.findMany({
    where: {
      status: EntrepreneurStatus.APPROVED,
      user: { isActive: true },
      OR: [
        { isTrusted: true },
        { user: { role: UserRole.USER_TRUSTED } },
        {
          products: {
            some: {
              status: ProductStatus.APPROVED,
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
          },
        },
      ],
    },
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
    take: safeLimit,
    select: {
      id: true,
      businessName: true,
      slug: true,
      neighborhood: true,
      avatarPath: true,
      whatsappNumber: true,
      _count: {
        select: {
          products: {
            where: {
              status: ProductStatus.APPROVED,
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    businessName: row.businessName,
    slug: row.slug,
    neighborhood: row.neighborhood,
    avatarPath: row.avatarPath,
    whatsappNumber: row.whatsappNumber,
    productCount: row._count.products,
  }));
}

export interface PublicEntrepreneurStorefront {
  entrepreneur: {
    id: string;
    businessName: string;
    slug: string;
    ownerName: string;
    whatsappNumber: string;
    neighborhood: string | null;
    bio: string | null;
    avatarPath: string | null;
    hasPickup: boolean;
    hasDelivery: boolean;
    atFair: boolean;
  };
  products: FeaturedHomeProductItem[];
}

export async function getPublicEntrepreneurStorefront(
  slugOrId: string,
): Promise<PublicEntrepreneurStorefront | null> {
  "use cache";
  cacheTag("public-catalog", "public-entrepreneurs", "public-products");
  cacheLife("minutes");

  const clean = slugOrId.trim().slice(0, 180);
  if (!clean) return null;

  const isUuid = z.string().uuid().safeParse(clean).success;
  const now = new Date();

  const entrepreneur = await db.entrepreneur.findFirst({
    where: {
      status: EntrepreneurStatus.APPROVED,
      user: { isActive: true },
      ...(isUuid ? { OR: [{ id: clean }, { slug: clean }] } : { slug: clean }),
    },
    select: {
      id: true,
      businessName: true,
      slug: true,
      ownerName: true,
      whatsappNumber: true,
      neighborhood: true,
      bio: true,
      avatarPath: true,
      hasPickup: true,
      hasDelivery: true,
      atFair: true,
    },
  });

  if (!entrepreneur) return null;

  const productsRaw = await db.product.findMany({
    where: {
      entrepreneurId: entrepreneur.id,
      status: ProductStatus.APPROVED,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: HOME_PRODUCT_INCLUDE,
    orderBy: [{ updatedAt: "desc" }, { approvedAt: "desc" }, { createdAt: "desc" }],
  });

  return {
    entrepreneur,
    products: productsRaw.map((p) => mapHomeShowcaseProduct(p, now)),
  };
}
