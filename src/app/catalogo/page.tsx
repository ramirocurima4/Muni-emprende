import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogContentSkeleton } from "@/components/catalog/CatalogSkeleton";
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
      {/* Encabezado boutique del Catálogo Completo (Ruta /catalogo) */}
      <header className="rounded-[32px] bg-white px-6 py-7 shadow-2xl shadow-black/5 sm:px-10 sm:py-9">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-full bg-[#F6F3EC] px-3.5 py-1.5 text-xs font-bold text-[#0E4B27] transition-colors hover:bg-[#E6F0EA]"
              >
                ← Volver al inicio
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F0EA] px-3.5 py-1.5 text-xs font-bold text-[#0E4B27]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0E4B27]" />
                Catálogo Oficial · San Roque
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#1C2420] sm:text-4xl">
              Catálogo Completo de la Feria
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#525E57] sm:text-sm">
              Buscá por producto o emprendimiento, filtrá por categoría y acordá
              tu compra directo por WhatsApp, sin intermediarios.
            </p>
          </div>
        </div>
      </header>

      {/* Buscador, pastillas de rubros y grilla Masonry envueltos en Suspense */}
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
      {/* Barra de Búsqueda y Filtros (Pastillas / Pills) por Rubro */}
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
            <input
              id="search-input"
              type="search"
              name="q"
              defaultValue={activeQuery ?? ""}
              placeholder="Buscar dulce de mamón, tejidos, mates, huerta..."
              className="w-full rounded-2xl bg-white py-3.5 pr-4 pl-4 text-sm text-[#1C2420] shadow-xl shadow-black/5 placeholder:text-[#525E57] focus:outline-none focus:ring-2 focus:ring-[#0E4B27]/30"
            />
          </div>

          <button
            type="submit"
            className="shrink-0 rounded-2xl bg-[#0E4B27] px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#0E4B27]/20 transition-all hover:-translate-y-0.5 hover:bg-[#0A381D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4B27] focus-visible:ring-offset-2"
          >
            Buscar
          </button>
        </form>

        {/* Tira de pastillas (pills) de los 7 rubros oficiales */}
        <nav
          aria-label="Filtrar por categoría"
          className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <Link
            href={
              activeQuery
                ? `/catalogo?q=${encodeURIComponent(activeQuery)}`
                : "/catalogo"
            }
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              !activeCategorySlug
                ? "bg-[#0E4B27] text-white shadow-lg shadow-[#0E4B27]/20"
                : "bg-white text-[#1C2420] shadow-md shadow-black/5 hover:bg-[#E6F0EA] hover:text-[#0E4B27]"
            }`}
          >
            Todos los rubros
          </Link>

          {categories.map((cat) => {
            const isSelected = cat.slug === activeCategorySlug;
            const params = new URLSearchParams();
            params.set("categoria", cat.slug);
            if (activeQuery) {
              params.set("q", activeQuery);
            }

            return (
              <Link
                key={cat.id}
                href={`/catalogo?${params.toString()}`}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-[#0E4B27] text-white shadow-lg shadow-[#0E4B27]/20"
                    : "bg-white text-[#1C2420] shadow-md shadow-black/5 hover:bg-[#E6F0EA] hover:text-[#0E4B27]"
                }`}
              >
                {cat.name}
                {cat.productCount > 0 ? (
                  <span
                    className={`ml-1.5 inline-block text-[11px] ${
                      isSelected ? "text-[#E6F0EA]" : "text-[#525E57]"
                    }`}
                  >
                    ({cat.productCount})
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Resumen de filtros activos */}
      {activeQuery || activeCategory ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#E6F0EA]/80 px-4 py-3 text-xs text-[#0E4B27] shadow-sm shadow-black/5">
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
            className="font-bold text-[#0E4B27] underline underline-offset-2 hover:text-[#0A381D]"
          >
            Limpiar filtros
          </Link>
        </div>
      ) : null}

      {/* Grilla Masonry sin CLS o estado vacío */}
      {products.length > 0 ? (
        <MasonryCatalogGrid products={products} />
      ) : (
        <div className="rounded-[32px] bg-white px-6 py-14 text-center shadow-2xl shadow-black/5">
          <p className="text-base font-extrabold text-[#1C2420]">
            No encontramos productos con esos filtros
          </p>
          <p className="mt-1.5 text-xs text-[#525E57] sm:text-sm">
            Probá buscando con otra palabra o recorriendo todas las categorías
            de la feria.
          </p>
          <Link
            href="/catalogo"
            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#0E4B27] px-5 py-3 text-xs font-bold text-white shadow-xl shadow-[#0E4B27]/20 hover:bg-[#0A381D]"
          >
            Ver todo el catálogo
          </Link>
        </div>
      )}
    </section>
  );
}
