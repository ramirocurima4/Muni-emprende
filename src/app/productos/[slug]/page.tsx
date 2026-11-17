import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPublicProductBySlug } from "@/lib/catalog";
import { getProductImageUrl } from "@/lib/images";
import { buildProductWhatsappUrl } from "@/lib/whatsapp";

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

  const primaryImage = product.images[0];
  const ogImageUrl = primaryImage
    ? getProductImageUrl(primaryImage.relativePath, "full")
    : undefined;

  return {
    title: product.title,
    description: `${product.description} · Emprendimiento: ${product.entrepreneur.businessName}`,
    openGraph: {
      title: product.title,
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
          className="inline-flex items-center gap-1 rounded-full bg-brand-surface px-3.5 py-1.5 text-xs font-semibold text-brand-green shadow-2xs transition-colors hover:bg-brand-green-soft"
        >
          ← Inicio
        </Link>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-surface px-3.5 py-1.5 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand-sky-light hover:text-brand-sky-dark"
        >
          Ver catálogo completo
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-6 rounded-[30px] border border-brand-border bg-brand-surface p-5 shadow-[0_24px_56px_-16px_rgba(61,122,30,0.12)] sm:p-8 md:grid-cols-2">
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
                className="inline-flex rounded-full bg-brand-sky-light px-3.5 py-1 text-xs font-semibold text-brand-sky-dark transition-colors hover:bg-brand-sky/30"
              >
                {product.category.name}
              </Link>

              {product.expirationBadge === "TODAY" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-amber px-3 py-1 text-xs font-bold text-brand-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-ink" />
                  Vence hoy
                </span>
              ) : product.expirationBadge === "TEMPORARY" ? (
                <span className="inline-flex items-center rounded-full bg-brand-green-soft px-3 py-1 text-xs font-semibold text-brand-green">
                  Oferta temporal
                </span>
              ) : null}
            </div>

            <h1 className="mt-3.5 text-xl font-extrabold leading-snug text-brand-ink sm:text-2xl">
              {product.title}
            </h1>

            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-brand-ink">
              {product.description}
            </p>

            <div className="mt-6 rounded-2xl border border-brand-border bg-brand-cream p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-amber-text">
                Elaborado / ofrecido por
              </p>
              <p className="mt-1 text-sm font-bold text-brand-ink">
                {product.entrepreneur.businessName}
              </p>
              <p className="text-xs font-medium text-brand-muted">
                {product.entrepreneur.ownerName}
                {product.entrepreneur.neighborhood
                  ? ` · ${product.entrepreneur.neighborhood}`
                  : ""}
              </p>
              {product.entrepreneur.bio ? (
                <p className="mt-2 text-xs leading-relaxed text-brand-muted">
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(61,122,30,0.34)] transition-all hover:-translate-y-0.5 hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
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

            <p className="text-center text-[11px] font-medium text-brand-muted">
              Al tocar el botón se abrirá WhatsApp para coordinar el pago y la
              entrega directamente con {product.entrepreneur.businessName}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
