import {
  EntrepreneurStatus,
  Prisma,
  ProductStatus,
  UserRole,
} from "@prisma/client";
import { db } from "@/lib/db";
import { findAuditActionsByText } from "@/lib/admin-labels";
import type {
  AuditFilter,
  EntrepreneursFilter,
} from "@/lib/validations/admin";

export const ENTREPRENEURS_PAGE_SIZE = 25;
export const AUDIT_PAGE_SIZE = 30;

/** Un producto es "público" si está aprobado, su emprendimiento activo y no venció. */
function publishedProductWhere(now: Date): Prisma.ProductWhereInput {
  return {
    status: ProductStatus.APPROVED,
    entrepreneur: { status: EntrepreneurStatus.APPROVED },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

const TRUSTED_WHERE: Prisma.EntrepreneurWhereInput = {
  OR: [{ isTrusted: true }, { user: { role: UserRole.USER_TRUSTED } }],
};

export function isEntrepreneurTrusted(e: {
  isTrusted: boolean;
  user: { role: UserRole };
}): boolean {
  return e.isTrusted || e.user.role === UserRole.USER_TRUSTED;
}

// ============================================================================
// Rubros: oferta real y alertas de rubros vacíos
// ============================================================================

export interface CategoryOfferRow {
  id: string;
  name: string;
  slug: string;
  publishedProducts: number;
  entrepreneurs: number;
  pendingProducts: number;
  sharePercentage: number;
}

export async function getCategoryOffer(): Promise<CategoryOfferRow[]> {
  const now = new Date();

  const [categories, publishedByPair, pendingByCategory] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
    db.product.groupBy({
      by: ["categoryId", "entrepreneurId"],
      where: publishedProductWhere(now),
      _count: { _all: true },
    }),
    db.product.groupBy({
      by: ["categoryId"],
      where: { status: ProductStatus.PENDING },
      _count: { _all: true },
    }),
  ]);

  const publishedTotals = new Map<string, { products: number; people: number }>();
  for (const row of publishedByPair) {
    const current = publishedTotals.get(row.categoryId) ?? { products: 0, people: 0 };
    current.products += row._count._all;
    current.people += 1;
    publishedTotals.set(row.categoryId, current);
  }
  const pendingMap = new Map(
    pendingByCategory.map((row) => [row.categoryId, row._count._all]),
  );

  const totalPublished = Array.from(publishedTotals.values()).reduce(
    (sum, item) => sum + item.products,
    0,
  );

  return categories.map((cat) => {
    const totals = publishedTotals.get(cat.id) ?? { products: 0, people: 0 };
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      publishedProducts: totals.products,
      entrepreneurs: totals.people,
      pendingProducts: pendingMap.get(cat.id) ?? 0,
      sharePercentage:
        totalPublished > 0 ? Math.round((totals.products / totalPublished) * 100) : 0,
    };
  });
}

// ============================================================================
// Resumen del inicio
// ============================================================================

export interface AdminOverview {
  entrepreneursActive: number;
  entrepreneursPending: number;
  entrepreneursSuspended: number;
  entrepreneursTrusted: number;
  productsPublished: number;
  productsPending: number;
  productsCorrections: number;
  fairAlbumsPublished: number;
  oldestPendingProductAt: Date | null;
  emptyCategories: CategoryOfferRow[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const now = new Date();

  const [
    entrepreneursActive,
    entrepreneursPending,
    entrepreneursSuspended,
    entrepreneursTrusted,
    productsPublished,
    productsPending,
    productsCorrections,
    fairAlbumsPublished,
    oldestPending,
    categories,
  ] = await Promise.all([
    db.entrepreneur.count({ where: { status: EntrepreneurStatus.APPROVED } }),
    db.entrepreneur.count({ where: { status: EntrepreneurStatus.PENDING } }),
    db.entrepreneur.count({ where: { status: EntrepreneurStatus.SUSPENDED } }),
    db.entrepreneur.count({ where: TRUSTED_WHERE }),
    db.product.count({ where: publishedProductWhere(now) }),
    db.product.count({ where: { status: ProductStatus.PENDING } }),
    db.product.count({ where: { status: ProductStatus.REJECTED } }),
    db.fairAlbum.count({ where: { isPublished: true } }),
    db.product.findFirst({
      where: { status: ProductStatus.PENDING },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    getCategoryOffer(),
  ]);

  return {
    entrepreneursActive,
    entrepreneursPending,
    entrepreneursSuspended,
    entrepreneursTrusted,
    productsPublished,
    productsPending,
    productsCorrections,
    fairAlbumsPublished,
    oldestPendingProductAt: oldestPending?.createdAt ?? null,
    emptyCategories: categories.filter((c) => c.publishedProducts === 0),
  };
}

// ============================================================================
// Moderación
// ============================================================================

const moderationProductSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  ingredients: true,
  status: true,
  rejectionReason: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  entrepreneur: {
    select: {
      id: true,
      businessName: true,
      slug: true,
      ownerName: true,
      whatsappNumber: true,
      neighborhood: true,
      status: true,
      isTrusted: true,
      user: { select: { username: true, role: true } },
    },
  },
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    take: 1,
    select: { id: true, relativePath: true, width: true, height: true },
  },
} satisfies Prisma.ProductSelect;

export type ModerationProduct = Prisma.ProductGetPayload<{
  select: typeof moderationProductSelect;
}>;

export async function getModerationQueue() {
  const [pendingProducts, pendingEntrepreneurs, correctionProducts, pausedProducts] =
    await Promise.all([
      db.product.findMany({
        where: { status: ProductStatus.PENDING },
        orderBy: { createdAt: "asc" },
        select: moderationProductSelect,
      }),
      db.entrepreneur.findMany({
        where: { status: EntrepreneurStatus.PENDING },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          businessName: true,
          ownerName: true,
          whatsappNumber: true,
          neighborhood: true,
          bio: true,
          createdAt: true,
          user: { select: { username: true } },
          _count: { select: { products: true } },
        },
      }),
      db.product.findMany({
        where: { status: ProductStatus.REJECTED },
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: moderationProductSelect,
      }),
      db.product.findMany({
        where: { status: ProductStatus.SUSPENDED },
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: moderationProductSelect,
      }),
    ]);

  return { pendingProducts, pendingEntrepreneurs, correctionProducts, pausedProducts };
}

// ============================================================================
// Emprendedores
// ============================================================================

/** Escapa `%`, `_` y `\` para usar el texto del buscador dentro de un LIKE. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

async function findEntrepreneurIdsByText(q: string): Promise<string[]> {
  const pattern = `%${escapeLike(q)}%`;
  const digits = q.replace(/\D/g, "");
  const digitsPattern = digits.length >= 3 ? `%${digits}%` : null;

  const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT e.id
    FROM entrepreneurs e
    JOIN users u ON u.id = e.user_id
    WHERE unaccent(lower(e.business_name)) LIKE unaccent(lower(${pattern}))
       OR unaccent(lower(e.owner_name)) LIKE unaccent(lower(${pattern}))
       OR unaccent(lower(COALESCE(e.neighborhood, ''))) LIKE unaccent(lower(${pattern}))
       OR lower(u.username) LIKE lower(${pattern})
       ${
         digitsPattern
           ? Prisma.sql`OR e.whatsapp_number LIKE ${digitsPattern}`
           : Prisma.empty
       }
    LIMIT 500
  `);

  return rows.map((row) => row.id);
}

function buildEntrepreneurWhere(
  filter: EntrepreneursFilter,
  ids: string[] | null,
): Prisma.EntrepreneurWhereInput {
  const and: Prisma.EntrepreneurWhereInput[] = [];

  if (ids) and.push({ id: { in: ids } });
  if (filter.estado) and.push({ status: filter.estado });
  if (filter.permiso === "TRUSTED") and.push(TRUSTED_WHERE);
  if (filter.permiso === "NEW") {
    and.push({
      isTrusted: false,
      user: { role: { not: UserRole.USER_TRUSTED } },
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function searchEntrepreneurs(filter: EntrepreneursFilter) {
  const ids = filter.q ? await findEntrepreneurIdsByText(filter.q) : null;
  const where = buildEntrepreneurWhere(filter, ids);

  const [total, rows] = await Promise.all([
    db.entrepreneur.count({ where }),
    db.entrepreneur.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (filter.pagina - 1) * ENTREPRENEURS_PAGE_SIZE,
      take: ENTREPRENEURS_PAGE_SIZE,
      select: {
        id: true,
        businessName: true,
        slug: true,
        ownerName: true,
        whatsappNumber: true,
        neighborhood: true,
        status: true,
        rejectionReason: true,
        isTrusted: true,
        createdAt: true,
        user: { select: { id: true, username: true, role: true, isActive: true } },
      },
    }),
  ]);

  const entrepreneurIds = rows.map((row) => row.id);
  const [publishedCounts, pendingCounts] = entrepreneurIds.length
    ? await Promise.all([
        db.product.groupBy({
          by: ["entrepreneurId"],
          where: { entrepreneurId: { in: entrepreneurIds }, status: ProductStatus.APPROVED },
          _count: { _all: true },
        }),
        db.product.groupBy({
          by: ["entrepreneurId"],
          where: { entrepreneurId: { in: entrepreneurIds }, status: ProductStatus.PENDING },
          _count: { _all: true },
        }),
      ])
    : [[], []];

  const publishedMap = new Map(publishedCounts.map((r) => [r.entrepreneurId, r._count._all]));
  const pendingMap = new Map(pendingCounts.map((r) => [r.entrepreneurId, r._count._all]));

  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / ENTREPRENEURS_PAGE_SIZE)),
    rows: rows.map((row) => ({
      ...row,
      trusted: isEntrepreneurTrusted(row),
      publishedProducts: publishedMap.get(row.id) ?? 0,
      pendingProducts: pendingMap.get(row.id) ?? 0,
    })),
  };
}

/** Todos los emprendimientos (sin paginar) para exportar a CSV, respetando los filtros. */
export async function listEntrepreneursForExport(filter: EntrepreneursFilter) {
  const ids = filter.q ? await findEntrepreneurIdsByText(filter.q) : null;
  const where = buildEntrepreneurWhere(filter, ids);

  const [rows, publishedCounts] = await Promise.all([
    db.entrepreneur.findMany({
      where,
      orderBy: [{ businessName: "asc" }],
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        whatsappNumber: true,
        neighborhood: true,
        status: true,
        isTrusted: true,
        createdAt: true,
        user: { select: { username: true, role: true } },
      },
    }),
    db.product.groupBy({
      by: ["entrepreneurId"],
      where: { status: ProductStatus.APPROVED },
      _count: { _all: true },
    }),
  ]);

  const publishedMap = new Map(publishedCounts.map((r) => [r.entrepreneurId, r._count._all]));

  return rows.map((row) => ({
    ...row,
    trusted: isEntrepreneurTrusted(row),
    publishedProducts: publishedMap.get(row.id) ?? 0,
  }));
}

export async function listProductsForExport() {
  return db.product.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      title: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      category: { select: { name: true } },
      entrepreneur: { select: { businessName: true, neighborhood: true } },
    },
  });
}

// ============================================================================
// Usuarios del equipo
// ============================================================================

export async function getStaffUsers() {
  return db.user.findMany({
    where: { role: { in: [UserRole.ADMIN, UserRole.MODERATOR] } },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

// ============================================================================
// Cartelera de Ferias y Galería Multimedia
// ============================================================================

export async function getFairConfigsForAdmin() {
  return db.fairConfig.findMany({
    orderBy: [{ fairType: "asc" }],
    select: {
      id: true,
      fairType: true,
      nextDate: true,
      schedule: true,
      location: true,
      mapsUrl: true,
      whatsappNumber: true,
      updatedAt: true,
      updatedBy: { select: { username: true } },
    },
  });
}

export async function getFairAlbumsForAdmin() {
  return db.fairAlbum.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      fairType: true,
      title: true,
      eventDate: true,
      location: true,
      description: true,
      isPublished: true,
      createdAt: true,
      uploadedBy: { select: { username: true } },
      media: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          mediaType: true,
          relativePath: true,
          width: true,
          height: true,
          sortOrder: true,
        },
      },
    },
  });
}

// ============================================================================
// Métricas
// ============================================================================

export interface WeeklyPoint {
  label: string;
  entrepreneurs: number;
  products: number;
}

export async function getMetrics() {
  const now = new Date();
  const weeks = 8;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const since = new Date(now.getTime() - weeks * weekMs);

  const [
    overview,
    categories,
    recentEntrepreneurs,
    recentProducts,
    topEntrepreneursRaw,
    neighborhoodsRaw,
    statusGroups,
  ] = await Promise.all([
    getAdminOverview(),
    getCategoryOffer(),
    db.entrepreneur.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.product.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.product.groupBy({
      by: ["entrepreneurId"],
      where: publishedProductWhere(now),
      _count: { _all: true },
      orderBy: { _count: { entrepreneurId: "desc" } },
      take: 5,
    }),
    db.entrepreneur.groupBy({
      by: ["neighborhood"],
      where: { status: EntrepreneurStatus.APPROVED, neighborhood: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { neighborhood: "desc" } },
      take: 6,
    }),
    db.product.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const weekly: WeeklyPoint[] = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(since.getTime() + i * weekMs);
    return {
      label: new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(start),
      entrepreneurs: 0,
      products: 0,
    };
  });

  const bucketFor = (date: Date) =>
    Math.min(weeks - 1, Math.max(0, Math.floor((date.getTime() - since.getTime()) / weekMs)));

  for (const item of recentEntrepreneurs) weekly[bucketFor(item.createdAt)].entrepreneurs += 1;
  for (const item of recentProducts) weekly[bucketFor(item.createdAt)].products += 1;

  const topIds = topEntrepreneursRaw.map((r) => r.entrepreneurId);
  const topEntrepreneurNames = topIds.length
    ? await db.entrepreneur.findMany({
        where: { id: { in: topIds } },
        select: { id: true, businessName: true, neighborhood: true },
      })
    : [];
  const nameMap = new Map(topEntrepreneurNames.map((e) => [e.id, e]));

  return {
    overview,
    categories,
    weekly,
    topEntrepreneurs: topEntrepreneursRaw.map((row) => ({
      id: row.entrepreneurId,
      businessName: nameMap.get(row.entrepreneurId)?.businessName ?? "—",
      neighborhood: nameMap.get(row.entrepreneurId)?.neighborhood ?? null,
      publishedProducts: row._count._all,
    })),
    neighborhoods: neighborhoodsRaw
      .filter((row) => row.neighborhood)
      .map((row) => ({ name: row.neighborhood as string, entrepreneurs: row._count._all })),
    productStatusCounts: Object.fromEntries(
      statusGroups.map((row) => [row.status, row._count._all]),
    ) as Partial<Record<ProductStatus, number>>,
  };
}

// ============================================================================
// Actividad (audit_logs)
// ============================================================================

export async function getAuditPage(filter: AuditFilter) {
  const and: Prisma.AuditLogWhereInput[] = [];

  if (filter.tipo) and.push({ entityType: filter.tipo });

  if (filter.q) {
    const matchedActions = findAuditActionsByText(filter.q);
    const or: Prisma.AuditLogWhereInput[] = [
      { actor: { username: { contains: filter.q, mode: "insensitive" } } },
      {
        metadata: { path: ["businessName"], string_contains: filter.q },
      },
      { metadata: { path: ["title"], string_contains: filter.q } },
      { metadata: { path: ["username"], string_contains: filter.q } },
    ];
    if (matchedActions.length > 0) or.push({ action: { in: matchedActions } });
    and.push({ OR: or });
  }

  const where: Prisma.AuditLogWhereInput = and.length > 0 ? { AND: and } : {};

  const [total, rows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.pagina - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { username: true, role: true } },
      },
    }),
  ]);

  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
    rows,
  };
}

export async function getRecentActivity(limit = 8) {
  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      metadata: true,
      createdAt: true,
      actor: { select: { username: true } },
    },
  });
}

/** Extrae un nombre legible del metadata de una entrada de actividad. */
export function auditTargetName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const meta = metadata as Record<string, unknown>;
  for (const key of ["businessName", "title", "username"]) {
    if (typeof meta[key] === "string" && meta[key]) return meta[key] as string;
  }
  return null;
}

export function auditMetaString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value ? value : null;
}
