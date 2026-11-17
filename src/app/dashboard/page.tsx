import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProductAvailabilitySwitch } from "@/components/dashboard/ProductAvailabilitySwitch";
import { db } from "@/lib/db";
import { getProductImageUrl } from "@/lib/images";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mis Productos · Panel del Emprendedor",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="h-40 animate-pulse rounded-[28px] bg-[#E8E2D5]/70" />
      <div className="h-14 animate-pulse rounded-2xl bg-[#E8E2D5]/70" />
      <div className="space-y-3.5">
        <div className="h-28 animate-pulse rounded-2xl bg-[#E8E2D5]/70" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#E8E2D5]/70" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#E8E2D5]/70" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  const session = await getSession();
  if (!session || session.role !== "ENTREPRENEUR") {
    redirect("/login");
  }

  const entrepreneur = await db.entrepreneur.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      businessName: true,
      ownerName: true,
      status: true,
      rejectionReason: true,
      products: {
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          status: true,
          rejectionReason: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: {
              relativePath: true,
              width: true,
              height: true,
            },
          },
        },
      },
    },
  });

  if (!entrepreneur) {
    redirect("/login");
  }

  const publishedCount = entrepreneur.products.filter(
    (product) => product.status === "APPROVED",
  ).length;

  const accountStatusBadge = {
    APPROVED: {
      label: "Cuenta Verificada y Activa",
      containerClass: "bg-[#E6F0EA] text-[#0E4B27] border-[#0E4B27]/20",
      dotClass: "bg-[#0E4B27]",
    },
    PENDING: {
      label: "En Revisión",
      containerClass: "bg-[#FEF3C7] text-[#78350F] border-[#F59E0B]/40",
      dotClass: "bg-[#D97706]",
    },
    REJECTED: {
      label: "Requiere Correcciones",
      containerClass: "bg-[#FDF2F2] text-[#7A1C1C] border-[#D98282]",
      dotClass: "bg-[#B91C1C]",
    },
    SUSPENDED: {
      label: "Cuenta Suspendida",
      containerClass: "bg-[#FDF2F2] text-[#7A1C1C] border-[#D98282]",
      dotClass: "bg-[#B91C1C]",
    },
  }[entrepreneur.status];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-5 sm:px-6 sm:py-8">
      {/* 1. Header y Estado */}
      <section className="rounded-[28px] bg-white p-5 shadow-xl shadow-black/5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9E8229]">
                {entrepreneur.businessName}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1C2420] sm:text-3xl">
                Mis Productos
              </h1>
            </div>

            {/* Badge de estado de cuenta */}
            <span
              role="status"
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold ${accountStatusBadge.containerClass}`}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${accountStatusBadge.dotClass}`}
              />
              {accountStatusBadge.label}
            </span>
          </div>

          {entrepreneur.status === "PENDING" ? (
            <p className="rounded-2xl bg-[#FEF3C7]/60 px-4 py-3 text-xs leading-relaxed text-[#78350F]">
              Tu cuenta está siendo verificada por la Municipalidad de San Roque.
              Apenas se apruebe, tus publicaciones aprobadas aparecerán en la
              feria pública.
            </p>
          ) : null}

          {entrepreneur.status === "REJECTED" && entrepreneur.rejectionReason ? (
            <p className="rounded-2xl bg-[#FDF2F2] px-4 py-3 text-xs leading-relaxed text-[#7A1C1C]">
              <strong>Motivo de observación:</strong>{" "}
              {entrepreneur.rejectionReason}
            </p>
          ) : null}

          {/* Contador simple de Productos Publicados (sin tarjeta ni métrica de Visitas) */}
          <div className="flex items-center justify-between rounded-2xl bg-[#F6F3EC] px-4 py-3.5">
            <span className="text-sm font-bold text-[#1C2420]">
              Productos Publicados
            </span>
            <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-xl bg-white px-3 py-1 text-lg font-extrabold text-[#0E4B27] shadow-2xs">
              {publishedCount}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Acción Principal: Botón full-width verde oscuro destacado */}
      <section aria-label="Acción principal">
        <Link
          href="/dashboard/productos/nuevo"
          className="flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0E4B27] px-6 py-4 text-center text-base font-extrabold tracking-tight text-white shadow-xl shadow-[#0E4B27]/25 transition-all duration-150 hover:bg-[#0A381D] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4B27] focus-visible:ring-offset-2"
        >
          <span>+ Cargar Nuevo Producto</span>
        </Link>
      </section>

      {/* 3. Sección 'Mis Publicaciones' en lista vertical con Switch */}
      <section aria-labelledby="mis-publicaciones-heading" className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2
            id="mis-publicaciones-heading"
            className="text-lg font-extrabold tracking-tight text-[#1C2420]"
          >
            Mis Publicaciones
          </h2>
          <span className="text-xs font-semibold text-[#525E57]">
            {entrepreneur.products.length}{" "}
            {entrepreneur.products.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {entrepreneur.products.length === 0 ? (
          <div className="rounded-[24px] bg-white px-6 py-10 text-center shadow-lg shadow-black/[0.04]">
            <p className="text-base font-bold text-[#1C2420]">
              Todavía no cargaste productos
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#525E57]">
              Tocá el botón verde{" "}
              <strong className="text-[#0E4B27]">+ Cargar Nuevo Producto</strong>{" "}
              para sumar tu primera creación a la feria digital.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3.5">
            {entrepreneur.products.map((product) => {
              const primaryImage = product.images[0];
              const thumbUrl = primaryImage
                ? getProductImageUrl(primaryImage.relativePath, "thumb")
                : null;

              return (
                <li
                  key={product.id}
                  className="rounded-2xl bg-white p-3.5 shadow-lg shadow-black/[0.04] sm:p-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Foto en miniatura */}
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#EAE4D7] sm:h-24 sm:w-24">
                      {thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbUrl}
                          alt={product.title}
                          width={primaryImage?.width ?? 480}
                          height={primaryImage?.height ?? 480}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] font-semibold text-[#525E57]">
                          Sin foto
                        </div>
                      )}
                    </div>

                    {/* Título (sin precio) + Interruptor */}
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-[#1C2420] sm:text-base">
                        {product.title}
                      </h3>

                      <ProductAvailabilitySwitch
                        productId={product.id}
                        productTitle={product.title}
                        status={product.status}
                        rejectionReason={product.rejectionReason}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
