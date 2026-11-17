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
    <article className="group flex flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-black/5 transition-all duration-300 ease-out sm:hover:-translate-y-1.5 sm:hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.10)]">
      {/* Contenedor con aspect-ratio exacto desde DB para garantizar CLS = 0 */}
      <Link
        href={`/productos/${product.slug}`}
        className="relative block w-full overflow-hidden rounded-t-[28px] bg-[#EAE4D7] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0E4B27]"
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
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs font-medium text-[#525E57]">
            Sin imagen
          </div>
        )}

        <div className="absolute top-2.5 right-2.5 left-2.5 flex flex-wrap items-center justify-between gap-1.5">
          <span className="inline-flex max-w-full truncate rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-[#0E4B27] shadow-md shadow-black/5 backdrop-blur-xs">
            {product.category.name}
          </span>

          {product.expirationBadge === "TODAY" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-[#7A3E0A] shadow-md shadow-black/5 backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C86D14]" />
              Vence hoy
            </span>
          ) : product.expirationBadge === "TEMPORARY" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-semibold text-[#0E4B27] shadow-md shadow-black/5 backdrop-blur-xs">
              Edición temporal
            </span>
          ) : null}
        </div>
      </Link>

      {/* Cuerpo de la tarjeta premium (sin precios) optimizado desde 360px */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-3.5 sm:p-5">
        <div>
          {/* Jerarquía de autoría del taller/emprendedor */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[#1C2420] sm:text-xs">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5 shrink-0 text-[#0E4B27]"
            >
              <path
                fillRule="evenodd"
                d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="truncate">{product.entrepreneur.businessName}</span>
          </div>

          <h2 className="mt-1.5 line-clamp-2 text-xs font-extrabold leading-snug text-[#1C2420] sm:text-base">
            <Link
              href={`/productos/${product.slug}`}
              className="transition-colors hover:text-[#0E4B27] focus:outline-none focus-visible:underline"
            >
              {product.title}
            </Link>
          </h2>
        </div>

        {/* Botón directo a WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Contactar por WhatsApp a ${product.entrepreneur.businessName} por ${product.title}`}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#F6F3EC] px-3 py-2.5 text-xs font-bold text-[#0E4B27] transition-all duration-200 hover:bg-[#0E4B27] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4B27] focus-visible:ring-offset-2 sm:text-sm"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.25-5.01-4.45-.15-.2-1.2-1.59-1.2-3.04 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .4.01.57.01.18 0 .43-.07.67.51.24.59.84 2.04.91 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.49.22.57.35.07.12.07.71-.17 1.39z" />
          </svg>
          <span>WhatsApp</span>
        </a>
      </div>
    </article>
  );
}
