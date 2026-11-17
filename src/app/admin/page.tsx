import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { logoutAction } from "@/app/actions/auth";
import {
  AdminCommandCenter,
  type AdminOverviewStats,
  type AuditLogRow,
  type CategoryDistributionItem,
  type EntrepreneurDirectoryRow,
  type PendingEntrepreneurRow,
  type PendingProductRow,
  type RejectedRecordRow,
} from "@/components/admin/AdminCommandCenter";
import { db } from "@/lib/db";
import { getProductImageUrl } from "@/lib/images";
import { getSession } from "@/lib/session";
import { formatPriceArs } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Centro de Comando · Auditoría Municipal",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
          <div className="h-32 animate-pulse rounded-3xl bg-[#E6E1D6]/60" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="h-28 animate-pulse rounded-3xl bg-[#E6E1D6]/60" />
            <div className="h-28 animate-pulse rounded-3xl bg-[#E6E1D6]/60" />
            <div className="h-28 animate-pulse rounded-3xl bg-[#E6E1D6]/60" />
            <div className="h-28 animate-pulse rounded-3xl bg-[#E6E1D6]/60" />
          </div>
          <div className="h-80 animate-pulse rounded-3xl bg-[#E6E1D6]/60" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "ADMIN" && session.role !== "MODERATOR")
  ) {
    redirect("/login");
  }

  const now = new Date();

  const [
    allEntrepreneurs,
    allProducts,
    categories,
    rawAuditLogs,
    totalAuditEvents,
  ] = await Promise.all([
    db.entrepreneur.findMany({
      include: {
        user: { select: { email: true } },
        approver: { select: { email: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.product.findMany({
      include: {
        category: { select: { id: true, name: true, slug: true } },
        entrepreneur: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            status: true,
          },
        },
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { relativePath: true, width: true, height: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.auditLog.findMany({
      include: {
        actor: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.auditLog.count(),
  ]);

  // 1. Filtrar listas de moderación
  const pendingEntrepreneurs: PendingEntrepreneurRow[] = allEntrepreneurs
    .filter((e) => e.status === "PENDING")
    .map((e) => ({
      id: e.id,
      businessName: e.businessName,
      slug: e.slug,
      ownerName: e.ownerName,
      email: e.user.email,
      whatsappNumber: e.whatsappNumber,
      neighborhood: e.neighborhood,
      bio: e.bio,
      createdAtIso: e.createdAt.toISOString(),
      createdAtFormatted: dateFormatter.format(e.createdAt),
    }));

  const pendingProducts: PendingProductRow[] = allProducts
    .filter((p) => p.status === "PENDING")
    .map((p) => {
      const img = p.images[0];
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        priceFormatted: formatPriceArs(p.priceArs),
        categoryName: p.category.name,
        expiresAtFormatted: p.expiresAt
          ? dateFormatter.format(p.expiresAt)
          : null,
        entrepreneurName: p.entrepreneur.businessName,
        entrepreneurOwner: p.entrepreneur.ownerName,
        entrepreneurStatus: p.entrepreneur.status,
        thumbUrl: img ? getProductImageUrl(img.relativePath, "thumb") : null,
        imgWidth: img?.width ?? 200,
        imgHeight: img?.height ?? 200,
        createdAtFormatted: dateFormatter.format(p.createdAt),
      };
    });

  const rejectedRecords: RejectedRecordRow[] = [
    ...allEntrepreneurs
      .filter((e) => e.status === "REJECTED")
      .map((e) => ({
        id: e.id,
        entityType: "ENTREPRENEUR" as const,
        titleOrBusiness: e.businessName,
        subtitle: e.ownerName,
        rejectionReason: e.rejectionReason ?? "Sin motivo especificado",
        updatedAtFormatted: dateFormatter.format(e.updatedAt),
      })),
    ...allProducts
      .filter((p) => p.status === "REJECTED")
      .map((p) => ({
        id: p.id,
        entityType: "PRODUCT" as const,
        titleOrBusiness: p.title,
        subtitle: p.entrepreneur.businessName,
        rejectionReason: p.rejectionReason ?? "Sin motivo especificado",
        updatedAtFormatted: dateFormatter.format(p.updatedAt),
      })),
  ];

  // 2. Calcular métricas generales y distribución por categorías
  const activeProductsList = allProducts.filter(
    (p) =>
      p.status === "APPROVED" &&
      p.entrepreneur.status === "APPROVED" &&
      (!p.expiresAt || p.expiresAt > now),
  );

  const stats: AdminOverviewStats = {
    activeEntrepreneurs: allEntrepreneurs.filter((e) => e.status === "APPROVED")
      .length,
    pendingEntrepreneurs: pendingEntrepreneurs.length,
    rejectedEntrepreneurs: allEntrepreneurs.filter(
      (e) => e.status === "REJECTED",
    ).length,
    activeProducts: activeProductsList.length,
    pendingProducts: pendingProducts.length,
    rejectedProducts: allProducts.filter((p) => p.status === "REJECTED").length,
    expiringProductsCount: activeProductsList.filter((p) => p.expiresAt !== null)
      .length,
    totalAuditEvents,
  };

  const totalApprovedProducts = Math.max(activeProductsList.length, 1);

  const categoryDistribution: CategoryDistributionItem[] = categories.map(
    (cat) => {
      const catApproved = activeProductsList.filter(
        (p) => p.categoryId === cat.id,
      );
      const catPending = allProducts.filter(
        (p) => p.categoryId === cat.id && p.status === "PENDING",
      );
      const uniqueEntrepreneurs = new Set(
        catApproved.map((p) => p.entrepreneurId),
      );

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        approvedProductsCount: catApproved.length,
        pendingProductsCount: catPending.length,
        entrepreneursCount: uniqueEntrepreneurs.size,
        sharePercentage:
          activeProductsList.length > 0
            ? Math.round((catApproved.length / totalApprovedProducts) * 100)
            : 0,
      };
    },
  );

  // 3. Padrón de Emprendedores
  const entrepreneurDirectory: EntrepreneurDirectoryRow[] = allEntrepreneurs.map(
    (e) => ({
      id: e.id,
      businessName: e.businessName,
      slug: e.slug,
      ownerName: e.ownerName,
      email: e.user.email,
      whatsappNumber: e.whatsappNumber,
      neighborhood: e.neighborhood,
      status: e.status,
      productsCount: e._count.products,
      approvedAtFormatted: e.approvedAt
        ? dateFormatter.format(e.approvedAt)
        : null,
      approverEmail: e.approver?.email ?? null,
    }),
  );

  // 4. Visor de Auditoría (enriquecido con nombres de entidades y moderador)
  const entrepreneurNameById = new Map(
    allEntrepreneurs.map((e) => [e.id, e.businessName]),
  );
  const productNameById = new Map(allProducts.map((p) => [p.id, p.title]));

  const auditLogs: AuditLogRow[] = rawAuditLogs.map((log) => {
    const meta =
      log.metadata && typeof log.metadata === "object"
        ? (log.metadata as Record<string, unknown>)
        : {};

    const targetName =
      (typeof meta.businessName === "string" && meta.businessName) ||
      (typeof meta.title === "string" && meta.title) ||
      entrepreneurNameById.get(log.entityId) ||
      productNameById.get(log.entityId) ||
      `Registro #${log.entityId.slice(0, 8)}`;

    return {
      id: log.id,
      createdAtFormatted: dateFormatter.format(log.createdAt),
      actorEmail: log.actor?.email ?? "Sistema Automático",
      actorRole: log.actor?.role ?? "SYSTEM",
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      targetName,
      previousStatus:
        typeof meta.previousStatus === "string" ? meta.previousStatus : null,
      newStatus: typeof meta.newStatus === "string" ? meta.newStatus : null,
      rejectionReason:
        typeof meta.rejectionReason === "string" ? meta.rejectionReason : null,
      note: typeof meta.note === "string" ? meta.note : null,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3.5 py-6 sm:px-6 sm:py-8">
      {/* Cabecera Institucional del Centro de Comando */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-5 shadow-2xs sm:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-[#3F5E47] px-2.5 py-0.5 text-[11px] font-bold text-white">
              Centro de Comando · {session.role}
            </span>
            <span className="text-xs font-medium text-[#5A615D]">
              Moderador activo: <strong className="text-[#2C302E]">{session.email}</strong>
            </span>
          </div>
          <h1 className="mt-2 text-xl font-extrabold tracking-tight text-[#2C302E] sm:text-2xl">
            Dirección de Modernización y Empleo · San Roque
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#5A615D]">
            Gestión integral del padrón de emprendedores, moderación de
            publicaciones, estadísticas por rubro y auditoría de acciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2 text-xs font-bold text-[#2C302E] transition-colors hover:bg-[#DDE6DF] hover:text-[#273B2C]"
          >
            Ver Vidriera Pública ↗
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2 text-xs font-bold text-[#5A615D] transition-colors hover:border-[#D98282] hover:bg-[#FDF2F2] hover:text-[#7A1C1C]"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      {/* Centro de Comando con Pestañas (Moderación | Estadísticas | Auditoría) */}
      <AdminCommandCenter
        stats={stats}
        pendingEntrepreneurs={pendingEntrepreneurs}
        pendingProducts={pendingProducts}
        rejectedRecords={rejectedRecords}
        categoryDistribution={categoryDistribution}
        entrepreneurDirectory={entrepreneurDirectory}
        auditLogs={auditLogs}
      />
    </div>
  );
}
