import Link from "next/link";
import { Suspense } from "react";
import { Leaf } from "lucide-react";
import { CategoryVisualFilters } from "@/components/catalog/CategoryVisualFilters";
import { HomeProductShowcase } from "@/components/home/HomeProductShowcase";
import { JoinUsSection } from "@/components/home/JoinUsSection";
import { getHomeShowcaseData, getPublicCategories } from "@/lib/catalog";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-5 py-7 sm:space-y-14 sm:px-8 sm:py-12">
      {/* 1. Cabecera Editorial e Introducción (Paleta institucional sobre fondo crema #FDFBF7) */}
      <section className="relative overflow-hidden rounded-[32px] border border-brand-sky/25 bg-gradient-to-br from-brand-sky-tint via-brand-surface to-brand-green-soft/45 px-6 py-8 shadow-xl shadow-black/[0.04] sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-16 h-60 w-60 rounded-full bg-brand-sky/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-brand-amber-soft/75 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-brand-green">
              <Leaf className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              Catálogo Oficial Comunitario
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
              . Contactá directo por WhatsApp, sin intermediarios.
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

      {/* 2. Filtros Visuales de Rubros con Íconos Vectoriales Redondos (Lucide React) */}
      <Suspense fallback={<HomeCategoriesSkeleton />}>
        <HomeCategoriesSection />
      </Suspense>

      {/* 3. Bloques Gastronomía Sanroqueña + Catálogo Destacado con Equilibrio de Rubros */}
      <Suspense fallback={<HomeShowcaseSkeleton />}>
        <HomeShowcaseSection />
      </Suspense>

      {/* 4. Sección Institucional 'Sumate a Nosotros' (Fondo verde vibrante + WhatsApp 3794 819378) */}
      <JoinUsSection />
    </div>
  );
}

async function HomeCategoriesSection() {
  const categories = await getPublicCategories();
  if (categories.length === 0) return null;
  return <CategoryVisualFilters categories={categories} variant="home" />;
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

function HomeCategoriesSkeleton() {
  return (
    <div className="no-scrollbar flex items-start gap-4 overflow-hidden py-1 sm:grid sm:grid-cols-4 lg:grid-cols-8">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
        <div
          key={idx}
          className="flex min-w-[74px] shrink-0 flex-col items-center gap-2"
        >
          <div className="h-15 w-15 animate-pulse rounded-full bg-brand-sky-tint sm:h-16 sm:w-16" />
          <div className="h-3 w-14 animate-pulse rounded-full bg-brand-border" />
        </div>
      ))}
    </div>
  );
}

function HomeShowcaseSkeleton() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="rounded-[30px] bg-brand-sky-tint/80 p-5 sm:p-8">
        <div className="h-6 w-36 animate-pulse rounded-full bg-brand-amber-soft" />
        <div className="mt-3 h-7 w-64 animate-pulse rounded-xl bg-brand-border" />
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

      <div className="space-y-5">
        <div className="h-7 w-56 animate-pulse rounded-xl bg-brand-border" />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((idx) => (
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
