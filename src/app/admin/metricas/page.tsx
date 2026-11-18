import { AlertTriangle, Download, Info, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import {
  BTN_SECONDARY,
  EmptyState,
  PageHeader,
  Panel,
  SectionTitle,
  StatCard,
  StatusBadge,
} from "@/components/admin/ui";
import { PRODUCT_STATUS_LABELS } from "@/lib/admin-labels";
import { requireAdminPage } from "@/lib/server/admin-auth";
import { getMetrics } from "@/lib/server/admin-data";

export const metadata: Metadata = {
  title: "Métricas · Panel de Administración",
};

export default function MetricsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <MetricsContent />
    </Suspense>
  );
}

async function MetricsContent() {
  await requireAdminPage();
  const {
    overview,
    categories,
    weekly,
    topEntrepreneurs,
    neighborhoods,
    productStatusCounts,
  } = await getMetrics();

  const maxWeekly = Math.max(
    1,
    ...weekly.map((w) => Math.max(w.entrepreneurs, w.products)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Métricas e Interacciones"
        description="Cómo se mueve el catálogo por rubro, barrio y semana (sin precios, contacto directo por WhatsApp)."
        actions={
          <a href="/api/admin/export/productos" download className={BTN_SECONDARY}>
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Exportar productos (CSV)</span>
          </a>
        }
      />

      {/* 4 indicadores principales */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Emprendimientos activos"
          value={overview.entrepreneursActive}
          tone="green"
          hint={`${overview.entrepreneursSuspended} suspendidos`}
        />
        <StatCard
          label="Productos publicados"
          value={overview.productsPublished}
          tone="sky"
          hint={`${overview.productsPending} esperando revisión`}
        />
        <StatCard
          label="Publicación directa"
          value={overview.entrepreneursTrusted}
          tone="green"
          hint="Cuentas con permiso USER_TRUSTED"
        />
        <StatCard
          label="Consultas por WhatsApp"
          value="En pausa"
          tone="neutral"
          hint="Todavía no se mide (estructura documentada)"
        />
      </div>

      {/* Nota sobre medición de clics a WhatsApp */}
      <div className="flex items-start gap-3 rounded-3xl border border-brand-sky/35 bg-white px-5 py-4 text-sm text-brand-ink shadow-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-sky-dark" aria-hidden="true" />
        <p className="leading-relaxed text-brand-muted">
          <strong className="text-brand-ink">Consultas por WhatsApp:</strong> por
          decisión del proyecto, los clics al botón de WhatsApp todavía no se
          registran en la base. La estructura queda documentada en{" "}
          <code className="rounded bg-brand-sky-tint px-1.5 py-0.5 text-xs font-bold text-brand-sky-dark">
            memory.md §7.2
          </code>{" "}
          para activarla cuando la Dirección decida medir interacciones.
        </p>
      </div>

      {/* Alerta de rubros vacíos */}
      {overview.emptyCategories.length > 0 ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-3xl border border-brand-amber/60 bg-brand-amber-soft px-5 py-4 text-sm text-brand-amber-text"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-extrabold">
              Rubros sin oferta publicada:{" "}
              {overview.emptyCategories.map((c) => c.name).join(", ")}
            </p>
            <p className="mt-0.5 text-xs">
              Ningún producto visible en el catálogo pertenece hoy a esos rubros.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Oferta por rubro */}
        <Panel className="lg:col-span-7">
          <SectionTitle
            title="Distribución por rubro"
            description="Productos publicados, emprendimientos con oferta y pendientes."
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-xs uppercase tracking-wider text-brand-muted">
                  <th className="py-2.5 pr-3">Rubro</th>
                  <th className="py-2.5 px-3">Publicados</th>
                  <th className="py-2.5 px-3">Emprends.</th>
                  <th className="py-2.5 px-3">En revisión</th>
                  <th className="py-2.5 pl-3">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/70">
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="py-3 pr-3 font-bold text-brand-ink">
                      {cat.name}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-brand-green-dark">
                      {cat.publishedProducts}
                    </td>
                    <td className="py-3 px-3 text-brand-muted">
                      {cat.entrepreneurs}
                    </td>
                    <td className="py-3 px-3 text-brand-amber-text font-semibold">
                      {cat.pendingProducts}
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-brand-sky-tint">
                          <div
                            className="h-full rounded-full bg-brand-green"
                            style={{ width: `${cat.sharePercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-brand-muted">
                          {cat.sharePercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Estado actual de los productos */}
        <Panel className="lg:col-span-5">
          <SectionTitle
            title="Productos según su estado"
            description="Fotografía completa de todos los productos cargados."
          />

          <ul className="space-y-2.5">
            {(
              ["APPROVED", "PENDING", "PAUSED", "REJECTED", "SUSPENDED"] as const
            ).map((status) => {
              const meta = PRODUCT_STATUS_LABELS[status];
              return (
                <li
                  key={status}
                  className="flex items-center justify-between rounded-2xl border border-brand-sky/25 bg-brand-cream/60 px-4 py-3"
                >
                  <StatusBadge label={meta.label} tone={meta.tone} />
                  <span className="text-lg font-black text-brand-ink">
                    {productStatusCounts[status] ?? 0}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {/* Evolución últimas 8 semanas */}
      <Panel>
        <SectionTitle
          title="Altas en las últimas 8 semanas"
          description="Nuevos emprendimientos y productos cargados por semana."
        />

        <div className="grid grid-cols-8 gap-3 pt-2">
          {weekly.map((point) => {
            const entPct = Math.round((point.entrepreneurs / maxWeekly) * 100);
            const prodPct = Math.round((point.products / maxWeekly) * 100);
            return (
              <div
                key={point.label}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="flex h-32 w-full items-end justify-center gap-1.5 rounded-2xl bg-brand-sky-tint/70 p-2">
                  <div
                    title={`${point.entrepreneurs} emprendimientos`}
                    className="w-4 rounded-t-md bg-brand-sky-dark"
                    style={{
                      height: `${Math.max(entPct, point.entrepreneurs > 0 ? 10 : 0)}%`,
                    }}
                  />
                  <div
                    title={`${point.products} productos`}
                    className="w-4 rounded-t-md bg-brand-green"
                    style={{
                      height: `${Math.max(prodPct, point.products > 0 ? 10 : 0)}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] font-bold text-brand-muted">
                  <p>{point.label}</p>
                  <p className="text-[10px] text-brand-ink">
                    {point.entrepreneurs}e · {point.products}p
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-5 text-xs font-bold text-brand-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-brand-sky-dark" />
            Emprendimientos nuevos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-brand-green" />
            Productos cargados
          </span>
        </div>
      </Panel>

      {/* Top emprendimientos y barrios */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <SectionTitle
            title="Emprendimientos con más oferta"
            description="Los 5 emprendimientos con más productos publicados hoy."
          />
          {topEntrepreneurs.length === 0 ? (
            <EmptyState title="Todavía no hay productos publicados" />
          ) : (
            <ul className="divide-y divide-brand-border">
              {topEntrepreneurs.map((item, index) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-extrabold text-brand-ink">
                      {index + 1}. {item.businessName}
                    </p>
                    {item.neighborhood ? (
                      <p className="text-xs text-brand-muted">
                        {item.neighborhood}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-brand-green-soft px-3 py-1 text-xs font-extrabold text-brand-green-dark">
                    {item.publishedProducts}{" "}
                    {item.publishedProducts === 1 ? "producto" : "productos"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <SectionTitle
            title="Presencia por barrio o zona"
            description="Emprendimientos activos que cargaron su ubicación."
          />
          {neighborhoods.length === 0 ? (
            <EmptyState title="Todavía no hay barrios cargados" />
          ) : (
            <ul className="divide-y divide-brand-border">
              {neighborhoods.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-ink">
                    <MapPin
                      className="h-4 w-4 text-brand-sky-dark"
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                  </span>
                  <span className="rounded-full bg-brand-sky-light px-3 py-1 text-xs font-extrabold text-brand-sky-dark">
                    {item.entrepreneurs}{" "}
                    {item.entrepreneurs === 1 ? "activo" : "activos"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
