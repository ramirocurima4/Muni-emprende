"use client";

import type { ProductStatus } from "@prisma/client";
import { useOptimistic, useState, useTransition } from "react";
import { toggleProductAvailabilityAction } from "@/app/actions/products";

interface ProductAvailabilitySwitchProps {
  productId: string;
  productTitle: string;
  status: ProductStatus;
  rejectionReason?: string | null;
}

export function ProductAvailabilitySwitch({
  productId,
  productTitle,
  status,
  rejectionReason,
}: ProductAvailabilitySwitchProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isToggleable = status === "APPROVED" || status === "PAUSED";
  const serverAvailable = status === "APPROVED";
  const [optimisticAvailable, setOptimisticAvailable] =
    useOptimistic(serverAvailable);

  if (!isToggleable) {
    const badgeConfig =
      status === "PENDING"
        ? {
            label: "En revisión municipal",
            className: "bg-[#FEF3C7] text-[#78350F] border-[#F59E0B]/40",
            dotClassName: "bg-[#D97706]",
          }
        : status === "REJECTED"
          ? {
              label: "Observado / Rechazado",
              className: "bg-[#FDF2F2] text-[#7A1C1C] border-[#D98282]",
              dotClassName: "bg-[#B91C1C]",
            }
          : {
              label: "Suspendido por moderación",
              className: "bg-[#FDF2F2] text-[#7A1C1C] border-[#D98282]",
              dotClassName: "bg-[#B91C1C]",
            };

    return (
      <div className="mt-2.5 space-y-1.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${badgeConfig.className}`}
        >
          <span className={`h-2 w-2 rounded-full ${badgeConfig.dotClassName}`} />
          {badgeConfig.label}
        </span>
        {status === "REJECTED" && rejectionReason ? (
          <p className="text-xs leading-snug text-[#7A1C1C]">
            Motivo: {rejectionReason}
          </p>
        ) : null}
      </div>
    );
  }

  function handleToggle() {
    if (isPending) return;
    setErrorMessage(null);
    const nextAvailable = !optimisticAvailable;

    startTransition(async () => {
      setOptimisticAvailable(nextAvailable);
      const result = await toggleProductAvailabilityAction({
        productId,
        available: nextAvailable,
      });

      if (!result.ok) {
        setErrorMessage(
          result.error ?? "No se pudo cambiar el estado del producto.",
        );
      }
    });
  }

  return (
    <div className="mt-3 space-y-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={optimisticAvailable}
        aria-label={`Disponible en Feria para ${productTitle}`}
        disabled={isPending}
        onClick={handleToggle}
        className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4B27] focus-visible:ring-offset-2 disabled:cursor-wait ${
          optimisticAvailable
            ? "border-[#0E4B27]/20 bg-[#E6F0EA]/70 hover:bg-[#E6F0EA]"
            : "border-[#E8E2D5] bg-[#F6F3EC] hover:bg-[#EDE8DD]"
        }`}
      >
        <div className="min-w-0">
          <span className="block text-xs font-bold text-[#1C2420] sm:text-sm">
            Disponible en Feria
          </span>
          <span
            className={`block text-[11px] font-semibold ${
              optimisticAvailable ? "text-[#0E4B27]" : "text-[#525E57]"
            }`}
          >
            {isPending
              ? "Guardando cambio..."
              : optimisticAvailable
                ? "Activo · Visible en catálogo"
                : "Pausado · Oculto al público"}
          </span>
        </div>

        {/* Interruptor visual amplio y táctil (56x32px) */}
        <span
          aria-hidden="true"
          className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors duration-200 ${
            optimisticAvailable ? "bg-[#0E4B27]" : "bg-[#B5AFA2]"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
              optimisticAvailable ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </span>
      </button>

      {errorMessage ? (
        <p role="alert" className="text-xs font-semibold text-[#7A1C1C]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
