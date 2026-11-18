import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
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
  describeAuditAction,
  ENTITY_TYPE_LABELS,
  formatDateTime,
} from "@/lib/admin-labels";
import { requireAdminPage } from "@/lib/server/admin-auth";
import {
  auditMetaString,
  auditTargetName,
  getAuditPage,
} from "@/lib/server/admin-data";
import { auditFilterSchema } from "@/lib/validations/admin";

export const metadata: Metadata = {
  title: "Actividad · Panel de Administración",
};

interface ActivityPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function ActivityPage({ searchParams }: ActivityPageProps) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ActivityContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ActivityContent({ searchParams }: ActivityPageProps) {
  await requireAdminPage();

  const raw = await searchParams;
  const normalized = {
    tipo: Array.isArray(raw.tipo) ? raw.tipo[0] : raw.tipo,
    q: Array.isArray(raw.q) ? raw.q[0] : raw.q,
    pagina: Array.isArray(raw.pagina) ? raw.pagina[0] : raw.pagina,
  };

  const filter = auditFilterSchema.parse(normalized);
  const { total, totalPages, rows } = await getAuditPage(filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de Actividad"
        description="Registro completo de aprobaciones, cambios de estado, usuarios creados, blanqueos de contraseña y fotos de Expo."
      />

      <Panel>
        <form
          method="GET"
          action="/admin/actividad"
          className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end"
        >
          <div className="md:col-span-6">
            <label
              htmlFor="audit-q"
              className="block text-xs font-extrabold uppercase tracking-wider text-brand-muted"
            >
              Buscar por usuario, emprendimiento, producto o acción
            </label>
            <input
              id="audit-q"
              name="q"
              type="search"
              defaultValue={filter.q ?? ""}
              placeholder="Ej. ramiro, aprobó, chipá..."
              className={ADMIN_INPUT_CLASS}
            />
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="audit-tipo"
              className="block text-xs font-extrabold uppercase tracking-wider text-brand-muted"
            >
              Tipo de registro
            </label>
            <select
              id="audit-tipo"
              name="tipo"
              defaultValue={filter.tipo ?? ""}
              className={ADMIN_INPUT_CLASS}
            >
              <option value="">Todos</option>
              <option value="PRODUCT">Productos</option>
              <option value="ENTREPRENEUR">Emprendimientos</option>
              <option value="USER">Usuarios</option>
              <option value="EXPO_PHOTO">Fotos de Expo</option>
              <option value="CATEGORY">Rubros</option>
            </select>
          </div>

          <div className="flex gap-2 md:col-span-3">
            <button type="submit" className={`${BTN_PRIMARY} flex-1`}>
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Filtrar</span>
            </button>
            {filter.q || filter.tipo ? (
              <Link href="/admin/actividad" className={BTN_SECONDARY}>
                Limpiar
              </Link>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel>
        <p className="mb-4 text-sm font-bold text-brand-ink">
          {total} {total === 1 ? "movimiento" : "movimientos"} registrados
        </p>

        {rows.length === 0 ? (
          <EmptyState
            title="No encontramos movimientos con ese filtro"
            description="Probá limpiando la búsqueda o cambiando el tipo."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-xs uppercase tracking-wider text-brand-muted">
                  <th className="py-3 pr-4">Fecha y hora</th>
                  <th className="py-3 px-4">Quién</th>
                  <th className="py-3 px-4">Qué hizo</th>
                  <th className="py-3 px-4">Sobre qué</th>
                  <th className="py-3 pl-4">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/70">
                {rows.map((log) => {
                  const actionInfo = describeAuditAction(log.action);
                  const targetName = auditTargetName(log.metadata);
                  const entityLabel =
                    ENTITY_TYPE_LABELS[log.entityType] ?? log.entityType;
                  const reason = auditMetaString(
                    log.metadata,
                    "rejectionReason",
                  );
                  const note = auditMetaString(log.metadata, "note");
                  const prev = auditMetaString(log.metadata, "previousStatus");
                  const next = auditMetaString(log.metadata, "newStatus");

                  return (
                    <tr key={log.id} className="align-top">
                      <td className="whitespace-nowrap py-3.5 pr-4 text-xs text-brand-muted">
                        {formatDateTime(log.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-bold text-brand-ink">
                          {log.actor ? `@${log.actor.username}` : "Sistema"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge
                          label={actionInfo.label}
                          tone={actionInfo.tone}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-bold text-brand-ink">
                          {targetName ?? entityLabel}
                        </p>
                        <p className="text-brand-muted">{entityLabel}</p>
                      </td>

                      <td className="py-3.5 pl-4 text-xs text-brand-muted">
                        {prev && next ? (
                          <p className="font-semibold text-brand-ink">
                            {prev} → {next}
                          </p>
                        ) : null}
                        {reason ? (
                          <p className="mt-0.5 rounded-lg bg-[#FDF2F2] px-2.5 py-1 font-medium text-[#7A1C1C]">
                            Motivo: &ldquo;{reason}&rdquo;
                          </p>
                        ) : note ? (
                          <p className="mt-0.5">{note}</p>
                        ) : null}
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
          basePath="/admin/actividad"
          params={{ tipo: filter.tipo, q: filter.q }}
        />
      </Panel>
    </div>
  );
}
