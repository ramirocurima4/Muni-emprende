"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Flame,
  MessageCircle,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import type { FeaturedHomeProductItem } from "@/lib/catalog";
import { getProductImageUrl } from "@/lib/images";
import { buildProductWhatsappUrl } from "@/lib/whatsapp";

interface HomeProductShowcaseProps {
  gastronomyProducts: FeaturedHomeProductItem[];
  catalogProducts: FeaturedHomeProductItem[];
}

export function HomeProductShowcase({
  gastronomyProducts,
  catalogProducts,
}: HomeProductShowcaseProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<FeaturedHomeProductItem | null>(null);

  useEffect(() => {
    if (!selectedProduct) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProduct]);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Bloque de Gastronomía Sanroqueña (urgencia de venta diaria con peso tipográfico equitativo) */}
      <section
        aria-labelledby="gastronomy-heading"
        className="rounded-[30px] border border-brand-sky/25 bg-brand-sky-tint/80 p-5 shadow-xl shadow-black/[0.03] sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-amber-soft px-3.5 py-1 text-xs font-bold text-brand-amber-text">
            <Flame className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            Hecho en San Roque
          </span>

          <Link
            href="/catalogo?categoria=gastronomia"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-green transition-colors hover:text-brand-green-hover sm:text-sm"
          >
            <span>Ver todo</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-3">
          <h2
            id="gastronomy-heading"
            className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl"
          >
            Gastronomía Sanroqueña
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-brand-muted sm:text-sm">
            Sabores auténticos creados por productores de nuestra ciudad.
          </p>
        </div>

        {gastronomyProducts.length > 0 ? (
          <div className="no-scrollbar -mx-5 mt-5 flex gap-3.5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {gastronomyProducts.map((product) => (
              <ShowcaseProductCard
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
                className="w-[74%] min-w-[230px] max-w-[290px] shrink-0 sm:w-auto sm:max-w-none"
                badgeLabel={
                  product.expirationBadge === "TODAY"
                    ? "Vence hoy"
                    : "Elaboración Sanroqueña"
                }
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-brand-surface px-5 py-6 text-center shadow-sm shadow-black/[0.03]">
            <p className="text-xs font-semibold text-brand-muted sm:text-sm">
              Pronto verás elaboraciones gastronómicas frescas del día en esta
              sección.
            </p>
          </div>
        )}
      </section>

      {/* 2. Catálogo Destacado (Equilibrio visual: mismo peso tipográfico y tarjetas para artesanos, textileros y demás rubros) */}
      <section aria-labelledby="catalog-featured-heading" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              id="catalog-featured-heading"
              className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl"
            >
              Catálogo Destacado
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-brand-muted sm:text-sm">
              Creaciones con Sello Local sin intermediarios
            </p>
          </div>

          <Link
            href="/catalogo"
            aria-label="Filtrar todo el catálogo"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-surface text-brand-green shadow-md shadow-black/[0.05] transition-all hover:-translate-y-0.5 hover:bg-brand-green-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>

        {catalogProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {catalogProducts.map((product) => (
              <ShowcaseProductCard
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
                badgeLabel={product.category.name}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-brand-surface px-6 py-12 text-center shadow-xl shadow-black/[0.04]">
            <p className="text-sm font-bold text-brand-ink">
              Explorá todas las creaciones en el catálogo completo
            </p>
            <Link
              href="/catalogo"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-green px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-green-hover"
            >
              Ir al Catálogo
            </Link>
          </div>
        )}
      </section>

      {/* 3. Modal de Detalle Rápido (inspirado en Stitch, sin mención a 'Certificado') */}
      {selectedProduct ? (
        <ProductQuickViewModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      ) : null}
    </div>
  );
}

interface ShowcaseProductCardProps {
  product: FeaturedHomeProductItem;
  onSelect: (product: FeaturedHomeProductItem) => void;
  badgeLabel: string;
  className?: string;
}

function ShowcaseProductCard({
  product,
  onSelect,
  badgeLabel,
  className = "",
}: ShowcaseProductCardProps) {
  const image = product.primaryImage;
  const imgWidth = image?.width ?? 900;
  const imgHeight = image?.height ?? 1000;
  const imageUrl = image
    ? getProductImageUrl(image.relativePath, "thumb")
    : null;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl bg-brand-surface shadow-lg shadow-black/[0.04] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/[0.07] ${className}`}
    >
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="flex h-full w-full flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EAE4D7]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.title}
              width={imgWidth}
              height={imgHeight}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs font-medium text-brand-muted">
              Sin imagen
            </div>
          )}

          <span
            className={`absolute bottom-2.5 left-2.5 inline-flex max-w-[calc(100%-1.25rem)] truncate rounded-lg px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${
              product.expirationBadge === "TODAY"
                ? "bg-brand-amber text-brand-ink"
                : "bg-brand-green text-white"
            }`}
          >
            {badgeLabel}
          </span>
        </div>

        {/* Peso tipográfico equitativo en todas las tarjetas (Gastronomía, Artesanías, Textil, etc.) */}
        <div className="flex flex-1 flex-col justify-between gap-1 p-3.5 sm:p-4">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-brand-ink transition-colors group-hover:text-brand-green sm:text-[15px]">
            {product.title}
          </h3>
          <p className="truncate text-xs font-medium text-brand-muted">
            {product.entrepreneur.businessName}
          </p>
        </div>
      </button>
    </article>
  );
}

interface ProductQuickViewModalProps {
  product: FeaturedHomeProductItem;
  onClose: () => void;
}

function ProductQuickViewModal({
  product,
  onClose,
}: ProductQuickViewModalProps) {
  const image = product.primaryImage;
  const imgWidth = image?.width ?? 900;
  const imgHeight = image?.height ?? 1000;
  const fullImageUrl = image
    ? getProductImageUrl(image.relativePath, "full")
    : null;

  const whatsappUrl = buildProductWhatsappUrl({
    whatsappNumber: product.entrepreneur.whatsappNumber,
    businessName: product.entrepreneur.businessName,
    productTitle: product.title,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-brand-surface shadow-2xl sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Foto superior con insignia 'Sello Local' */}
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#EAE4D7]">
          {fullImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fullImageUrl}
              alt={product.title}
              width={imgWidth}
              height={imgHeight}
              className="h-full w-full object-cover"
            />
          ) : null}

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle del producto"
            className="absolute top-3.5 right-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-brand-ink shadow-md transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <span className="absolute bottom-3 left-3.5 inline-flex items-center gap-1.5 rounded-full bg-brand-green px-3 py-1 text-xs font-bold text-white shadow-md">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Sello Local
          </span>
        </div>

        {/* Contenido desplazable */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <div>
            <h3
              id="quick-view-title"
              className="text-xl font-extrabold leading-snug text-brand-ink sm:text-2xl"
            >
              {product.title}
            </h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-brand-green sm:text-sm">
              <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {product.entrepreneur.businessName} · {product.category.name}
              </span>
            </p>
          </div>

          <div className="rounded-2xl bg-brand-sky-tint/80 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-sky-dark">
              Descripción
            </p>
            <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-brand-ink sm:text-sm">
              {product.description}
            </p>
          </div>

          <div className="rounded-2xl bg-brand-cream p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-amber-text">
              Elaboración Sanroqueña
            </p>
            <p className="mt-1 text-xs font-semibold text-brand-ink sm:text-sm">
              {product.entrepreneur.ownerName}
              {product.entrepreneur.neighborhood
                ? ` · ${product.entrepreneur.neighborhood}`
                : ""}
            </p>
            {product.entrepreneur.bio ? (
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                {product.entrepreneur.bio}
              </p>
            ) : null}
          </div>
        </div>

        {/* Footer sticky con botón WhatsApp */}
        <div className="border-t border-brand-border bg-brand-surface px-5 pt-3.5 pb-5 sm:px-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-green/25 transition-all hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Contactar por WhatsApp</span>
          </a>

          <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-brand-muted">
            <span>Conectá directamente sin intermediarios</span>
            <Link
              href={`/productos/${product.slug}`}
              className="font-bold text-brand-green hover:underline"
            >
              Ver ficha completa →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
