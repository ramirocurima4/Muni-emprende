import Link from "next/link";
import { Suspense } from "react";
import { Leaf } from "lucide-react";
import HomeLoading from "@/app/loading";
import { EntrepreneursShowcaseSection } from "@/components/home/EntrepreneursShowcaseSection";
import { EntrepreneurStorefrontView } from "@/components/home/EntrepreneurStorefrontView";
import { FairsInviteCard } from "@/components/home/FairsInviteCard";
import { HomeProductShowcase } from "@/components/home/HomeProductShowcase";
import {
  getHomeShowcaseData,
  getPublicActiveEntrepreneurs,
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

      {/* 2. Carrusel horizontal compacto 'Emprendedores en San Roque' */}
      <Suspense fallback={<HomeEntrepreneursSkeleton />}>
        <HomeEntrepreneursSection />
      </Suspense>

      {/* 3. Tira 'Lo último en Gastronomía' + Grilla Principal 'Catálogo Destacado' (máx. 12 productos diversos) */}
      <Suspense fallback={<HomeShowcaseSkeleton />}>
        <HomeShowcaseSection />
      </Suspense>

      {/* 4. Accesos directos a las páginas de las ferias municipales */}
      <FairsInviteCard />
    </div>
  );
}

async function HomeShowcaseSection() {
  const { gastronomyProducts, catalogProducts, totalCatalogCount } =
    await getHomeShowcaseData();
  return (
    <HomeProductShowcase
      gastronomyProducts={gastronomyProducts}
      catalogProducts={catalogProducts}
      totalCatalogCount={totalCatalogCount}
    />
  );
}

async function HomeEntrepreneursSection() {
  const entrepreneurs = await getPublicActiveEntrepreneurs(36);
  return <EntrepreneursShowcaseSection entrepreneurs={entrepreneurs} />;
}

function HomeEntrepreneursSkeleton() {
  return (
    <div className="rounded-[28px] border border-[#A8C6E3] bg-[#D6E6F4] p-4 sm:px-6 sm:py-5">
      <div className="h-6 w-56 animate-pulse rounded-xl bg-white/75" />
      <div className="no-scrollbar mt-3.5 flex gap-3 overflow-hidden py-1">
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="flex w-[112px] shrink-0 flex-col items-center rounded-2xl border border-[#B8D2EA] bg-white/80 px-2.5 py-3 sm:w-[124px]"
          >
            <div className="h-14 w-14 animate-pulse rounded-full bg-[#DCE9F9] sm:h-16 sm:w-16" />
            <div className="mt-2 h-3 w-16 animate-pulse rounded-md bg-brand-border" />
          </div>
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
