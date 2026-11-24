import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search, Store } from "lucide-react";
import { CatalogContentSkeleton } from "@/components/catalog/CatalogSkeleton";
import { CategoryVisualFilters } from "@/components/catalog/CategoryVisualFilters";
import { MasonryCatalogGrid } from "@/components/catalog/MasonryCatalogGrid";
import {
  getPublicCatalogProducts,
  getPublicCategories,
} from "@/lib/catalog";
import { getUploadImageUrl } from "@/lib/images";

export const metadata: Metadata = {
  title: "Catálogo Completo de Productos",
  description:
    "Explorá el catálogo completo de emprendedores de San Roque. Filtrá por gastronomía, artesanías, textil, vivero y más, y contactá directo por WhatsApp.",
};

interface CatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function CatalogPage({ searchParams }: CatalogPageProps) {
  return (
    <div className="relative z-0 mx-auto w-full max-w-6xl space-y-8 px-4 pt-8 pb-12 sm:space-y-10 sm:px-8 sm:pt-12 sm:pb-16">
      {/* Encabezado institucional del Catálogo Completo (Celeste institucional con jerarquía) */}
      <header className="rounded-[32px] border border-[#A8C6E3] bg-gradient-to-br from-[#C5DCEF] via-[#D6E6F4] to-brand-amber-soft/55 px-6 py-7 shadow-xl shadow-[#1F4478]/[0.06] sm:px-10 sm:py-9">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-full bg-brand-surface px-3.5 py-1.5 text-xs font-bold text-brand-green shadow-xs transition-colors hover:bg-brand-green-soft"
              >
                ← Volver al inicio
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-sky-light px-3.5 py-1.5 text-xs font-bold text-brand-sky-dark">
                <span className="h-2 w-2 rounded-full bg-brand-amber" />
                Catálogo Oficial · San Roque
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-ink sm:text-4xl">
              Catálogo Completo de la Feria
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-brand-muted sm:text-sm">
              Buscá por producto o emprendimiento, filtrá por rubro y acordá tu
              compra directo por WhatsApp, sin intermediarios.
            </p>
          </div>
        </div>
      </header>

      {/* Buscador, filtros visuales con íconos redondos y grilla Masonry envueltos en Suspense */}
      <Suspense fallback={<CatalogContentSkeleton />}>
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CatalogContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const [
    categories,
    {
      products,
      activeQuery,
      activeCategorySlug,
      activeEntrepreneurParam,
      activeEntrepreneur,
    },
  ] = await Promise.all([
    getPublicCategories(),
    getPublicCatalogProducts(resolvedParams),
  ]);

  const activeCategory = categories.find(
    (c) => c.slug === activeCategorySlug,
  );
  const entrepreneurAvatarUrl = activeEntrepreneur?.avatarPath
    ? getUploadImageUrl(activeEntrepreneur.avatarPath, "thumb")
    : null;
  const hasActiveFilters = Boolean(
    activeQuery || activeCategory || activeEntrepreneurParam,
  );

  return (
    <section className="space-y-7 sm:space-y-9">
      {/* Barra de Búsqueda y Filtros Visuales por Rubro con contraste celeste marcado */}
      <div className="space-y-5 rounded-[28px] border border-[#A8C6E3] bg-[#D6E6F4] p-4 shadow-lg shadow-[#1F4478]/[0.05] sm:p-5">
        <form
          action="/catalogo"
          method="GET"
          role="search"
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          {activeCategorySlug ? (
            <input type="hidden" name="categoria" value={activeCategorySlug} />
          ) : null}
          {activeEntrepreneurParam ? (
            <input
              type="hidden"
              name="emprendedor"
              value={activeEntrepreneurParam}
            />
          ) : null}

          <div className="relative flex-1">
            <label htmlFor="search-input" className="sr-only">
              Buscar productos o emprendedores
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-brand-muted"
            />
            <input
              id="search-input"
              type="search"
              name="q"
              defaultValue={activeQuery ?? ""}
              placeholder="Buscar dulce de mamón, tejidos, mates, huerta..."
              className="w-full rounded-2xl border border-[#A8C6E3] bg-brand-surface py-3.5 pr-4 pl-11 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>

          <button
            type="submit"
            className="w-full shrink-0 rounded-2xl bg-brand-green px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 sm:w-auto"
          >
            Buscar
          </button>
        </form>

        <div className="border-t border-[#A8C6E3]/80 pt-4">
          {/* Tira de filtros visuales con íconos vectoriales redondos (Lucide React) */}
          <CategoryVisualFilters
            categories={categories}
            activeCategorySlug={activeCategorySlug}
            activeQuery={activeQuery}
            activeEntrepreneurParam={activeEntrepreneurParam}
            variant="catalog"
          />
        </div>
      </div>

      {/* Resumen de filtros activos */}
      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#B8D2EA] bg-brand-sky-light/70 px-4 py-3 text-xs text-brand-sky-dark shadow-sm shadow-black/5">
          <div className="flex flex-wrap items-center gap-2.5">
            {activeEntrepreneur ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#A8C6E3] bg-brand-surface py-1 pr-3 pl-1 text-xs font-extrabold text-brand-ink shadow-2xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DCE9F9]">
                  {entrepreneurAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entrepreneurAvatarUrl}
                      alt={activeEntrepreneur.businessName}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store
                      className="h-3.5 w-3.5 text-brand-green"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span>{activeEntrepreneur.businessName}</span>
              </span>
            ) : null}

            <span>
              Mostrando <strong>{products.length}</strong>{" "}
              {products.length === 1 ? "producto" : "productos"}
              {activeEntrepreneur ? (
                <>
                  {" "}
                  de <strong>{activeEntrepreneur.businessName}</strong>
                </>
              ) : null}
              {activeCategory ? (
                <>
                  {" "}
                  en <strong>{activeCategory.name}</strong>
                </>
              ) : null}
              {activeQuery ? (
                <>
                  {" "}
                  para <strong>&ldquo;{activeQuery}&rdquo;</strong>
                </>
              ) : null}
            </span>
          </div>

          <Link
            href="/catalogo"
            className="font-bold text-brand-green-dark underline underline-offset-2 hover:text-brand-green"
          >
            Limpiar filtros
          </Link>
        </div>
      ) : null}

      {/* Grilla Masonry sin CLS o estado vacío */}
      {products.length > 0 ? (
        <MasonryCatalogGrid products={products} />
      ) : (
        <div className="rounded-[32px] bg-brand-surface px-6 py-14 text-center shadow-2xl shadow-black/5">
          <p className="text-base font-extrabold text-brand-ink">
            No encontramos productos con esos filtros
          </p>
          <p className="mt-1.5 text-xs text-brand-muted sm:text-sm">
            Probá buscando con otra palabra o recorriendo todas las categorías
            de la feria.
          </p>
          <Link
            href="/catalogo"
            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-brand-green px-5 py-3 text-xs font-bold text-white shadow-xl shadow-brand-green/20 hover:bg-brand-green-hover"
          >
            Ver todo el catálogo
          </Link>
        </div>
      )}
    </section>
  );
}
