"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChefHat,
  Flame,
  Info,
  Layers,
  MapPin,
  MessageCircle,
  SlidersHorizontal,
  Store,
  Truck,
  X,
} from "lucide-react";
import type { FeaturedHomeProductItem } from "@/lib/catalog";
import { getProductImageUrl } from "@/lib/images";
import { buildProductWhatsappUrl } from "@/lib/whatsapp";

interface HomeProductShowcaseProps {
  gastronomyProducts: FeaturedHomeProductItem[];
  catalogProducts: FeaturedHomeProductItem[];
  totalCatalogCount: number;
}

export function HomeProductShowcase({
  gastronomyProducts,
  catalogProducts,
  totalCatalogCount,
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

  const hasGastronomy = gastronomyProducts.length > 0;
  const hasCatalog = catalogProducts.length > 0;

  if (!hasGastronomy && !hasCatalog) {
    return (
      <section
        aria-label="Bienvenida al catálogo comunitario"
        className="rounded-[30px] border border-[#A8C6E3] bg-[#D6E6F4] p-6 text-center shadow-lg shadow-[#1F4478]/[0.05] sm:p-10"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-amber-soft px-3.5 py-1 text-xs font-extrabold text-brand-amber-text">
          <Store className="h-3.5 w-3.5" aria-hidden="true" />
          Catálogo en Crecimiento
        </span>
        <h2 className="mt-3 text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">
          ¡Los emprendedores de San Roque ya se están sumando!
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-brand-muted sm:text-sm">
          Mientras los talleres, cocinas y productores locales cargan sus
          primeros productos en la vidriera digital, recorré las próximas fechas
          de nuestras ferias presenciales, conocé las crónicas de cada
          encuentro y contactá directo a los emprendimientos de la ciudad.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/expo-emprendedores"
            className="inline-flex items-center justify-center rounded-2xl bg-brand-green px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-green/20 transition-colors hover:bg-brand-green-hover sm:text-sm"
          >
            Ver las ferias municipales
          </Link>
          <a
            href="#emprendedores"
            className="inline-flex items-center justify-center rounded-2xl border border-[#A8C6E3] bg-brand-surface px-5 py-2.5 text-xs font-bold text-brand-sky-dark transition-colors hover:bg-[#C5DCEF] sm:text-sm"
          >
            Conocer emprendimientos
          </a>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. Tira deslizable compacta 'Lo último en Gastronomía' */}
      {hasGastronomy ? (
        <section
          aria-labelledby="gastronomy-heading"
          className="rounded-[28px] border border-[#A8C6E3] bg-[#D6E6F4] p-4 shadow-md shadow-[#1F4478]/[0.05] sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-amber-soft px-3 py-1 text-[11px] font-extrabold text-brand-amber-text">
                <Flame
                  className="h-3.5 w-3.5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Hecho en San Roque
              </span>
              <h2
                id="gastronomy-heading"
                className="text-lg font-extrabold tracking-tight text-brand-ink sm:text-xl"
              >
                Lo último en Gastronomía
              </h2>
            </div>

            <Link
              href="/catalogo?categoria=gastronomia"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-green transition-colors hover:text-brand-green-hover sm:text-sm"
            >
              <span>Ver todo</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="no-scrollbar mt-3.5 flex snap-x gap-3 overflow-x-auto pb-2">
            {gastronomyProducts.map((product) => (
              <CompactGastronomyCard
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 2. Grilla Principal: Catálogo Destacado / Todos los productos */}
      {hasCatalog ? (
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
                Todas las publicaciones disponibles hoy con Sello Local, sin
                intermediarios
              </p>
            </div>

            <Link
              href="/catalogo"
              aria-label="Filtrar todo el catálogo"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#A8C6E3] bg-[#D6E6F4] text-brand-green shadow-md shadow-black/[0.05] transition-all hover:-translate-y-0.5 hover:bg-brand-green-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>

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

          <div className="flex flex-col items-center gap-2 pt-3 text-center">
            <Link
              href="/catalogo"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-green px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand-green/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 sm:w-auto sm:text-base"
            >
              <span>Explorar todo el catálogo</span>
              {totalCatalogCount > 12 ? (
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-extrabold text-white">
                  {totalCatalogCount} productos
                </span>
              ) : null}
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
            {totalCatalogCount > 12 ? (
              <p className="text-xs font-medium text-brand-muted">
                Mostrando una selección representativa de {catalogProducts.length}{" "}
                de los {totalCatalogCount} productos disponibles en San Roque.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 3. Modal de Detalle Rápido (sin mención a 'Certificado' y sin precios) */}
      {selectedProduct ? (
        <ProductQuickViewModal
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      ) : null}
    </div>
  );
}

function CompactGastronomyCard({
  product,
  onSelect,
}: {
  product: FeaturedHomeProductItem;
  onSelect: (product: FeaturedHomeProductItem) => void;
}) {
  const image = product.primaryImage;
  const imgWidth = image?.width ?? 600;
  const imgHeight = image?.height ?? 600;
  const imageUrl = image
    ? getProductImageUrl(image.relativePath, "thumb")
    : null;

  return (
    <article className="group flex w-[176px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-brand-surface shadow-md shadow-black/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:w-[205px]">
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="flex h-full w-full flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green"
      >
        <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#EAE4D7]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.title}
              width={imgWidth}
              height={imgHeight}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] font-medium text-brand-muted">
              Sin imagen
            </div>
          )}

          {product.isCombo ? (
            <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-full bg-brand-amber-soft/95 px-2 py-0.5 text-[9px] font-extrabold text-brand-amber-text shadow-2xs">
              <Layers className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              Variedades
            </span>
          ) : product.expirationBadge === "TODAY" ? (
            <span className="absolute top-1.5 right-1.5 rounded-full bg-brand-amber px-2 py-0.5 text-[9px] font-extrabold text-brand-ink shadow-2xs">
              Hoy
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-0.5 p-2.5 sm:p-3">
          <h3 className="line-clamp-1 text-xs font-extrabold leading-snug text-brand-ink group-hover:text-brand-green sm:text-[13px]">
            {product.title}
          </h3>
          <p className="truncate text-[11px] font-medium text-brand-muted">
            {product.entrepreneur.businessName}
          </p>
        </div>
      </button>
    </article>
  );
}

interface ShowcaseProductCardProps {
  product: FeaturedHomeProductItem;
  onSelect: (product: FeaturedHomeProductItem) => void;
  badgeLabel: string;
  className?: string;
}

export function ShowcaseProductCard({
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

          {product.isCombo ? (
            <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-brand-amber-soft/95 px-2.5 py-0.5 text-[10px] font-extrabold text-brand-amber-text shadow-sm backdrop-blur-xs">
              <Layers className="h-3 w-3 shrink-0" aria-hidden="true" />
              Variedades
            </span>
          ) : null}
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

function parseIngredientItems(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((item) => item.replace(/^[\s•\-*]+/, "").replace(/\.+$/, "").trim())
    .filter((item) => item.length > 0);
}

interface ProductQuickViewModalProps {
  product: FeaturedHomeProductItem;
  onClose: () => void;
}

export function ProductQuickViewModal({
  product,
  onClose,
}: ProductQuickViewModalProps) {
  const [activeView, setActiveView] = useState<"product" | "ingredients">(
    "product",
  );

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

  const isGastronomy =
    product.category.slug === "gastronomia" ||
    product.category.slug.includes("gastronom") ||
    product.category.name.toLowerCase().includes("gastronom");
  const ingredientItems = product.ingredients
    ? parseIngredientItems(product.ingredients)
    : [];
  const hasIngredients = ingredientItems.length > 0;
  const canViewIngredients = product.isCombo || isGastronomy || hasIngredients;

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
        <div className="relative aspect-[16/10] max-h-[26dvh] w-full shrink-0 overflow-hidden bg-[#EAE4D7] sm:max-h-none">
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

          <div className="absolute bottom-3 left-3.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green px-3 py-1 text-xs font-bold text-white shadow-md">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Sello Local
            </span>
            {product.isCombo ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-amber px-3 py-1 text-xs font-extrabold text-brand-ink shadow-md">
                <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Variedades
              </span>
            ) : null}
          </div>
        </div>

        {/* Contenedor deslizante sin desborde horizontal en móviles (< 640px) */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="flex w-[200%] items-start transition-transform duration-300 ease-out"
            style={{
              transform:
                activeView === "ingredients"
                  ? "translateX(-50%)"
                  : "translateX(0%)",
            }}
          >
            {/* Panel 1: Vista principal del producto */}
            <div
              aria-hidden={activeView !== "product"}
              inert={activeView !== "product" ? true : undefined}
              className="max-h-[46dvh] w-1/2 min-w-0 shrink-0 space-y-4 overflow-y-auto p-5 sm:max-h-[48dvh] sm:p-6"
            >
              <div className="min-w-0">
                <h3
                  id="quick-view-title"
                  className="break-words text-xl font-extrabold leading-snug text-brand-ink sm:text-2xl"
                >
                  {product.title}
                </h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-brand-green sm:text-sm">
                  <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {product.entrepreneur.businessName} · {product.category.name}
                  </span>
                </p>
              </div>

              <div className="rounded-2xl bg-brand-sky-tint/80 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-sky-dark">
                  Descripción
                </p>
                <p className="mt-1.5 break-words whitespace-pre-line text-xs leading-relaxed text-brand-ink sm:text-sm">
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

                {/* Insignias de modalidades de entrega junto al barrio */}
                {product.entrepreneur.hasPickup ||
                product.entrepreneur.hasDelivery ||
                product.entrepreneur.atFair ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.entrepreneur.hasPickup ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#B8D2EA] bg-[#EDF4FC] px-2.5 py-0.5 text-[11px] font-bold text-brand-sky-dark">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        Retiro en mi barrio
                      </span>
                    ) : null}
                    {product.entrepreneur.hasDelivery ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand-green/30 bg-brand-green-soft px-2.5 py-0.5 text-[11px] font-bold text-brand-green-dark">
                        <Truck className="h-3 w-3 shrink-0" aria-hidden="true" />
                        Envíos en San Roque
                      </span>
                    ) : null}
                    {product.entrepreneur.atFair ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand-amber/45 bg-brand-amber-soft px-2.5 py-0.5 text-[11px] font-bold text-brand-amber-text">
                        <Store className="h-3 w-3 shrink-0" aria-hidden="true" />
                        Participa en la Feria
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {product.entrepreneur.bio ? (
                  <p className="mt-2 break-words text-xs leading-relaxed text-brand-muted">
                    {product.entrepreneur.bio}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Panel 2: Vista secundaria deslizante de Ingredientes o Variedades */}
            <div
              aria-hidden={activeView !== "ingredients"}
              inert={activeView !== "ingredients" ? true : undefined}
              className="max-h-[46dvh] w-1/2 min-w-0 shrink-0 space-y-4 overflow-y-auto p-5 sm:max-h-[48dvh] sm:p-6"
            >
              <button
                type="button"
                onClick={() => setActiveView("product")}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-brand-sky-tint px-3.5 py-1.5 text-xs font-bold text-brand-sky-dark transition-colors hover:bg-brand-sky-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Volver al producto</span>
              </button>

              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-green">
                  {product.isCombo ? (
                    <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChefHat className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {product.isCombo
                      ? "Variedades / Qué incluye"
                      : "Ingredientes y elaboración"}
                  </span>
                </p>
                <h4 className="mt-1 break-words text-lg font-extrabold leading-snug text-brand-ink sm:text-xl">
                  {product.title}
                </h4>
              </div>

              {hasIngredients ? (
                <div className="rounded-2xl border border-brand-sky/25 bg-brand-sky-tint/70 p-4">
                  <ul className="space-y-2 text-xs leading-relaxed text-brand-ink sm:text-sm">
                    {ingredientItems.map((item, index) => (
                      <li
                        key={`${index}-${item}`}
                        className="flex items-start gap-2.5"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-green"
                        />
                        <span className="break-words font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl bg-brand-cream p-5 text-center">
                  <p className="text-xs font-semibold leading-relaxed text-brand-ink sm:text-sm">
                    {product.isCombo
                      ? "Consultá las variedades disponibles directamente por WhatsApp con el emprendedor."
                      : "Elaborado artesanalmente con dedicación y recetas locales de San Roque."}
                  </p>
                </div>
              )}

              {/* Aviso de consulta siempre visible */}
              <div className="flex items-start gap-2.5 rounded-2xl border border-brand-amber/40 bg-brand-amber-soft/85 p-3.5 text-xs leading-relaxed text-brand-amber-text">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>
                  <strong>
                    {product.isCombo
                      ? "¿Querés armar tu pedido a medida?"
                      : "¿Tenés alguna duda o alergia alimentaria?"}
                  </strong>{" "}
                  Consultale directamente al emprendedor por WhatsApp antes de
                  encargar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer sticky con botón WhatsApp siempre accesible */}
        <div className="shrink-0 border-t border-brand-border bg-brand-surface px-5 pt-3.5 pb-5 sm:px-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-green/25 transition-all hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Contactar por WhatsApp</span>
          </a>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-brand-muted">
            {activeView === "product" ? (
              <>
                <span>Conectá directamente sin intermediarios</span>
                {canViewIngredients ? (
                  <button
                    type="button"
                    onClick={() => setActiveView("ingredients")}
                    className="inline-flex items-center gap-1 font-bold text-brand-green hover:underline focus:outline-none focus-visible:underline"
                  >
                    <span>
                      {product.isCombo
                        ? "Ver variedades →"
                        : "Ver ingredientes →"}
                    </span>
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView("product")}
                  className="inline-flex items-center gap-1 font-bold text-brand-sky-dark hover:underline focus:outline-none focus-visible:underline"
                >
                  <span>← Volver al producto</span>
                </button>
                <span>Conectá directamente sin intermediarios</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
