import Link from "next/link";
import { Suspense } from "react";
import { FeaturedProductsCarousel } from "@/components/home/FeaturedProductsCarousel";
import { getFeaturedHomeProducts } from "@/lib/catalog";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 px-5 py-10 sm:space-y-24 sm:px-8 sm:py-16">
      {/* 2. Hero Section (Introducción con márgenes amplios y sombra orgánica suave) */}
      <section className="relative overflow-hidden rounded-[36px] bg-white px-7 py-10 shadow-2xl shadow-black/5 sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-24 h-80 w-80 rounded-full bg-[#E6F0EA]/60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#F7EFE0]/70 blur-3xl"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#E6F0EA] px-4 py-1.5 text-xs font-bold tracking-wide text-[#0E4B27]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0E4B27]" />
              Feria Digital Municipal · San Roque
            </span>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight leading-[1.15] text-[#1C2420] sm:text-4xl lg:text-[2.75rem]">
              Descubrí el talento de San Roque.{" "}
              <span className="text-[#0E4B27]">
                Productos locales directo a tus manos
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#525E57] sm:text-base">
              Conocé las elaboraciones de nuestros artesanos y emprendedores, y
              vinculate de manera directa por WhatsApp para acordar tu compra
              mano a mano, sin intermediarios.
            </p>
          </div>

          {/* Dos botones principales: 'Explorar Feria' (/catalogo) y 'Soy emprendedor' (/registro) */}
          <div className="flex shrink-0 flex-wrap items-center gap-3.5 pt-2">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E4B27] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0A381D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4B27] focus-visible:ring-offset-2"
            >
              Explorar Feria
            </Link>
            <Link
              href="/registro"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F6F3EC] px-6 py-3.5 text-sm font-bold text-[#1C2420] shadow-lg shadow-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E6F0EA] hover:text-[#0E4B27] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4B27] focus-visible:ring-offset-2"
            >
              Soy emprendedor
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Feed Deslizable (Carrusel de Destacados - Diseño Crítico) */}
      <Suspense fallback={<CarouselSkeleton />}>
        <FeaturedCarouselSection />
      </Suspense>

      {/* 4. Banner Institucional del Intendente (Al final de la página, antes del footer) */}
      <section
        aria-label="Banner institucional Intendente de San Roque"
        className="overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-black/5"
      >
        {/* Franja superior institucional cuatricolor */}
        <div className="grid h-1.5 w-full grid-cols-4" aria-hidden="true">
          <div className="bg-[#679CEB]" />
          <div className="bg-[#E02D2D]" />
          <div className="bg-[#F0B400]" />
          <div className="bg-[#186A3B]" />
        </div>

        <div className="flex flex-col items-center justify-center gap-4 px-6 py-7 sm:flex-row sm:gap-5 sm:py-8">
          {/* Escudo circular con sombra suave */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-lg shadow-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpeg"
              alt="Escudo San Roque Municipio"
              width={382}
              height={575}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="text-center sm:text-left">
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#9E8229] sm:text-[13px]">
              INTENDENTE DE SAN ROQUE
            </p>
            <p className="mt-0.5 text-xl font-extrabold tracking-tight text-[#0E4B27] sm:text-2xl">
              Cr. Raúl Pelozo
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

async function FeaturedCarouselSection() {
  const featuredProducts = await getFeaturedHomeProducts(8);
  return <FeaturedProductsCarousel products={featuredProducts} />;
}

function CarouselSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded-xl bg-white/80" />
      <div className="flex gap-6 overflow-hidden pt-4 pb-12">
        <div className="h-[430px] w-[280px] shrink-0 animate-pulse rounded-[28px] bg-white shadow-2xl shadow-black/5 sm:h-[450px] sm:w-[320px]" />
        <div className="h-[430px] w-[280px] shrink-0 animate-pulse rounded-[28px] bg-white shadow-2xl shadow-black/5 sm:h-[450px] sm:w-[320px]" />
        <div className="hidden h-[450px] w-[320px] shrink-0 animate-pulse rounded-[28px] bg-white shadow-2xl shadow-black/5 sm:block" />
      </div>
    </div>
  );
}
