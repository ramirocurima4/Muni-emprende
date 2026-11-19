"use client";

import { useState } from "react";
import { ModerationRowActions } from "./ModerationRowActions";

export interface PendingEntrepreneurRow {
  id: string;
  businessName: string;
  slug: string;
  ownerName: string;
  email: string;
  whatsappNumber: string;
  neighborhood: string | null;
  bio: string | null;
  createdAtIso: string;
  createdAtFormatted: string;
}

export interface PendingProductRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryName: string;
  expiresAtFormatted: string | null;
  entrepreneurName: string;
  entrepreneurOwner: string;
  entrepreneurStatus: string;
  thumbUrl: string | null;
  imgWidth: number;
  imgHeight: number;
  createdAtFormatted: string;
}

export interface RejectedRecordRow {
  id: string;
  entityType: "ENTREPRENEUR" | "PRODUCT";
  titleOrBusiness: string;
  subtitle: string;
  rejectionReason: string;
  updatedAtFormatted: string;
}

export interface CategoryDistributionItem {
  id: string;
  name: string;
  slug: string;
  approvedProductsCount: number;
  pendingProductsCount: number;
  entrepreneursCount: number;
  sharePercentage: number;
}

export interface EntrepreneurDirectoryRow {
  id: string;
  businessName: string;
  slug: string;
  ownerName: string;
  email: string;
  whatsappNumber: string;
  neighborhood: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  productsCount: number;
  approvedAtFormatted: string | null;
  approverEmail: string | null;
}

export interface AuditLogRow {
  id: string;
  createdAtFormatted: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType:
    | "USER"
    | "ENTREPRENEUR"
    | "PRODUCT"
    | "CATEGORY"
    | "EXPO_PHOTO"
    | "FAIR_CONFIG"
    | "FAIR_ALBUM"
    | "SYSTEM_CONFIG";
  entityId: string;
  targetName: string;
  previousStatus: string | null;
  newStatus: string | null;
  rejectionReason: string | null;
  note: string | null;
}

export interface AdminOverviewStats {
  activeEntrepreneurs: number;
  pendingEntrepreneurs: number;
  rejectedEntrepreneurs: number;
  activeProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  expiringProductsCount: number;
  totalAuditEvents: number;
}

interface AdminCommandCenterProps {
  stats: AdminOverviewStats;
  pendingEntrepreneurs: PendingEntrepreneurRow[];
  pendingProducts: PendingProductRow[];
  rejectedRecords: RejectedRecordRow[];
  categoryDistribution: CategoryDistributionItem[];
  entrepreneurDirectory: EntrepreneurDirectoryRow[];
  auditLogs: AuditLogRow[];
}

type AdminTabId = "moderacion" | "estadisticas" | "auditoria";

function getActionBadgeStyle(action: string): {
  label: string;
  className: string;
} {
  switch (action) {
    case "APPROVE_ENTREPRENEUR":
      return {
        label: "Emprendedor Aprobado",
        className: "bg-[#DDE6DF] text-[#273B2C] border-[#3F5E47]/30",
      };
    case "REJECT_ENTREPRENEUR":
      return {
        label: "Emprendedor Rechazado",
        className: "bg-[#FDF2F2] text-[#7A1C1C] border-[#D98282]",
      };
    case "APPROVE_PRODUCT":
      return {
        label: "Producto Aprobado",
        className: "bg-[#DDE6DF] text-[#273B2C] border-[#3F5E47]/30",
      };
    case "REJECT_PRODUCT":
      return {
        label: "Producto Rechazado",
        className: "bg-[#FDF2F2] text-[#7A1C1C] border-[#D98282]",
      };
    case "REGISTER_PENDING":
      return {
        label: "Inscripción Emprendedor",
        className: "bg-[#FBF0E2] text-[#613406] border-[#D89B5B]",
      };
    case "SEED_APPROVE":
      return {
        label: "Alta Inicial Sistema",
        className: "bg-[#FAF7F2] text-[#5A615D] border-[#E6E1D6]",
      };
    default:
      return {
        label: action,
        className: "bg-[#FAF7F2] text-[#2C302E] border-[#E6E1D6]",
      };
  }
}

export function AdminCommandCenter({
  stats,
  pendingEntrepreneurs,
  pendingProducts,
  rejectedRecords,
  categoryDistribution,
  entrepreneurDirectory,
  auditLogs,
}: AdminCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>("moderacion");
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>("ALL");
  const [auditSearch, setAuditSearch] = useState<string>("");

  const totalPending = stats.pendingEntrepreneurs + stats.pendingProducts;

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditEntityFilter !== "ALL" && log.entityType !== auditEntityFilter) {
      return false;
    }
    if (auditSearch.trim().length > 0) {
      const q = auditSearch.toLowerCase();
      return (
        log.actorEmail.toLowerCase().includes(q) ||
        log.targetName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.rejectionReason?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const activeCategories = categoryDistribution.filter(
    (c) => c.approvedProductsCount > 0 || c.pendingProductsCount > 0,
  );

  return (
    <div className="space-y-6">
      {/* 1. BLOQUE SUPERIOR: MÉTRICAS Y OVERVIEW DE DISTRIBUCIÓN */}
      <section aria-label="Resumen general del portal" className="space-y-4">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Cola de Moderación */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A615D]">
                Cola de Moderación
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  totalPending > 0
                    ? "border border-[#D89B5B] bg-[#FBF0E2] text-[#613406]"
                    : "bg-[#DDE6DF] text-[#273B2C]"
                }`}
              >
                {totalPending > 0 ? "Requiere atención" : "Al día"}
              </span>
            </div>
            <p className="mt-3 text-3xl font-black text-[#2C302E]">
              {totalPending}
            </p>
            <p className="mt-1 text-xs text-[#5A615D]">
              <strong>{stats.pendingEntrepreneurs}</strong> emprendedores ·{" "}
              <strong>{stats.pendingProducts}</strong> productos en espera
            </p>
          </div>

          {/* Card 2: Emprendedores Activos */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A615D]">
                Emprendedores Activos
              </span>
              <span className="inline-flex rounded-full bg-[#DDE6DF] px-2.5 py-0.5 text-[11px] font-bold text-[#273B2C]">
                APPROVED
              </span>
            </div>
            <p className="mt-3 text-3xl font-black text-[#3F5E47]">
              {stats.activeEntrepreneurs}
            </p>
            <p className="mt-1 text-xs text-[#5A615D]">
              Habilitados en la feria ({stats.rejectedEntrepreneurs} observados)
            </p>
          </div>

          {/* Card 3: Productos Publicados */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A615D]">
                Productos Publicados
              </span>
              <span className="inline-flex rounded-full bg-[#DDE6DF] px-2.5 py-0.5 text-[11px] font-bold text-[#273B2C]">
                En Vidriera
              </span>
            </div>
            <p className="mt-3 text-3xl font-black text-[#3F5E47]">
              {stats.activeProducts}
            </p>
            <p className="mt-1 text-xs text-[#5A615D]">
              Vigentes hoy ({stats.expiringProductsCount} con vencimiento
              temporal)
            </p>
          </div>

          {/* Card 4: Distribución por Categorías (Resumen rápido) */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A615D]">
                Rubros con Oferta
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("estadisticas")}
                className="text-[11px] font-bold text-[#3F5E47] underline hover:text-[#273B2C]"
              >
                Ver desglose →
              </button>
            </div>
            <p className="mt-3 text-3xl font-black text-[#2C302E]">
              {activeCategories.length}{" "}
              <span className="text-base font-bold text-[#5A615D]">
                / {categoryDistribution.length}
              </span>
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {categoryDistribution.slice(0, 3).map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center rounded-md bg-[#FAF7F2] px-1.5 py-0.5 text-[10px] font-semibold text-[#5A615D]"
                >
                  {cat.name}: {cat.approvedProductsCount}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. BARRA DE PESTAÑAS (TABS) */}
      <div
        role="tablist"
        aria-label="Secciones del panel de administración"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E6E1D6] bg-[#FDFCFA] p-1.5 shadow-2xs"
      >
        <button
          type="button"
          role="tab"
          id="tab-moderacion"
          aria-selected={activeTab === "moderacion"}
          aria-controls="panel-moderacion"
          onClick={() => setActiveTab("moderacion")}
          className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors ${
            activeTab === "moderacion"
              ? "bg-[#3F5E47] text-white shadow-2xs"
              : "text-[#2C302E] hover:bg-[#FAF7F2]"
          }`}
        >
          <span>Moderación</span>
          <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold ${
              activeTab === "moderacion"
                ? "bg-white text-[#273B2C]"
                : totalPending > 0
                  ? "bg-[#FBF0E2] text-[#613406]"
                  : "bg-[#DDE6DF] text-[#273B2C]"
            }`}
          >
            {totalPending}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-estadisticas"
          aria-selected={activeTab === "estadisticas"}
          aria-controls="panel-estadisticas"
          onClick={() => setActiveTab("estadisticas")}
          className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors ${
            activeTab === "estadisticas"
              ? "bg-[#3F5E47] text-white shadow-2xs"
              : "text-[#2C302E] hover:bg-[#FAF7F2]"
          }`}
        >
          <span>Estadísticas y Rubros</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-auditoria"
          aria-selected={activeTab === "auditoria"}
          aria-controls="panel-auditoria"
          onClick={() => setActiveTab("auditoria")}
          className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors ${
            activeTab === "auditoria"
              ? "bg-[#3F5E47] text-white shadow-2xs"
              : "text-[#2C302E] hover:bg-[#FAF7F2]"
          }`}
        >
          <span>Auditoría (Quién hizo qué)</span>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
              activeTab === "auditoria"
                ? "bg-[#273B2C] text-[#DDE6DF]"
                : "bg-[#FAF7F2] text-[#5A615D]"
            }`}
          >
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* =====================================================================
          PANEL 1: MODERACIÓN (TABLAS DE EMPRENDEDORES Y PRODUCTOS PENDIENTES)
         ===================================================================== */}
      {activeTab === "moderacion" ? (
        <div
          id="panel-moderacion"
          role="tabpanel"
          aria-labelledby="tab-moderacion"
          className="space-y-6"
        >
          {/* Tabla de Emprendedores Pendientes */}
          <section className="rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-4 shadow-2xs sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E1D6] pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#2C302E]">
                  Solicitudes de Emprendedores en Estado PENDING (
                  {pendingEntrepreneurs.length})
                </h2>
                <p className="text-xs text-[#5A615D]">
                  Validá identidad local y número de WhatsApp antes de habilitar
                  el perfil en el catálogo municipal.
                </p>
              </div>
            </div>

            {pendingEntrepreneurs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-bold text-[#2C302E]">
                  No hay solicitudes de emprendedores pendientes.
                </p>
                <p className="mt-1 text-xs text-[#5A615D]">
                  Todas las inscripciones fueron procesadas por el equipo de
                  Modernización.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E1D6] text-[11px] uppercase tracking-wider text-[#5A615D]">
                      <th className="py-3 pr-4">Emprendimiento</th>
                      <th className="py-3 px-4">Titular y Contacto</th>
                      <th className="py-3 px-4">Zona y Descripción</th>
                      <th className="py-3 px-4">Fecha Alta</th>
                      <th className="py-3 pl-4 text-right">
                        Decisión Municipal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E1D6]">
                    {pendingEntrepreneurs.map((ent) => (
                      <tr key={ent.id} className="align-top">
                        <td className="py-4 pr-4">
                          <span className="inline-flex rounded-full border border-[#D89B5B] bg-[#FBF0E2] px-2 py-0.5 text-[10px] font-bold text-[#613406]">
                            PENDING
                          </span>
                          <p className="mt-1 text-sm font-extrabold text-[#2C302E]">
                            {ent.businessName}
                          </p>
                          <p className="text-[11px] text-[#5A615D]">
                            /{ent.slug}
                          </p>
                        </td>

                        <td className="py-4 px-4 space-y-1">
                          <p className="font-bold text-[#2C302E]">
                            {ent.ownerName}
                          </p>
                          <p className="text-[#5A615D]">{ent.email}</p>
                          <p>
                            <a
                              href={`https://wa.me/${ent.whatsappNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-[#3F5E47] underline hover:text-[#273B2C]"
                            >
                              WhatsApp: +{ent.whatsappNumber} ↗
                            </a>
                          </p>
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          <p className="font-semibold text-[#2C302E]">
                            {ent.neighborhood ?? "Sin barrio especificado"}
                          </p>
                          {ent.bio ? (
                            <p className="mt-1 line-clamp-3 rounded-xl bg-[#FAF7F2] p-2 text-[11px] leading-relaxed text-[#5A615D]">
                              {ent.bio}
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] italic text-[#5A615D]">
                              Sin biografía cargada
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap py-4 px-4 text-[#5A615D]">
                          {ent.createdAtFormatted}
                        </td>

                        <td className="py-4 pl-4 text-right">
                          <ModerationRowActions
                            entityId={ent.id}
                            entityType="ENTREPRENEUR"
                            entityLabel={`emprendedor ${ent.businessName}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Tabla de Productos Pendientes */}
          <section className="rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-4 shadow-2xs sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E1D6] pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#2C302E]">
                  Publicaciones de Productos en Estado PENDING (
                  {pendingProducts.length})
                </h2>
                <p className="text-xs text-[#5A615D]">
                  Verificá que las imágenes y descripciones cumplan las normas de
                  convivencia de la feria municipal.
                </p>
              </div>
            </div>

            {pendingProducts.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-bold text-[#2C302E]">
                  No hay productos pendientes de moderación.
                </p>
                <p className="mt-1 text-xs text-[#5A615D]">
                  Cuando un emprendedor envíe un producto nuevo o modifique
                  título/fotos, aparecerá en esta tabla.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E1D6] text-[11px] uppercase tracking-wider text-[#5A615D]">
                      <th className="py-3 pr-4">Producto</th>
                      <th className="py-3 px-4">Rubro y Precio</th>
                      <th className="py-3 px-4">Emprendedor</th>
                      <th className="py-3 px-4">Fecha Envío</th>
                      <th className="py-3 pl-4 text-right">
                        Decisión Municipal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E1D6]">
                    {pendingProducts.map((prod) => (
                      <tr key={prod.id} className="align-top">
                        <td className="py-4 pr-4">
                          <div className="flex items-start gap-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E6E1D6] bg-[#EAE4D8]">
                              {prod.thumbUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={prod.thumbUrl}
                                  alt={prod.title}
                                  width={prod.imgWidth}
                                  height={prod.imgHeight}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-[#5A615D]">
                                  Sin foto
                                </div>
                              )}
                            </div>
                            <div className="max-w-xs">
                              <p className="text-sm font-extrabold text-[#2C302E]">
                                {prod.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#5A615D]">
                                {prod.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 space-y-1">
                          <span className="inline-flex rounded-full bg-[#DDE6DF] px-2.5 py-0.5 text-[11px] font-bold text-[#273B2C]">
                            {prod.categoryName}
                          </span>
                          {prod.expiresAtFormatted ? (
                            <p className="text-[11px] font-semibold text-[#613406]">
                              Vence: {prod.expiresAtFormatted}
                            </p>
                          ) : null}
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-bold text-[#2C302E]">
                            {prod.entrepreneurName}
                          </p>
                          <p className="text-[11px] text-[#5A615D]">
                            {prod.entrepreneurOwner}
                          </p>
                          <span className="mt-1 inline-flex rounded-md bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold text-[#5A615D]">
                            Estado: {prod.entrepreneurStatus}
                          </span>
                        </td>

                        <td className="whitespace-nowrap py-4 px-4 text-[#5A615D]">
                          {prod.createdAtFormatted}
                        </td>

                        <td className="py-4 pl-4 text-right">
                          <ModerationRowActions
                            entityId={prod.id}
                            entityType="PRODUCT"
                            entityLabel={`producto ${prod.title}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Registros observados / rechazados recientemente */}
          {rejectedRecords.length > 0 ? (
            <section className="rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-4 shadow-2xs sm:p-6">
              <h3 className="text-sm font-extrabold text-[#2C302E]">
                Registros Observados / Rechazados ({rejectedRecords.length})
              </h3>
              <p className="mt-0.5 text-xs text-[#5A615D]">
                Solicitudes que fueron rechazadas con motivo para corrección del
                emprendedor. Podés aprobarlas si ya subsanaron la observación.
              </p>
              <div className="mt-3 divide-y divide-[#E6E1D6]">
                {rejectedRecords.map((rec) => (
                  <div
                    key={`${rec.entityType}-${rec.id}`}
                    className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#FDF2F2] px-2 py-0.5 text-[10px] font-bold text-[#7A1C1C]">
                          {rec.entityType} REJECTED
                        </span>
                        <span className="text-xs font-bold text-[#2C302E]">
                          {rec.titleOrBusiness}
                        </span>
                        <span className="text-[11px] text-[#5A615D]">
                          ({rec.subtitle})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#7A1C1C]">
                        <strong>Motivo informado:</strong> &ldquo;
                        {rec.rejectionReason}&rdquo;
                      </p>
                    </div>
                    <ModerationRowActions
                      entityId={rec.id}
                      entityType={rec.entityType}
                      entityLabel={rec.titleOrBusiness}
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {/* =====================================================================
          PANEL 2: ESTADÍSTICAS Y DISTRIBUCIÓN POR CATEGORÍAS
         ===================================================================== */}
      {activeTab === "estadisticas" ? (
        <div
          id="panel-estadisticas"
          role="tabpanel"
          aria-labelledby="tab-estadisticas"
          className="space-y-6"
        >
          {/* Distribución por Categorías Oficiales */}
          <section className="rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-4 shadow-2xs sm:p-6">
            <h2 className="text-base sm:text-lg font-extrabold text-[#2C302E]">
              Distribución del Catálogo por Categorías Oficiales
            </h2>
            <p className="mt-0.5 text-xs text-[#5A615D]">
              Participación de cada rubro municipal sobre el total de productos
              publicados y en revisión.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categoryDistribution.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-[#E6E1D6] bg-[#FAF7F2] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-[#2C302E]">
                      {cat.name}
                    </span>
                    <span className="rounded-full bg-[#DDE6DF] px-2.5 py-0.5 text-xs font-bold text-[#273B2C]">
                      {cat.sharePercentage}% del catálogo
                    </span>
                  </div>

                  {/* Barra visual proporcional */}
                  <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#E6E1D6]">
                    <div
                      className="h-full rounded-full bg-[#3F5E47] transition-all"
                      style={{
                        width: `${Math.max(cat.sharePercentage, cat.approvedProductsCount > 0 ? 6 : 0)}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A615D]">
                    <span>
                      <strong className="text-[#2C302E]">
                        {cat.approvedProductsCount}
                      </strong>{" "}
                      publicados
                    </span>
                    <span>
                      <strong className="text-[#613406]">
                        {cat.pendingProductsCount}
                      </strong>{" "}
                      pendientes
                    </span>
                    <span>
                      <strong className="text-[#2C302E]">
                        {cat.entrepreneursCount}
                      </strong>{" "}
                      {cat.entrepreneursCount === 1
                        ? "emprendedor"
                        : "emprendedores"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Padrón General de Emprendedores */}
          <section className="rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-4 shadow-2xs sm:p-6">
            <h2 className="text-base sm:text-lg font-extrabold text-[#2C302E]">
              Padrón General de Emprendedores ({entrepreneurDirectory.length})
            </h2>
            <p className="mt-0.5 text-xs text-[#5A615D]">
              Listado completo de emprendimientos registrados en San Roque y su
              estado actual de habilitación.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6E1D6] text-[11px] uppercase tracking-wider text-[#5A615D]">
                    <th className="py-2.5 pr-4">Emprendimiento</th>
                    <th className="py-2.5 px-4">Titular / Email</th>
                    <th className="py-2.5 px-4">WhatsApp</th>
                    <th className="py-2.5 px-4">Estado</th>
                    <th className="py-2.5 px-4">Productos</th>
                    <th className="py-2.5 pl-4">Habilitación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D6]/70">
                  {entrepreneurDirectory.map((ent) => (
                    <tr key={ent.id} className="text-[#2C302E]">
                      <td className="py-3 pr-4">
                        <p className="font-bold">{ent.businessName}</p>
                        <p className="text-[11px] text-[#5A615D]">
                          {ent.neighborhood ?? "San Roque"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold">{ent.ownerName}</p>
                        <p className="text-[11px] text-[#5A615D]">{ent.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://wa.me/${ent.whatsappNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#3F5E47] underline"
                        >
                          +{ent.whatsappNumber}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            ent.status === "APPROVED"
                              ? "bg-[#DDE6DF] text-[#273B2C]"
                              : ent.status === "PENDING"
                                ? "bg-[#FBF0E2] text-[#613406]"
                                : "bg-[#FDF2F2] text-[#7A1C1C]"
                          }`}
                        >
                          {ent.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {ent.productsCount}
                      </td>
                      <td className="py-3 pl-4 text-[11px] text-[#5A615D]">
                        {ent.approvedAtFormatted ? (
                          <>
                            {ent.approvedAtFormatted}
                            {ent.approverEmail ? (
                              <span className="block">
                                por {ent.approverEmail}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {/* =====================================================================
          PANEL 3: VISOR DE AUDITORÍA ("EL QUIÉN HIZO QUÉ")
         ===================================================================== */}
      {activeTab === "auditoria" ? (
        <div
          id="panel-auditoria"
          role="tabpanel"
          aria-labelledby="tab-auditoria"
          className="space-y-4"
        >
          <section className="rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-4 shadow-2xs sm:p-6">
            <div className="flex flex-col gap-3 border-b border-[#E6E1D6] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#2C302E]">
                  Visor Oficial de Auditoría (`audit_logs`)
                </h2>
                <p className="text-xs text-[#5A615D]">
                  Trazabilidad completa de qué moderador o usuario ejecutó cada
                  acción, sobre qué entidad y en qué fecha exacta.
                </p>
              </div>

              {/* Controles de filtrado del visor de auditoría */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filtrar por tipo de entidad"
                  value={auditEntityFilter}
                  onChange={(e) => setAuditEntityFilter(e.target.value)}
                  className="rounded-xl border border-[#E6E1D6] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#2C302E] focus:border-[#3F5E47] focus:outline-none"
                >
                  <option value="ALL">Todas las entidades</option>
                  <option value="ENTREPRENEUR">Emprendedores</option>
                  <option value="PRODUCT">Productos</option>
                  <option value="USER">Usuarios</option>
                </select>

                <input
                  type="search"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Filtrar por moderador, emprendimiento..."
                  className="rounded-xl border border-[#E6E1D6] bg-[#FAF7F2] px-3 py-2 text-xs text-[#2C302E] placeholder:text-[#5A615D] focus:border-[#3F5E47] focus:outline-none"
                />
              </div>
            </div>

            {filteredAuditLogs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-bold text-[#2C302E]">
                  No se encontraron registros de auditoría con ese filtro.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E1D6] text-[11px] uppercase tracking-wider text-[#5A615D]">
                      <th className="py-3 pr-4">Fecha y Hora</th>
                      <th className="py-3 px-4">Moderador / Actor (Quién)</th>
                      <th className="py-3 px-4">Acción (Qué hizo)</th>
                      <th className="py-3 px-4">Entidad Afectada</th>
                      <th className="py-3 pl-4">Detalle / Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E1D6]/70">
                    {filteredAuditLogs.map((log) => {
                      const badge = getActionBadgeStyle(log.action);
                      return (
                        <tr key={log.id} className="align-top text-[#2C302E]">
                          <td className="whitespace-nowrap py-3.5 pr-4 font-mono text-[11px] text-[#5A615D]">
                            {log.createdAtFormatted}
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#2C302E]">
                              {log.actorEmail}
                            </p>
                            <span className="inline-flex rounded-md bg-[#FAF7F2] px-1.5 py-0.5 text-[10px] font-semibold text-[#5A615D]">
                              {log.actorRole}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            <p className="mt-0.5 font-mono text-[10px] text-[#5A615D]">
                              {log.action}
                            </p>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#2C302E]">
                              {log.targetName}
                            </p>
                            <p className="font-mono text-[10px] text-[#5A615D]">
                              {log.entityType} · #{log.entityId.slice(0, 8)}
                            </p>
                          </td>

                          <td className="py-3.5 pl-4 text-xs">
                            {log.previousStatus && log.newStatus ? (
                              <p className="font-semibold text-[#2C302E]">
                                {log.previousStatus} → {log.newStatus}
                              </p>
                            ) : null}
                            {log.rejectionReason ? (
                              <p className="mt-0.5 rounded-lg bg-[#FDF2F2] px-2.5 py-1 text-[11px] font-medium text-[#7A1C1C]">
                                Motivo: &ldquo;{log.rejectionReason}&rdquo;
                              </p>
                            ) : log.note ? (
                              <p className="text-[11px] text-[#5A615D]">
                                {log.note}
                              </p>
                            ) : (
                              <span className="text-[11px] text-[#5A615D]">
                                Sin observaciones
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
