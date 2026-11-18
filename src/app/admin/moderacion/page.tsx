import { MapPin, MessageCircle, Store } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import { ModerationActions } from "@/components/admin/ModerationActions";
import {
  EmptyState,
  PageHeader,
  Panel,
  SectionTitle,
  StatusBadge,
} from "@/components/admin/ui";
import {
  ENTREPRENEUR_STATUS_LABELS,
  formatDateTime,
  formatWhatsappDisplay,
} from "@/lib/admin-labels";
import { getProductImageUrl } from "@/lib/images";
import { requireAdminPage } from "@/lib/server/admin-auth";
import {
  getModerationQueue,
  type ModerationProduct,
} from "@/lib/server/admin-data";

export const metadata: Metadata = {
  title: "Moderación · Panel de Administración",
};

export default function ModerationPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ModerationContent />
    </Suspense>
  );
}

function ProductPreviewCard({
  product,
  actions,
}: {
  product: ModerationProduct;
  actions: Array<"approve" | "correct" | "pause" | "reactivate">;
}) {
  const image = product.images[0];
  const thumbUrl = image
    ? getProductImageUrl(image.relativePath, "thumb")
    : null;
  const entBadge =
    ENTREPRENEUR_STATUS_LABELS[product.entrepreneur.status] ?? {
      label: product.entrepreneur.status,
      tone: "neutral" as const,
    };

  return (
    <article className="grid grid-cols-1 gap-6 rounded-3xl border border-brand-sky/30 bg-white p-5 shadow-lg shadow-brand-sky/10 lg:grid-cols-12">
      {/* Vista previa exacta de tarjeta pública (sin precios) */}
      <div className="lg:col-span-5">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-brand-sky-dark">
          Vista previa en el catálogo
        </p>
        <div className="overflow-hidden rounded-[24px] border border-brand-sky/25 bg-brand-surface shadow-md">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-sky-tint">
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbUrl}
                alt={product.title}
                width={image?.width ?? 480}
                height={image?.height ?? 360}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-brand-muted">
                Sin foto
              </div>
            )}
            <span className="absolute top-2.5 left-2.5 rounded-full bg-brand-sky-light/95 px-2.5 py-0.5 text-xs font-bold text-brand-sky-dark">
              {product.category.name}
            </span>
          </div>

          <div className="space-y-2.5 p-4">
            <h3 className="text-base font-extrabold leading-snug text-brand-ink">
              {product.title}
            </h3>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted">
              <Store className="h-3.5 w-3.5 text-brand-green" aria-hidden="true" />
              <span className="text-brand-ink">{product.entrepreneur.businessName}</span>
              {product.entrepreneur.neighborhood ? (
                <span>· {product.entrepreneur.neighborhood}</span>
              ) : null}
            </div>
            <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-green/90 px-3 py-2 text-xs font-bold text-white">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Contactar por WhatsApp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle completo y acciones municipales */}
      <div className="flex flex-col justify-between gap-4 lg:col-span-7">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={`Emprendimiento: ${entBadge.label}`}
                tone={entBadge.tone}
              />
              <span className="text-xs font-semibold text-brand-muted">
                @{product.entrepreneur.user.username}
              </span>
            </div>
            <span className="text-xs text-brand-muted">
              Cargado el {formatDateTime(product.createdAt)}
            </span>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
              Descripción
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-ink">
              {product.description}
            </p>
          </div>

          {product.ingredients ? (
            <div className="rounded-2xl border border-brand-amber/35 bg-brand-amber-soft/60 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-amber-text">
                Ingredientes declarados
              </p>
              <p className="mt-1 text-sm text-brand-ink">{product.ingredients}</p>
            </div>
          ) : null}

          {product.rejectionReason ? (
            <div className="rounded-2xl border border-[#D98282] bg-[#FDF2F2] px-4 py-3 text-sm text-[#7A1C1C]">
              <strong>Motivo registrado:</strong> {product.rejectionReason}
            </div>
          ) : null}

          {product.entrepreneur.status === "PENDING" ? (
            <p className="rounded-2xl border border-brand-amber/40 bg-brand-amber-soft px-3.5 py-2.5 text-xs font-semibold text-brand-amber-text">
              Este emprendimiento todavía está pendiente de habilitación. Aunque
              apruebes el producto, no se verá en el catálogo hasta habilitar el
              emprendimiento abajo.
            </p>
          ) : null}
        </div>

        <ModerationActions
          entityId={product.id}
          kind="product"
          label={product.title}
          actions={actions}
        />
      </div>
    </article>
  );
}

async function ModerationContent() {
  await requireAdminPage();
  const {
    pendingProducts,
    pendingEntrepreneurs,
    correctionProducts,
    pausedProducts,
  } = await getModerationQueue();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Moderación y Control de Calidad"
        description="Revisá productos nuevos antes de que salgan al catálogo público y habilitá emprendimientos recién registrados."
      />

      {/* 1. Cola de productos pendientes */}
      <section aria-labelledby="productos-pendientes-heading" className="space-y-4">
        <SectionTitle
          title="Productos esperando revisión"
          description="Mirá la vista previa de la tarjeta, verificá foto y textos (sin precios) y elegí una acción."
          count={pendingProducts.length}
        />

        {pendingProducts.length === 0 ? (
          <EmptyState
            title="¡Al día! No hay productos pendientes"
            description="Todos los productos enviados por los emprendedores ya fueron revisados."
          />
        ) : (
          <div className="space-y-5">
            {pendingProducts.map((product) => (
              <ProductPreviewCard
                key={product.id}
                product={product}
                actions={["approve", "correct", "pause"]}
              />
            ))}
          </div>
        )}
      </section>

      {/* 2. Emprendimientos nuevos por habilitar */}
      <Panel id="emprendimientos">
        <SectionTitle
          title="Emprendimientos por habilitar"
          description="Cuentas recién registradas que esperan verificación de datos."
          count={pendingEntrepreneurs.length}
        />

        {pendingEntrepreneurs.length === 0 ? (
          <EmptyState
            title="No hay emprendimientos pendientes"
            description="Todas las inscripciones ya fueron revisadas."
          />
        ) : (
          <ul className="divide-y divide-brand-border">
            {pendingEntrepreneurs.map((ent) => (
              <li key={ent.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-brand-ink">
                        {ent.businessName}
                      </h3>
                      <span className="rounded-full bg-brand-sky-light px-2.5 py-0.5 text-xs font-bold text-brand-sky-dark">
                        @{ent.user.username}
                      </span>
                      <span className="text-xs text-brand-muted">
                        {ent._count.products}{" "}
                        {ent._count.products === 1 ? "producto" : "productos"} cargados
                      </span>
                    </div>

                    <p className="text-sm text-brand-ink">
                      Responsable: <strong>{ent.ownerName}</strong> · WhatsApp:{" "}
                      <a
                        href={`https://wa.me/${ent.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-brand-green underline"
                      >
                        {formatWhatsappDisplay(ent.whatsappNumber)}
                      </a>
                    </p>

                    {ent.neighborhood ? (
                      <p className="inline-flex items-center gap-1 text-xs font-semibold text-brand-muted">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{ent.neighborhood}</span>
                      </p>
                    ) : null}

                    {ent.bio ? (
                      <p className="max-w-2xl text-sm text-brand-muted">{ent.bio}</p>
                    ) : null}

                    <p className="text-xs text-brand-muted">
                      Registrado el {formatDateTime(ent.createdAt)}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <ModerationActions
                      entityId={ent.id}
                      kind="entrepreneur"
                      label={ent.businessName}
                      actions={["approve", "correct"]}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* 3. Con correcciones pedidas / Pausados */}
      {correctionProducts.length > 0 ? (
        <section className="space-y-4">
          <SectionTitle
            title="Productos con correcciones enviadas"
            description="El emprendedor ve tu observación y puede editarlo para volver a revisión."
            count={correctionProducts.length}
          />
          <div className="space-y-4">
            {correctionProducts.map((product) => (
              <ProductPreviewCard
                key={product.id}
                product={product}
                actions={["approve", "pause"]}
              />
            ))}
          </div>
        </section>
      ) : null}

      {pausedProducts.length > 0 ? (
        <section className="space-y-4">
          <SectionTitle
            title="Productos pausados por la Muni"
            description="Ocultos del catálogo público."
            count={pausedProducts.length}
          />
          <div className="space-y-4">
            {pausedProducts.map((product) => (
              <ProductPreviewCard
                key={product.id}
                product={product}
                actions={["reactivate"]}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
