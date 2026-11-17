import { EntrepreneurStatus, Prisma, ProductStatus } from "@prisma/client";
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
});

export type CatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>;

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
  priceArs: string | null;
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
}> {
  const normalizedInput = {
    q: Array.isArray(rawFilters.q) ? rawFilters.q[0] : rawFilters.q,
    categoria: Array.isArray(rawFilters.categoria)
      ? rawFilters.categoria[0]
      : rawFilters.categoria,
  };

  const parsed = catalogSearchParamsSchema.safeParse(normalizedInput);
  const filters: CatalogSearchParams = parsed.success
    ? parsed.data
    : { q: undefined, categoria: undefined };

  const products = await fetchCachedCatalogProducts(
    filters.q ?? "",
    filters.categoria ?? "",
  );

  return {
    products,
    activeQuery: filters.q,
    activeCategorySlug: filters.categoria,
  };
}

async function fetchCachedCatalogProducts(
  query: string,
  categorySlug: string,
): Promise<PublicProductCardItem[]> {
  "use cache";
  cacheTag("public-catalog", "public-products");
  cacheLife("minutes");

  const now = new Date();
  let matchingProductIds: string[] | undefined;

  if (query.length > 0) {
    const pattern = `%${query}%`;
    const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT p.id
      FROM products p
      INNER JOIN entrepreneurs e ON e.id = p.entrepreneur_id
      WHERE p.status = 'APPROVED'::"product_status"
        AND e.status = 'APPROVED'::"entrepreneur_status"
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
        AND (
          unaccent(p.title) ILIKE unaccent(${pattern})
          OR unaccent(p.description) ILIKE unaccent(${pattern})
          OR unaccent(e.business_name) ILIKE unaccent(${pattern})
          OR word_similarity(unaccent(${query}), unaccent(p.title)) > 0.35
        )
      ORDER BY
        word_similarity(unaccent(${query}), unaccent(p.title)) DESC,
        p.created_at DESC
      LIMIT 60
    `);

    matchingProductIds = rows.map((r) => r.id);
    if (matchingProductIds.length === 0) {
      return [];
    }
  }

  const products = await db.product.findMany({
    where: {
      status: ProductStatus.APPROVED,
      entrepreneur: {
        status: EntrepreneurStatus.APPROVED,
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
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
    orderBy: [{ createdAt: "desc" }],
    take: 48,
  });

  return products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    priceArs: p.priceArs ? p.priceArs.toString() : null,
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
  }));
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
    priceArs: product.priceArs ? product.priceArs.toString() : null,
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
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
    take: safeLimit,
  });

  return products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
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
  }));
}
