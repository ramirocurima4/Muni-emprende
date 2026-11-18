import {
  AlertTriangle,
  ArrowRight,
  Camera,
  ClipboardCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  EmptyState,
  PageHeader,
  Panel,
  SectionTitle,
  StatCard,
  StatusBadge,
} from "@/components/admin/ui";
import {
  describeAuditAction,
  ENTITY_TYPE_LABELS,
  formatDateTime,
} from "@/lib/admin-labels";
import { requireAdminPage } from "@/lib/server/admin-auth";
import {
  auditTargetName,
  getAdminOverview,
  getCategoryOffer,
  getRecentActivity,
} from "@/lib/server/admin-data";

export const metadata: Metadata = {
  title: "Inicio · Panel de Administración",
};

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminHomeContent />
    </Suspense>
  );
}

async function AdminHomeContent() {
  const admin = await requireAdminPage();

  const [overview, categories, recentActivity] = await Promise.all([
    getAdminOverview(),
    getCategoryOffer(),
    getRecentActivity(8),
  ]);

  const totalPending =
    overview.productsPending + overview.entrepreneursPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de Administración"
        description={`Bienvenido/a @${admin.username}. Resumen general de MuniEmprende San Roque.`}
        actions={
          <>
            <Link href="/admin/moderacion" className={BTN_PRIMARY}>
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              <span>
                {totalPending > 0
                  ? `Revisar pendientes (${totalPending})`
                  : "Ir a Moderación"}
              </span>
            </Link>
            <Link href="/admin/galeria" className={BTN_SECONDARY}>
              <Camera className="h-4 w-4" aria-hidden="true" />
              <span>Subir foto de Expo</span>
            </Link>
          </>
        }
      />

      {/* 4 tarjetas principales */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Productos por revisar"
          value={overview.productsPending}
          tone={overview.productsPending > 0 ? "amber" : "green"}
          hint={
            overview.oldestPendingProductAt
              ? `El más antiguo: ${formatDateTime(overview.oldestPendingProductAt)}`
              : "Sin productos en espera"
          }
          href="/admin/moderacion"
        />
        <StatCard
          label="Emprendimientos por habilitar"
          value={overview.entrepreneursPending}
          tone={overview.entrepreneursPending > 0 ? "amber" : "green"}
          hint={
            overview.entrepreneursPending > 0
              ? "Esperan verificación de la Muni"
              : "Todos revisados"
          }
          href="/admin/moderacion#emprendimientos"
        />
        <StatCard
          label="Emprendimientos activos"
          value={overview.entrepreneursActive}
          tone="green"
          hint={`${overview.entrepreneursTrusted} con publicación directa`}
          href="/admin/emprendedores"
        />
        <StatCard
          label="Productos publicados"
          value={overview.productsPublished}
          tone="sky"
          hint={`${overview.expoPhotosPublished} fotos en la Galería de Expos`}
          href="/admin/metricas"
        />
      </div>

      {/* Alerta de rubros vacíos */}
      {overview.emptyCategories.length > 0 ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-3xl border border-brand-amber/60 bg-brand-amber-soft px-5 py-4 text-sm text-brand-amber-text"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-extrabold">
              Hay {overview.emptyCategories.length}{" "}
              {overview.emptyCategories.length === 1
                ? "rubro sin productos publicados"
                : "rubros sin productos publicados"}
            </p>
            <p className="text-xs leading-relaxed">
              Todavía no tienen oferta visible en el catálogo:{" "}
              <strong>
                {overview.emptyCategories.map((c) => c.name).join(", ")}
              </strong>
              . Es una buena oportunidad para invitar emprendedores de esos rubros.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Oferta por rubro */}
        <Panel>
          <SectionTitle
            title="Oferta por rubro"
            description="Productos visibles hoy en cada categoría."
          />

          <ul className="space-y-3">
            {categories.map((cat) => (
              <li key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-brand-ink">{cat.name}</span>
                  <span className="text-xs font-semibold text-brand-muted">
                    <strong className="text-brand-ink">
                      {cat.publishedProducts}
                    </strong>{" "}
                    {cat.publishedProducts === 1 ? "producto" : "productos"} ·{" "}
                    {cat.entrepreneurs}{" "}
                    {cat.entrepreneurs === 1 ? "emprend." : "emprends."}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-sky-tint">
                  <div
                    className={`h-full rounded-full ${
                      cat.publishedProducts > 0
                        ? "bg-brand-green"
                        : "bg-brand-amber/50"
                    }`}
                    style={{
                      width: `${Math.max(cat.sharePercentage, cat.publishedProducts > 0 ? 6 : 0)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-3 border-t border-brand-border">
            <Link
              href="/admin/metricas"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-green hover:text-brand-green-dark"
            >
              <span>Ver métricas completas</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Panel>

        {/* Actividad reciente */}
        <Panel>
          <SectionTitle
            title="Últimos movimientos"
            description="Qué pasó recientemente en la plataforma."
          />

          {recentActivity.length === 0 ? (
            <EmptyState
              title="Sin movimientos recientes"
              description="Cuando se aprueben productos, se sumen emprendedores o se suban fotos aparecerán acá."
            />
          ) : (
            <ul className="divide-y divide-brand-border/70">
              {recentActivity.map((log) => {
                const info = describeAuditAction(log.action);
                const target = auditTargetName(log.metadata);
                const entityLabel =
                  ENTITY_TYPE_LABELS[log.entityType] ?? log.entityType;

                return (
                  <li key={log.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <StatusBadge label={info.label} tone={info.tone} />
                      <span className="shrink-0 text-xs text-brand-muted">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-brand-ink">
                      {target ?? entityLabel}
                      <span className="font-normal text-brand-muted">
                        {" "}
                        · {log.actor ? `@${log.actor.username}` : "Sistema"}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 pt-3 border-t border-brand-border">
            <Link
              href="/admin/actividad"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-green hover:text-brand-green-dark"
            >
              <span>Ver historial completo</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
