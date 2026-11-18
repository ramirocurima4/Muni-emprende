import { Download, MessageCircle, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import { EntrepreneurRowActions } from "@/components/admin/EntrepreneurRowActions";
import {
  ADMIN_INPUT_CLASS,
  BTN_PRIMARY,
  BTN_SECONDARY,
  EmptyState,
  PageHeader,
  Pagination,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import {
  ENTREPRENEUR_STATUS_LABELS,
  formatDate,
  formatWhatsappDisplay,
} from "@/lib/admin-labels";
import { requireAdminPage } from "@/lib/server/admin-auth";
import { searchEntrepreneurs } from "@/lib/server/admin-data";
import { entrepreneursFilterSchema } from "@/lib/validations/admin";

export const metadata: Metadata = {
  title: "Emprendedores · Panel de Administración",
};

interface EntrepreneursPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function EntrepreneursPage({
  searchParams,
}: EntrepreneursPageProps) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EntrepreneursContent searchParams={searchParams} />
    </Suspense>
  );
}

async function EntrepreneursContent({
  searchParams,
}: EntrepreneursPageProps) {
  await requireAdminPage();

  const raw = await searchParams;
  const normalized = {
    q: Array.isArray(raw.q) ? raw.q[0] : raw.q,
    estado: Array.isArray(raw.estado) ? raw.estado[0] : raw.estado,
    permiso: Array.isArray(raw.permiso) ? raw.permiso[0] : raw.permiso,
    pagina: Array.isArray(raw.pagina) ? raw.pagina[0] : raw.pagina,
  };

  const filter = entrepreneursFilterSchema.parse(normalized);
  const { total, totalPages, rows } = await searchEntrepreneurs(filter);

  const exportParams = new URLSearchParams();
  if (filter.q) exportParams.set("q", filter.q);
  if (filter.estado) exportParams.set("estado", filter.estado);
  if (filter.permiso) exportParams.set("permiso", filter.permiso);
  const exportUrl = `/api/admin/export/emprendedores${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Emprendedores y Confianza"
        description="Buscá emprendimientos, cambiá el permiso entre revisión previa y publicación directa, blanqueá contraseñas o suspendé cuentas."
        actions={
          <a href={exportUrl} download className={BTN_SECONDARY}>
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Exportar listado (CSV)</span>
          </a>
        }
      />

      {/* Buscador y filtros */}
      <Panel>
        <form
          method="GET"
          action="/admin/emprendedores"
          className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end"
        >
          <div className="md:col-span-5">
            <label
              htmlFor="search-q"
              className="block text-xs font-extrabold uppercase tracking-wider text-brand-muted"
            >
              Buscar emprendimiento, dueño, barrio, usuario o WhatsApp
            </label>
            <div className="relative">
              <input
                id="search-q"
                name="q"
                type="search"
                defaultValue={filter.q ?? ""}
                placeholder="Ej. Doña Rosa, Centro, 3777..."
                className={ADMIN_INPUT_CLASS}
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="filter-estado"
              className="block text-xs font-extrabold uppercase tracking-wider text-brand-muted"
            >
              Estado
            </label>
            <select
              id="filter-estado"
              name="estado"
              defaultValue={filter.estado ?? ""}
              className={ADMIN_INPUT_CLASS}
            >
              <option value="">Todos</option>
              <option value="APPROVED">Activos</option>
              <option value="PENDING">Por habilitar</option>
              <option value="REJECTED">Con correcciones</option>
              <option value="SUSPENDED">Suspendidos</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="filter-permiso"
              className="block text-xs font-extrabold uppercase tracking-wider text-brand-muted"
            >
              Publicación
            </label>
            <select
              id="filter-permiso"
              name="permiso"
              defaultValue={filter.permiso ?? ""}
              className={ADMIN_INPUT_CLASS}
            >
              <option value="">Todos</option>
              <option value="NEW">Con revisión (USER_NEW)</option>
              <option value="TRUSTED">Directa (USER_TRUSTED)</option>
            </select>
          </div>

          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className={`${BTN_PRIMARY} flex-1`}>
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Buscar</span>
            </button>
            {filter.q || filter.estado || filter.permiso ? (
              <Link href="/admin/emprendedores" className={BTN_SECONDARY}>
                Limpiar
              </Link>
            ) : null}
          </div>
        </form>
      </Panel>

      {/* Padrón */}
      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-brand-ink">
            {total} {total === 1 ? "emprendimiento" : "emprendimientos"} encontrados
          </p>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No encontramos emprendimientos con esos filtros"
            description="Probá limpiando la búsqueda o eligiendo otro estado."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-xs uppercase tracking-wider text-brand-muted">
                  <th className="py-3 pr-4">Emprendimiento</th>
                  <th className="py-3 px-4">Contacto y zona</th>
                  <th className="py-3 px-4">Estado y permiso</th>
                  <th className="py-3 px-4">Productos</th>
                  <th className="py-3 pl-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/70">
                {rows.map((row) => {
                  const statusInfo =
                    ENTREPRENEUR_STATUS_LABELS[row.status] ?? {
                      label: row.status,
                      tone: "neutral" as const,
                    };

                  return (
                    <tr key={row.id} className="align-top">
                      <td className="py-4 pr-4">
                        <p className="font-extrabold text-brand-ink">
                          {row.businessName}
                        </p>
                        <p className="text-xs text-brand-muted">
                          {row.ownerName} ·{" "}
                          <span className="font-mono">@{row.user.username}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-brand-muted">
                          Alta: {formatDate(row.createdAt)}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <a
                          href={`https://wa.me/${row.whatsappNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{formatWhatsappDisplay(row.whatsappNumber)}</span>
                        </a>
                        <p className="mt-1 text-xs text-brand-muted">
                          {row.neighborhood || "Sin barrio cargado"}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge
                            label={statusInfo.label}
                            tone={statusInfo.tone}
                          />
                          <StatusBadge
                            label={
                              row.trusted
                                ? "Publicación directa"
                                : "Con revisión previa"
                            }
                            tone={row.trusted ? "green" : "amber"}
                          />
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-brand-muted">
                        <p>
                          <strong className="text-brand-ink">
                            {row.publishedProducts}
                          </strong>{" "}
                          publicados
                        </p>
                        {row.pendingProducts > 0 ? (
                          <p className="font-semibold text-brand-amber-text">
                            {row.pendingProducts} en revisión
                          </p>
                        ) : null}
                      </td>

                      <td className="py-4 pl-4">
                        <EntrepreneurRowActions
                          entrepreneurId={row.id}
                          userId={row.user.id}
                          businessName={row.businessName}
                          username={row.user.username}
                          trusted={row.trusted}
                          suspended={row.status === "SUSPENDED"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={filter.pagina}
          totalPages={totalPages}
          basePath="/admin/emprendedores"
          params={{
            q: filter.q,
            estado: filter.estado,
            permiso: filter.permiso,
          }}
        />
      </Panel>
    </div>
  );
}
