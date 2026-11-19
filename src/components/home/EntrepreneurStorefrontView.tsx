"use client";

import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  Share2,
  Store,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  FeaturedHomeProductItem,
  PublicEntrepreneurStorefront,
} from "@/lib/catalog";
import { getUploadImageUrl } from "@/lib/images";
import { buildInstitutionalWhatsappUrl } from "@/lib/whatsapp";
import {
  ProductQuickViewModal,
  ShowcaseProductCard,
} from "./HomeProductShowcase";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "SR";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function EntrepreneurStorefrontView({
  storefront,
}: {
  storefront: PublicEntrepreneurStorefront | null;
}) {
  const router = useRouter();
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

  if (!storefront) {
    return (
      <section className="space-y-5 rounded-[32px] border border-[#A6C4E0] bg-[#D6E6F4] p-6 text-center shadow-xl sm:p-10">
        <p className="text-lg font-extrabold text-brand-ink sm:text-xl">
          No encontramos esa vidriera o todavía no está habilitada
        </p>
        <p className="mx-auto max-w-md text-xs text-brand-muted sm:text-sm">
          Podés volver al catálogo general para recorrer todos los
          emprendimientos activos de San Roque.
        </p>
        <div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-green px-5 py-3 text-sm font-extrabold text-white shadow-md transition-colors hover:bg-brand-green-hover"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Volver al catálogo completo de San Roque</span>
          </button>
        </div>
      </section>
    );
  }

  const { entrepreneur, products } = storefront;

  const avatarUrl = entrepreneur.avatarPath
    ? getUploadImageUrl(entrepreneur.avatarPath, "thumb")
    : null;

  const contactWhatsappUrl = buildInstitutionalWhatsappUrl(
    entrepreneur.whatsappNumber,
    `Hola ${entrepreneur.businessName}! Vi tu vidriera digital en MuniEmprende San Roque y quería consultarte.`,
  );

  function buildShareHref(): string {
    const baseUrl =
      typeof window !== "undefined" &&
      window.location.origin &&
      !window.location.origin.includes("localhost")
        ? window.location.origin
        : "https://muniemprende.sanroque.gob.ar";

    const url = `${baseUrl}/?emprendedor=${encodeURIComponent(entrepreneur.slug)}`;
    const text = `¡Mirá la vidriera de *${entrepreneur.businessName}* en MuniEmprende San Roque! Podés ver sus productos y hacer tu pedido directo por WhatsApp: ${url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  return (
    <section
      aria-labelledby="storefront-heading"
      className="space-y-6 rounded-[32px] border border-[#A6C4E0] bg-gradient-to-br from-[#C5DCEF] via-[#D6E6F4] to-[#E7F3DC]/80 p-5 shadow-xl shadow-[#1F4478]/[0.07] sm:p-8"
    >
      {/* Barra superior con botón para limpiar el filtro y volver al catálogo completo */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface px-4 py-2 text-xs font-extrabold text-brand-green shadow-xs transition-colors hover:bg-brand-green-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Volver al catálogo completo de San Roque</span>
        </button>

        <a
          href={buildShareHref()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#A8C6E3] bg-brand-surface px-3.5 py-2 text-xs font-bold text-brand-sky-dark shadow-xs transition-colors hover:bg-[#EDF4FC]"
        >
          <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Compartir vidriera por WhatsApp</span>
        </a>
      </div>

      {/* Cabecera destacada del emprendimiento */}
      <div className="flex flex-col gap-5 rounded-[28px] border border-[#B8D2EA] bg-brand-surface p-5 shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 border-[#C5DCEF] bg-[#EDF4FC] shadow-sm sm:h-24 sm:w-24">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={entrepreneur.businessName}
                width={160}
                height={160}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-black tracking-tight text-brand-green-dark">
                {getInitials(entrepreneur.businessName)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green-soft px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-green-dark">
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              Vidriera Oficial · Elaboración Sanroqueña
            </span>

            <h1
              id="storefront-heading"
              className="text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl"
            >
              {entrepreneur.businessName}
            </h1>

            <p className="text-xs font-semibold text-brand-muted sm:text-sm">
              {entrepreneur.ownerName}
              {entrepreneur.neighborhood
                ? ` · ${entrepreneur.neighborhood}`
                : ""}
            </p>

            {/* Insignias de modalidades de entrega */}
            {entrepreneur.hasPickup ||
            entrepreneur.hasDelivery ||
            entrepreneur.atFair ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {entrepreneur.hasPickup ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#B8D2EA] bg-[#EDF4FC] px-3 py-1 text-xs font-bold text-brand-sky-dark">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Retiro en mi barrio
                  </span>
                ) : null}
                {entrepreneur.hasDelivery ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-brand-green/30 bg-brand-green-soft px-3 py-1 text-xs font-bold text-brand-green-dark">
                    <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Hago envíos en San Roque
                  </span>
                ) : null}
                {entrepreneur.atFair ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-brand-amber/45 bg-brand-amber-soft px-3 py-1 text-xs font-bold text-brand-amber-text">
                    <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Participo en la Feria
                  </span>
                ) : null}
              </div>
            ) : null}

            {entrepreneur.bio ? (
              <p className="max-w-2xl text-xs leading-relaxed text-brand-muted sm:text-sm">
                {entrepreneur.bio}
              </p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0">
          <a
            href={contactWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-green/20 transition-all hover:-translate-y-0.5 hover:bg-brand-green-hover sm:w-auto"
          >
            <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Productos activos del emprendimiento */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-brand-ink sm:text-xl">
            Productos disponibles de {entrepreneur.businessName}
          </h2>
          <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-extrabold text-brand-sky-dark">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-[#B8D2EA] bg-brand-surface px-6 py-8 text-center">
            <p className="text-sm font-bold text-brand-ink">
              En este momento no hay productos activos cargados en esta
              vidriera.
            </p>
            <p className="mt-1 text-xs text-brand-muted">
              Podés escribirle directo por WhatsApp para consultar por pedidos o
              próximas tandas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <ShowcaseProductCard
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
                badgeLabel={
                  product.expirationBadge === "TODAY"
                    ? "Vence hoy"
                    : product.category.name
                }
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct ? (
        <ProductQuickViewModal
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      ) : null}
    </section>
  );
}
