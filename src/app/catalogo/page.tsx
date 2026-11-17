import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { CatalogContentSkeleton } from "@/components/catalog/CatalogSkeleton";
import { CategoryVisualFilters } from "@/components/catalog/CategoryVisualFilters";
import { MasonryCatalogGrid } from "@/components/catalog/MasonryCatalogGrid";
import {
  getPublicCatalogProducts,
  getPublicCategories,
} from "@/lib/catalog";

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
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-8 sm:py-12">
      {/* Encabezado institucional del Catálogo Completo (Celeste claro + Crema) */}
      <header className="rounded-[32px] border border-brand-sky/30 bg-gradient-to-br from-brand-sky-light/80 via-brand-surface to-brand-amber-soft/50 px-6 py-7 shadow-2xl shadow-black/5 sm:px-10 sm:py-9">
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
  const [categories, { products, activeQuery, activeCategorySlug }] =
    await Promise.all([
      getPublicCategories(),
      getPublicCatalogProducts(resolvedParams),
    ]);

  const activeCategory = categories.find(
    (c) => c.slug === activeCategorySlug,
  );

  return (
    <section className="space-y-6 sm:space-y-8">
      {/* Barra de Búsqueda y Filtros Visuales por Rubro */}
      <div className="space-y-4">
        <form
          action="/catalogo"
          method="GET"
          role="search"
          className="flex items-center gap-3"
        >
          {activeCategorySlug ? (
            <input type="hidden" name="categoria" value={activeCategorySlug} />
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
              className="w-full rounded-2xl bg-brand-surface py-3.5 pr-4 pl-11 text-sm text-brand-ink shadow-xl shadow-black/5 placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-green/35"
            />
          </div>

          <button
            type="submit"
            className="shrink-0 rounded-2xl bg-brand-green px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-green/20 transition-all hover:-translate-y-0.5 hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
          >
            Buscar
          </button>
        </form>

        {/* Tira de filtros visuales con íconos vectoriales redondos (Lucide React) */}
        <CategoryVisualFilters
          categories={categories}
          activeCategorySlug={activeCategorySlug}
          activeQuery={activeQuery}
          variant="catalog"
        />
      </div>

      {/* Resumen de filtros activos */}
      {activeQuery || activeCategory ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-brand-sky-light/70 px-4 py-3 text-xs text-brand-sky-dark shadow-sm shadow-black/5">
          <span>
            Mostrando <strong>{products.length}</strong>{" "}
            {products.length === 1 ? "producto" : "productos"}
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
