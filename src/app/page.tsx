import Link from "next/link";
import { Suspense } from "react";
import { Leaf, Search } from "lucide-react";
import HomeLoading from "@/app/loading";
import { CategoryVisualFilters } from "@/components/catalog/CategoryVisualFilters";
import { EntrepreneursShowcaseSection } from "@/components/home/EntrepreneursShowcaseSection";
import { EntrepreneurStorefrontView } from "@/components/home/EntrepreneurStorefrontView";
import { FairsInviteCard } from "@/components/home/FairsInviteCard";
import { HomeProductShowcase } from "@/components/home/HomeProductShowcase";
import {
  getHomeShowcaseData,
  getPublicActiveEntrepreneurs,
  getPublicCategories,
  getPublicEntrepreneurStorefront,
} from "@/lib/catalog";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomePageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomePageContent({ searchParams }: HomePageProps) {
  const resolved = await searchParams;
  const rawEntrepreneur = Array.isArray(resolved.emprendedor)
    ? resolved.emprendedor[0]
    : resolved.emprendedor;
  const entrepreneurParam = rawEntrepreneur?.trim();

  // Modo 'Vidriera Exclusiva': oculta todas las secciones de la portada general
  if (entrepreneurParam) {
    const storefront = await getPublicEntrepreneurStorefront(entrepreneurParam);
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-12">
        <EntrepreneurStorefrontView storefront={storefront} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-5 py-7 sm:space-y-14 sm:px-8 sm:py-12">
      {/* 1. Banner Superior / Hero Institucional con jerarquía celeste sobre fondo #E8F1F8 */}
      <section className="relative overflow-hidden rounded-[32px] border border-[#A6C4E0] bg-gradient-to-br from-[#C5DCEF] via-[#D6E6F4] to-[#E7F3DC]/80 px-6 py-8 shadow-xl shadow-[#1F4478]/[0.07] sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-16 h-60 w-60 rounded-full bg-[#9BBFE0]/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-brand-amber-soft/75 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-brand-green shadow-2xs">
              <Leaf className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              Catálogo Oficial Comunitario · San Roque
            </span>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight leading-[1.14] text-brand-ink sm:text-4xl lg:text-[2.65rem]">
              Impulsando el talento de{" "}
              <span className="text-brand-green">San Roque</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-muted sm:text-base">
              Descubrí productos locales con sello artesanal y{" "}
              <strong className="font-semibold text-brand-ink">
                Elaboración Sanroqueña
              </strong>
              , conocé las ferias de la ciudad y contactá directo por WhatsApp,
              sin intermediarios.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-green/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
            >
              Explorar Feria
            </Link>
            <Link
              href="/registro"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-amber px-5 py-3 text-sm font-extrabold text-brand-ink shadow-md shadow-brand-amber/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-amber-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2"
            >
              Soy emprendedor
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Buscador rápido y Todas las Categorías (#catalogo) */}
      <Suspense fallback={<HomeCategoriesSkeleton />}>
        <HomeSearchAndCategoriesSection />
      </Suspense>

      {/* 3. Tira 'Lo último en Gastronomía' + Grilla Principal 'Catálogo Destacado' */}
      <Suspense fallback={<HomeShowcaseSkeleton />}>
        <HomeShowcaseSection />
      </Suspense>

      {/* 4. Vitrina 'Emprendedores Sanroqueños' + botón discreto de compartir por WhatsApp */}
      <Suspense fallback={<HomeEntrepreneursSkeleton />}>
        <HomeEntrepreneursSection />
      </Suspense>

      {/* 5. Accesos directos a las páginas de las ferias municipales */}
      <FairsInviteCard />
    </div>
  );
}

async function HomeSearchAndCategoriesSection() {
  const categories = await getPublicCategories();

  return (
    <section
      id="catalogo"
      aria-label="Buscador y rubros disponibles"
      className="scroll-mt-28 space-y-5 rounded-[30px] border border-[#A8C6E3] bg-[#D6E6F4] p-4 shadow-lg shadow-[#1F4478]/[0.05] sm:p-6"
    >
      <form
        action="/catalogo"
        method="GET"
        role="search"
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <label htmlFor="home-search-input" className="sr-only">
            Buscar productos o emprendedores de San Roque
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-brand-muted"
          />
          <input
            id="home-search-input"
            type="search"
            name="q"
            placeholder="Buscá chipá, dulces, artesanías, plantines o un emprendimiento..."
            className="w-full rounded-2xl border border-[#A8C6E3] bg-brand-surface py-3.5 pr-4 pl-11 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
        </div>
        <button
          type="submit"
          className="w-full shrink-0 rounded-2xl bg-brand-green px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-green/20 transition-colors hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 sm:w-auto"
        >
          Buscar en catálogo
        </button>
      </form>

      {categories.length > 0 ? (
        <div className="border-t border-[#A8C6E3]/80 pt-4">
          <CategoryVisualFilters categories={categories} variant="home" />
        </div>
      ) : null}
    </section>
  );
}

async function HomeShowcaseSection() {
  const { gastronomyProducts, catalogProducts } = await getHomeShowcaseData();
  return (
    <HomeProductShowcase
      gastronomyProducts={gastronomyProducts}
      catalogProducts={catalogProducts}
    />
  );
}

async function HomeEntrepreneursSection() {
  const entrepreneurs = await getPublicActiveEntrepreneurs(20);
  return <EntrepreneursShowcaseSection entrepreneurs={entrepreneurs} />;
}

function HomeCategoriesSkeleton() {
  return (
    <div className="rounded-[30px] border border-[#A8C6E3] bg-[#D6E6F4] p-5">
      <div className="h-12 w-full animate-pulse rounded-2xl bg-white/80" />
    </div>
  );
}

function HomeEntrepreneursSkeleton() {
  return (
    <div className="rounded-[32px] border border-[#A8C6E3] bg-[#D6E6F4] p-5 sm:p-8">
      <div className="h-7 w-60 animate-pulse rounded-xl bg-white/75" />
      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-20 animate-pulse rounded-2xl bg-white/80"
          />
        ))}
      </div>
    </div>
  );
}

function HomeShowcaseSkeleton() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="rounded-[30px] border border-[#A8C6E3] bg-[#D6E6F4] p-5 sm:p-8">
        <div className="h-6 w-36 animate-pulse rounded-full bg-brand-amber-soft" />
        <div className="mt-3 h-7 w-64 animate-pulse rounded-xl bg-white/70" />
        <div className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-3">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl bg-brand-surface shadow-sm"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-brand-border" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-4/5 animate-pulse rounded-lg bg-brand-border" />
                <div className="h-3 w-1/2 animate-pulse rounded-lg bg-brand-border/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
