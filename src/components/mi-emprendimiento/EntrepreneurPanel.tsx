"use client";

import type { ProductStatus } from "@prisma/client";
import { CheckCircle2, Clock3, ExternalLink, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  PanelCategoryItem,
  PanelEntrepreneurProfile,
  PanelProductItem,
} from "@/lib/server/entrepreneur-panel";
import { IdentitySection } from "./IdentitySection";
import { ProductControlCard } from "./ProductControlCard";
import { ProductWizardModal } from "./ProductWizardModal";

interface EntrepreneurPanelProps {
  initialProfile: PanelEntrepreneurProfile;
  initialProducts: PanelProductItem[];
  categories: PanelCategoryItem[];
}

export function EntrepreneurPanel({
  initialProfile,
  initialProducts,
  categories,
}: EntrepreneurPanelProps) {
  const router = useRouter();

  const [profile, setProfile] =
    useState<PanelEntrepreneurProfile>(initialProfile);
  const [products, setProducts] = useState<PanelProductItem[]>(initialProducts);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<"create" | "edit">("create");
  const [editingProduct, setEditingProduct] = useState<PanelProductItem | null>(
    null,
  );

  const [saveBanner, setSaveBanner] = useState<{
    type: "pending" | "published";
    text: string;
  } | null>(null);

  const publishedCount = products.filter(
    (item) => item.status === "APPROVED",
  ).length;
  const pendingCount = products.filter(
    (item) => item.status === "PENDING",
  ).length;

  function openCreateWizard() {
    setWizardMode("create");
    setEditingProduct(null);
    setWizardOpen(true);
  }

  function openEditWizard(product: PanelProductItem) {
    setWizardMode("edit");
    setEditingProduct(product);
    setWizardOpen(true);
  }

  function handleProductSaved(result: {
    product: PanelProductItem;
    publishedDirectly: boolean;
    mode: "create" | "edit";
  }) {
    setProducts((prev) => {
      if (result.mode === "create") {
        return [result.product, ...prev];
      }
      return prev.map((item) =>
        item.id === result.product.id ? result.product : item,
      );
    });

    setWizardOpen(false);
    setEditingProduct(null);

    if (!result.publishedDirectly && result.product.status === "PENDING") {
      setSaveBanner({
        type: "pending",
        text: "¡Listo! Tu producto quedó enviado. En breve el equipo de la Muni lo revisa y aparece en el catálogo",
      });
    } else {
      setSaveBanner({
        type: "published",
        text:
          result.mode === "create"
            ? "¡Listo! Tu producto ya quedó publicado en el catálogo de San Roque."
            : "¡Listo! Guardamos los cambios de tu producto y sigue publicado.",
      });
    }

    router.refresh();
  }

  function handleProductStatusChanged(
    productId: string,
    nextStatus: ProductStatus,
  ) {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, status: nextStatus } : item,
      ),
    );
    router.refresh();
  }

  function handleProductDeleted(productId: string) {
    setProducts((prev) => prev.filter((item) => item.id !== productId));
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Cabecera simple de bienvenida */}
      <header className="rounded-[28px] border border-brand-sky/30 bg-white p-5 shadow-lg shadow-brand-sky/10 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-sky-dark">
              Panel del Emprendedor
            </p>
            <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">
              ¡Hola, {profile.ownerName}!
            </h1>
            <p className="mt-0.5 text-sm text-brand-muted">
              Administrá la vidriera de{" "}
              <strong className="text-brand-ink">{profile.businessName}</strong>
            </p>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl border border-brand-sky/40 bg-[#E8F1F8] px-4 py-2 text-sm font-bold text-brand-sky-dark transition-colors hover:bg-brand-sky-light"
          >
            <span>Ver catálogo</span>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Resumen rápido sin tecnicismos */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-brand-green-soft/75 px-4 py-3">
            <p className="text-xs font-bold text-brand-green-dark">
              Publicados ahora
            </p>
            <p className="mt-0.5 text-2xl font-black text-brand-green-dark">
              {publishedCount}
            </p>
          </div>

          <div className="rounded-2xl bg-[#FEF3DC] px-4 py-3">
            <p className="text-xs font-bold text-[#8A4F00]">En revisión</p>
            <p className="mt-0.5 text-2xl font-black text-[#8A4F00]">
              {pendingCount}
            </p>
          </div>
        </div>
      </header>

      {/* Cartel de confirmación tras subir o editar un producto */}
      {saveBanner ? (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-[24px] border-2 p-4 sm:p-5 ${
            saveBanner.type === "pending"
              ? "border-[#F5A623]/60 bg-[#FEF3DC] text-[#78350F]"
              : "border-brand-green/35 bg-brand-green-soft text-brand-green-dark"
          }`}
        >
          <div className="flex items-start gap-3">
            {saveBanner.type === "pending" ? (
              <Clock3 className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2
                className="mt-0.5 h-6 w-6 shrink-0"
                aria-hidden="true"
              />
            )}
            <p className="text-sm font-extrabold leading-relaxed sm:text-base">
              {saveBanner.text}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSaveBanner(null)}
            className="shrink-0 rounded-xl bg-white/70 px-3 py-1.5 text-xs font-bold text-brand-ink hover:bg-white"
          >
            Cerrar
          </button>
        </div>
      ) : null}

      {/* SECCIÓN 2 destacada arriba o debajo de identidad? El orden pedido: 1. Identidad, 2. Botón gigante, 3. Mis Productos */}
      <IdentitySection
        profile={profile}
        onProfileUpdated={(nextProfile) => {
          setProfile(nextProfile);
          router.refresh();
        }}
      />

      {/* SECCIÓN 2: Botón gigante 'Subir Nuevo Producto' */}
      <section aria-label="Cargar producto nuevo">
        <button
          type="button"
          onClick={openCreateWizard}
          className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-[26px] bg-brand-green px-6 py-4 text-center text-lg font-extrabold tracking-tight text-white shadow-xl shadow-brand-green/25 transition-all duration-150 hover:bg-brand-green-hover active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 sm:text-xl"
        >
          <PlusCircle className="h-7 w-7 shrink-0" aria-hidden="true" />
          <span>Subir Nuevo Producto</span>
        </button>
      </section>

      {/* SECCIÓN 3: Mis Productos Publicados (Tarjetas de control) */}
      <section aria-labelledby="mis-productos-heading" className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2
            id="mis-productos-heading"
            className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl"
          >
            Mis Productos Publicados
          </h2>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-brand-sky-dark shadow-2xs">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[28px] border border-brand-sky/30 bg-white px-6 py-10 text-center shadow-lg shadow-brand-sky/10">
            <p className="text-lg font-extrabold text-brand-ink">
              Todavía no subiste productos
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">
              Tocá el botón verde{" "}
              <strong className="text-brand-green-dark">
                Subir Nuevo Producto
              </strong>{" "}
              de arriba para mostrar lo que hacés o vendés.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {products.map((product) => (
              <ProductControlCard
                key={product.id}
                product={product}
                onEdit={openEditWizard}
                onStatusChanged={handleProductStatusChanged}
                onDeleted={handleProductDeleted}
              />
            ))}
          </ul>
        )}
      </section>

      {wizardOpen ? (
        <ProductWizardModal
          key={`${wizardMode}-${editingProduct?.id ?? "new"}`}
          mode={wizardMode}
          initialProduct={editingProduct}
          categories={categories}
          isTrusted={profile.isTrusted}
          onClose={() => {
            setWizardOpen(false);
            setEditingProduct(null);
          }}
          onSaved={handleProductSaved}
        />
      ) : null}
    </div>
  );
}
