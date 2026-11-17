"use client";

import Link from "next/link";
import { useRef } from "react";
import type { FeaturedHomeProductItem } from "@/lib/catalog";
import { getProductImageUrl } from "@/lib/images";
import { buildProductWhatsappUrl } from "@/lib/whatsapp";

interface FeaturedProductsCarouselProps {
  products: FeaturedHomeProductItem[];
}

export function FeaturedProductsCarousel({
  products,
}: FeaturedProductsCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function handleScroll(direction: "prev" | "next") {
    const track = trackRef.current;
    if (!track) return;
    const scrollAmount = direction === "next" ? 360 : -360;
    track.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }

  if (products.length === 0) {
    return (
      <div className="rounded-[32px] bg-brand-surface px-8 py-14 text-center shadow-2xl shadow-black/5">
        <p className="text-base font-bold text-brand-ink">
          Pronto verás los productos destacados de la feria
        </p>
        <p className="mt-1.5 text-xs text-brand-muted sm:text-sm">
          Los emprendedores de San Roque están sumando sus elaboraciones al
          catálogo oficial.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="featured-heading"
      className="space-y-6 sm:space-y-8"
    >
      {/* Encabezado de la sección con controles limpios en desktop */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-amber-text">
            Vidriera Digital Municipal
          </span>
          <h2
            id="featured-heading"
            className="mt-1.5 text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl"
          >
            Productos Destacados
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-brand-muted sm:hidden">
            Deslizá →
          </span>

          <div className="hidden items-center gap-2.5 sm:flex">
            <button
              type="button"
              onClick={() => handleScroll("prev")}
              aria-label="Anterior producto destacado"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-sm font-bold text-brand-ink shadow-xl shadow-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-sky-light hover:text-brand-sky-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => handleScroll("next")}
              aria-label="Siguiente producto destacado"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white shadow-xl shadow-brand-green/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Carrusel horizontal swipeable con padding vertical amplio para no recortar el drop shadow */}
      <div
        ref={trackRef}
        className="carousel-snap-x no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 pt-4 pb-12 sm:-mx-6 sm:gap-8 sm:px-6 sm:pt-5 sm:pb-14"
      >
        {products.map((product, index) => {
          const image = product.primaryImage;
          const imgWidth = image?.width ?? 900;
          const imgHeight = image?.height ?? 1200;
          const imageUrl = image
            ? getProductImageUrl(image.relativePath, "full")
            : null;

          const whatsappUrl = buildProductWhatsappUrl({
            whatsappNumber: product.entrepreneur.whatsappNumber,
            businessName: product.entrepreneur.businessName,
            productTitle: product.title,
          });

          return (
            <article
              key={product.id}
              className="carousel-snap-start group flex h-[430px] w-[82%] min-w-[276px] max-w-[320px] shrink-0 flex-col rounded-[28px] bg-brand-surface shadow-2xl shadow-black/5 transition-all duration-300 ease-out sm:h-[450px] sm:w-[320px] sm:max-w-none sm:hover:-translate-y-1.5 sm:hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.10)]"
            >
              {/* La Foto (El Foco): ocupa el ~65% superior de la tarjeta con bordes superiores redondeados */}
              <Link
                href={`/productos/${product.slug}`}
                className="relative block h-[64%] w-full shrink-0 overflow-hidden rounded-t-[28px] bg-[#EAE4D7] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green"
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={product.title}
                    width={imgWidth}
                    height={imgHeight}
                    loading={index < 3 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs font-medium text-brand-muted">
                    Sin imagen disponible
                  </div>
                )}

                {product.expirationBadge === "TODAY" ? (
                  <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 rounded-full bg-brand-amber px-3 py-1 text-[11px] font-bold text-brand-ink shadow-md shadow-black/5">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-ink" />
                    Vence hoy
                  </span>
                ) : product.expirationBadge === "TEMPORARY" ? (
                  <span className="absolute top-3.5 right-3.5 inline-flex items-center rounded-full bg-brand-sky-light/95 px-3 py-1 text-[11px] font-semibold text-brand-sky-dark shadow-md shadow-black/5 backdrop-blur-xs">
                    Edición temporal
                  </span>
                ) : null}
              </Link>

              {/* El Texto (Jerarquía y Autoría) + Botón 'Contacto' limpio (Cero bordes, Cero precios) */}
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                <div>
                  {/* Subtítulo/etiqueta destacada de autoría: nombre del taller/emprendedor */}
                  <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-brand-ink">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5 shrink-0 text-brand-green"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="truncate">
                      {product.entrepreneur.businessName}
                    </span>
                  </div>

                  {/* Título del producto (Cero precios) */}
                  <h3 className="mt-1.5 line-clamp-1 text-base font-extrabold leading-snug text-brand-ink sm:text-lg">
                    <Link
                      href={`/productos/${product.slug}`}
                      className="transition-colors hover:text-brand-green focus:outline-none focus-visible:underline"
                    >
                      {product.title}
                    </Link>
                  </h3>
                </div>

                {/* El Botón: 'Contacto' limpio en la parte inferior de la tarjeta (fuera de la foto) */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Contactar a ${product.entrepreneur.businessName} por ${product.title}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green-soft px-4 py-2.5 text-xs font-bold text-brand-green-dark transition-all duration-200 hover:bg-brand-green hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 sm:text-sm"
                >
                  <span>Contacto</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
