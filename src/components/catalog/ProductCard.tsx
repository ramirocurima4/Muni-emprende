import Link from "next/link";
import type { PublicProductCardItem } from "@/lib/catalog";
import { getProductImageUrl } from "@/lib/images";
import { buildProductWhatsappUrl } from "@/lib/whatsapp";

interface ProductCardProps {
  product: PublicProductCardItem;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.primaryImage;
  const imgWidth = image?.width ?? 900;
  const imgHeight = image?.height ?? 1200;
  const thumbUrl = image
    ? getProductImageUrl(image.relativePath, "thumb")
    : null;

  const whatsappUrl = buildProductWhatsappUrl({
    whatsappNumber: product.entrepreneur.whatsappNumber,
    businessName: product.entrepreneur.businessName,
    productTitle: product.title,
  });

  return (
    <article className="group flex flex-col overflow-hidden rounded-[28px] bg-brand-surface shadow-2xl shadow-black/5 transition-all duration-300 ease-out sm:hover:-translate-y-1.5 sm:hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.10)]">
      {/* Espacio superior para la foto con aspect-ratio exacto desde DB (CLS = 0) */}
      <Link
        href={`/productos/${product.slug}`}
        className="relative block w-full overflow-hidden rounded-t-[28px] bg-[#EAE4D7] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green"
        style={{ aspectRatio: `${imgWidth} / ${imgHeight}` }}
      >
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={product.title}
            width={imgWidth}
            height={imgHeight}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-4 text-center text-xs font-medium text-brand-muted">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              className="h-6 w-6 text-brand-amber-text"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <span>Sin imagen</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute top-2.5 right-2.5 left-2.5 flex flex-wrap items-center justify-between gap-1.5">
          <span className="inline-flex max-w-full truncate rounded-full bg-brand-sky-light/95 px-2.5 py-0.5 text-[11px] font-semibold text-brand-sky-dark shadow-md shadow-black/5 backdrop-blur-xs">
            {product.category.name}
          </span>

          {product.expirationBadge === "TODAY" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-amber px-2.5 py-0.5 text-[10px] font-bold text-brand-ink shadow-md shadow-black/5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-ink" />
              Vence hoy
            </span>
          ) : product.expirationBadge === "TEMPORARY" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-surface/95 px-2.5 py-0.5 text-[10px] font-semibold text-brand-green shadow-md shadow-black/5 backdrop-blur-xs">
              Edición temporal
            </span>
          ) : null}
        </div>
      </Link>

      {/* Cuerpo de la tarjeta (sin precios) optimizado desde 360px */}
      <div className="flex flex-1 flex-col justify-between gap-3.5 p-3.5 sm:p-5">
        <div className="space-y-2">
          <h2 className="line-clamp-2 text-[13px] font-extrabold leading-snug text-brand-ink sm:text-base">
            <Link
              href={`/productos/${product.slug}`}
              className="transition-colors hover:text-brand-green focus:outline-none focus-visible:underline"
            >
              {product.title}
            </Link>
          </h2>

          {/* Nombre del emprendedor local */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-muted sm:text-xs">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green-soft text-brand-green">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span className="truncate text-brand-ink">
              {product.entrepreneur.businessName}
            </span>
          </div>
        </div>

        {/* Botón verde vibrante principal de contacto directo por WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Contactar por WhatsApp a ${product.entrepreneur.businessName} por ${product.title}`}
          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-2xl bg-brand-green px-2.5 py-2 text-center text-[11px] font-bold leading-tight text-white shadow-sm shadow-brand-green/20 transition-all duration-200 hover:bg-brand-green-hover hover:shadow-md hover:shadow-brand-green/25 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 sm:px-3.5 sm:py-2.5 sm:text-xs lg:text-[13px]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.25-5.01-4.45-.15-.2-1.2-1.59-1.2-3.04 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .4.01.57.01.18 0 .43-.07.67.51.24.59.84 2.04.91 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.49.22.57.35.07.12.07.71-.17 1.39z" />
          </svg>
          <span>Contactar por WhatsApp</span>
        </a>
      </div>
    </article>
  );
}
