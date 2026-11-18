"use client";

import type { ProductStatus } from "@prisma/client";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import type { PanelProductItem } from "@/lib/server/entrepreneur-panel";

interface ProductControlCardProps {
  product: PanelProductItem;
  onEdit: (product: PanelProductItem) => void;
  onStatusChanged: (productId: string, nextStatus: ProductStatus) => void;
  onDeleted: (productId: string) => void;
}

export function ProductControlCard({
  product,
  onEdit,
  onStatusChanged,
  onDeleted,
}: ProductControlCardProps) {
  const [isToggling, startToggleTransition] = useTransition();
  const [toggleError, setToggleError] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isToggleable =
    product.status === "APPROVED" || product.status === "PAUSED";
  const serverAvailable = product.status === "APPROVED";
  const [optimisticAvailable, setOptimisticAvailable] =
    useOptimistic(serverAvailable);

  function getStatusBadge() {
    if (product.status === "APPROVED") {
      return {
        label: "Publicado",
        classes:
          "border-brand-green/30 bg-brand-green-soft text-brand-green-dark",
        dot: "bg-brand-green",
      };
    }
    if (product.status === "PAUSED") {
      return {
        label: "Agotado hoy",
        classes: "border-[#F5A623]/50 bg-[#FEF3DC] text-[#8A4F00]",
        dot: "bg-[#D97706]",
      };
    }
    if (product.status === "PENDING") {
      return {
        label: "En revisión",
        classes: "border-[#F5A623]/50 bg-[#FEF3DC] text-[#8A4F00]",
        dot: "bg-[#D97706]",
      };
    }
    if (product.status === "REJECTED") {
      return {
        label: "Necesita cambios",
        classes: "border-[#D98282] bg-[#FDF2F2] text-[#7A1C1C]",
        dot: "bg-[#B91C1C]",
      };
    }
    return {
      label: "Pausado por la Muni",
      classes: "border-[#D98282] bg-[#FDF2F2] text-[#7A1C1C]",
      dot: "bg-[#B91C1C]",
    };
  }

  function handleToggleAvailability() {
    if (!isToggleable || isToggling) return;
    setToggleError(null);
    const nextAvailable = !optimisticAvailable;

    startToggleTransition(async () => {
      setOptimisticAvailable(nextAvailable);

      try {
        const response = await fetch(
          `/api/mi-emprendimiento/productos/${product.id}/disponibilidad`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ available: nextAvailable }),
          },
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(
            data.error ?? "No pudimos cambiar si está disponible.",
          );
        }
        onStatusChanged(product.id, data.status);
      } catch (err) {
        setToggleError(
          err instanceof Error
            ? err.message
            : "No pudimos guardar el cambio. Probá de nuevo.",
        );
      }
    });
  }

  async function handleConfirmDelete() {
    if (isDeleting) return;
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/mi-emprendimiento/productos/${product.id}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "No pudimos eliminar el producto en este momento.",
        );
      }
      onDeleted(product.id);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "No pudimos eliminar el producto. Probá de nuevo.",
      );
      setIsDeleting(false);
    }
  }

  const badge = getStatusBadge();

  return (
    <li className="rounded-[26px] border border-brand-sky/30 bg-white p-4 shadow-lg shadow-brand-sky/10 sm:p-5">
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Foto miniatura */}
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#E8F1F8] sm:h-28 sm:w-28">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image.thumbUrl}
              alt={product.title}
              width={product.image.width}
              height={product.image.height}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs font-bold text-brand-muted">
              Sin foto
            </div>
          )}
        </div>

        {/* Estado, rubro y título */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${badge.classes}`}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${badge.dot}`}
              />
              {badge.label}
            </span>

            <span className="rounded-full bg-[#E8F1F8] px-2.5 py-1 text-[11px] font-bold text-brand-sky-dark">
              {product.category.name}
            </span>
          </div>

          <h3 className="mt-2 line-clamp-2 text-base font-extrabold leading-snug text-brand-ink sm:text-lg">
            {product.title}
          </h3>

          {product.ingredients ? (
            <p className="mt-1 line-clamp-1 text-xs text-brand-muted">
              <strong>Ingredientes:</strong> {product.ingredients}
            </p>
          ) : null}
        </div>
      </div>

      {/* Aviso si la Muni pidió un cambio o pausó el producto */}
      {(product.status === "REJECTED" || product.status === "SUSPENDED") &&
      product.rejectionReason ? (
        <div className="mt-3.5 rounded-2xl border border-[#D98282] bg-[#FDF2F2] px-4 py-3 text-xs leading-relaxed text-[#7A1C1C]">
          <strong>
            {product.status === "REJECTED"
              ? "La Muni te pidió un cambio:"
              : "La Muni pausó este producto:"}
          </strong>{" "}
          {product.rejectionReason}
        </div>
      ) : null}

      {/* Aviso amable si está en revisión */}
      {product.status === "PENDING" ? (
        <div className="mt-3.5 rounded-2xl border border-[#F5A623]/40 bg-[#FEF3DC]/80 px-4 py-2.5 text-xs font-semibold text-[#78350F]">
          En breve el equipo de la Muni lo revisa y aparece en el catálogo.
        </div>
      ) : null}

      {/* Switch grande Disponible / Agotado hoy */}
      {isToggleable ? (
        <div className="mt-4">
          <button
            type="button"
            role="switch"
            aria-checked={optimisticAvailable}
            aria-label={`Cambiar disponibilidad de ${product.title}`}
            disabled={isToggling}
            onClick={handleToggleAvailability}
            className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:cursor-wait ${
              optimisticAvailable
                ? "border-brand-green/35 bg-brand-green-soft/85 hover:bg-brand-green-soft"
                : "border-[#F5A623]/55 bg-[#FEF3DC] hover:bg-[#FDE9BE]"
            }`}
          >
            <div className="min-w-0">
              <span className="block text-sm font-extrabold text-brand-ink sm:text-base">
                {optimisticAvailable ? "Disponible" : "Agotado hoy"}
              </span>
              <span
                className={`block text-xs font-semibold ${
                  optimisticAvailable
                    ? "text-brand-green-dark"
                    : "text-[#8A4F00]"
                }`}
              >
                {isToggling
                  ? "Actualizando..."
                  : optimisticAvailable
                    ? "Se muestra en el catálogo · Tocá si te quedaste sin stock"
                    : "Oculto por hoy · Tocá cuando vuelvas a tener"}
              </span>
            </div>

            <span
              aria-hidden="true"
              className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full p-1 transition-colors duration-200 ${
                optimisticAvailable ? "bg-brand-green" : "bg-[#D97706]"
              }`}
            >
              <span
                className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  optimisticAvailable ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </span>
          </button>

          {toggleError ? (
            <p role="alert" className="mt-1.5 text-xs font-bold text-[#9B2226]">
              {toggleError}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Botones claros para Editar o Eliminar */}
      {!confirmingDelete ? (
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={product.status === "SUSPENDED"}
            onClick={() => onEdit(product)}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[#E8F1F8] px-4 py-2.5 text-sm font-bold text-brand-sky-dark transition-colors hover:bg-brand-sky-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            <span>Editar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setConfirmingDelete(true);
            }}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-[#F0CACA] bg-[#FDF2F2] px-4 py-2.5 text-sm font-bold text-[#8B1E1E] transition-colors hover:bg-[#FADEDE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C]"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>Eliminar</span>
          </button>
        </div>
      ) : (
        <div className="mt-3.5 rounded-2xl border border-[#D98282] bg-[#FDF2F2] p-3.5">
          <p className="text-sm font-bold text-[#7A1C1C]">
            ¿Seguro querés eliminar &ldquo;{product.title}&rdquo;?
          </p>
          {deleteError ? (
            <p role="alert" className="mt-1 text-xs font-semibold text-[#9B2226]">
              {deleteError}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setConfirmingDelete(false)}
              className="min-h-[44px] rounded-xl bg-white px-3 py-2 text-sm font-bold text-brand-ink shadow-2xs transition-colors hover:bg-brand-cream disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#B91C1C] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#991B1B] disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Borrando...</span>
                </>
              ) : (
                <span>Sí, eliminar</span>
              )}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
