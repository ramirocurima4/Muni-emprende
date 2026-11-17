import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPublicProductBySlug } from "@/lib/catalog";
import { getProductImageUrl } from "@/lib/images";
import { buildProductWhatsappUrl, formatPriceArs } from "@/lib/whatsapp";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  const formattedPrice = formatPriceArs(product.priceArs);
  const primaryImage = product.images[0];
  const ogImageUrl = primaryImage
    ? getProductImageUrl(primaryImage.relativePath, "full")
    : undefined;

  return {
    title: `${product.title} (${formattedPrice})`,
    description: `${product.description} · Emprendimiento: ${product.entrepreneur.businessName}`,
    openGraph: {
      title: `${product.title} — ${formattedPrice}`,
      description: product.description,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: primaryImage.width,
              height: primaryImage.height,
              alt: product.title,
            },
          ]
        : undefined,
    },
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-3xl bg-[#E6E1D6]/60" />
        </div>
      }
    >
      <ProductDetailContent params={params} />
    </Suspense>
  );
}

async function ProductDetailContent({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const primaryImage = product.images[0];
  const imgWidth = primaryImage?.width ?? 900;
  const imgHeight = primaryImage?.height ?? 1200;
  const fullImageUrl = primaryImage
    ? getProductImageUrl(primaryImage.relativePath, "full")
    : null;

  const formattedPrice = formatPriceArs(product.priceArs);
  const whatsappUrl = buildProductWhatsappUrl({
    whatsappNumber: product.entrepreneur.whatsappNumber,
    businessName: product.entrepreneur.businessName,
    productTitle: product.title,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full bg-[#FDFBF7] px-3.5 py-1.5 text-xs font-semibold text-[#0E4B27] shadow-2xs transition-colors hover:bg-[#E6F0EA]"
        >
          ← Inicio
        </Link>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-1 rounded-full border border-[#ECE6DA] bg-[#FDFBF7] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] transition-colors hover:bg-[#E6F0EA] hover:text-[#0E4B27]"
        >
          Ver catálogo completo
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-6 rounded-[30px] border border-[#ECE6DA] bg-[#FDFBF7] p-5 shadow-[0_24px_56px_-16px_rgba(14,75,39,0.11)] sm:p-8 md:grid-cols-2">
        {/* Imagen principal con su aspect-ratio exacto de DB */}
        <div
          className="overflow-hidden rounded-[22px] bg-[#EAE4D7]"
          style={{ aspectRatio: `${imgWidth} / ${imgHeight}` }}
        >
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
        </div>

        {/* Información del producto y contacto directo */}
        <div className="flex flex-col justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/catalogo?categoria=${product.category.slug}`}
                className="inline-flex rounded-full bg-[#E6F0EA] px-3.5 py-1 text-xs font-semibold text-[#0E4B27] transition-colors hover:bg-[#d4e6db]"
              >
                {product.category.name}
              </Link>

              {product.expirationBadge === "TODAY" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF3E6] px-3 py-1 text-xs font-bold text-[#7A3E0A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C86D14]" />
                  Vence hoy
                </span>
              ) : product.expirationBadge === "TEMPORARY" ? (
                <span className="inline-flex items-center rounded-full bg-[#F6F3EC] px-3 py-1 text-xs font-semibold text-[#0E4B27]">
                  Oferta temporal
                </span>
              ) : null}
            </div>

            <h1 className="mt-3.5 text-xl font-extrabold leading-snug text-[#1C2420] sm:text-2xl">
              {product.title}
            </h1>

            <p className="mt-2 text-2xl font-black text-[#0E4B27]">
              {formattedPrice}
            </p>

            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#1C2420]">
              {product.description}
            </p>

            <div className="mt-6 rounded-2xl border border-[#ECE6DA] bg-[#F6F3EC] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8229]">
                Elaborado / ofrecido por
              </p>
              <p className="mt-1 text-sm font-bold text-[#1C2420]">
                {product.entrepreneur.businessName}
              </p>
              <p className="text-xs font-medium text-[#525E57]">
                {product.entrepreneur.ownerName}
                {product.entrepreneur.neighborhood
                  ? ` · ${product.entrepreneur.neighborhood}`
                  : ""}
              </p>
              {product.entrepreneur.bio ? (
                <p className="mt-2 text-xs leading-relaxed text-[#525E57]">
                  {product.entrepreneur.bio}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0E4B27] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(14,75,39,0.32)] transition-all hover:-translate-y-0.5 hover:bg-[#0A381D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4B27] focus-visible:ring-offset-2"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 shrink-0"
              >
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.25-5.01-4.45-.15-.2-1.2-1.59-1.2-3.04 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .4.01.57.01.18 0 .43-.07.67.51.24.59.84 2.04.91 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.49.22.57.35.07.12.07.71-.17 1.39z" />
              </svg>
              <span>Contactar por WhatsApp</span>
            </a>

            <p className="text-center text-[11px] font-medium text-[#525E57]">
              Al tocar el botón se abrirá WhatsApp para coordinar el pago y la
              entrega directamente con {product.entrepreneur.businessName}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
