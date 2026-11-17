"use client";

import { useState, useTransition } from "react";
import {
  approveEntrepreneurAction,
  approveProductAction,
  rejectEntrepreneurAction,
  rejectProductAction,
} from "@/app/actions/moderation";
import { rejectEntitySchema } from "@/lib/validations/moderation";

interface ModerationRowActionsProps {
  entityId: string;
  entityType: "ENTREPRENEUR" | "PRODUCT";
  entityLabel: string;
}

export function ModerationRowActions({
  entityId,
  entityType,
  entityLabel,
}: ModerationRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleApprove() {
    setErrorMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", entityId);

      const result =
        entityType === "ENTREPRENEUR"
          ? await approveEntrepreneurAction(formData)
          : await approveProductAction(formData);

      if (!result.ok) {
        setErrorMessage(result.error ?? "No se pudo aprobar el registro.");
      }
    });
  }

  function handleRejectSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = rejectEntitySchema.safeParse({
      id: entityId,
      rejectionReason,
    });

    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ??
          "Ingresá el motivo del rechazo (mínimo 5 caracteres).",
      );
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", parsed.data.id);
      formData.set("rejectionReason", parsed.data.rejectionReason);

      const result =
        entityType === "ENTREPRENEUR"
          ? await rejectEntrepreneurAction(formData)
          : await rejectProductAction(formData);

      if (!result.ok) {
        setErrorMessage(result.error ?? "No se pudo rechazar el registro.");
      } else {
        setIsRejecting(false);
        setRejectionReason("");
      }
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleApprove}
          aria-label={`Aprobar ${entityLabel}`}
          className="inline-flex items-center justify-center rounded-xl bg-[#3F5E47] px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-[#324C39] active:bg-[#273B2C] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3F5E47] focus-visible:ring-offset-2"
        >
          {isPending && !isRejecting ? "Aprobando..." : "✓ Aprobar"}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setIsRejecting((prev) => !prev);
            setErrorMessage(null);
          }}
          aria-expanded={isRejecting}
          aria-label={`Rechazar ${entityLabel}`}
          className="inline-flex items-center justify-center rounded-xl border border-[#D98282] bg-[#FDF2F2] px-3.5 py-2 text-xs font-bold text-[#7A1C1C] transition-colors hover:bg-[#F9E1E1] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C1C] focus-visible:ring-offset-2"
        >
          {isRejecting ? "Cancelar" : "✕ Rechazar"}
        </button>
      </div>

      {isRejecting ? (
        <form
          onSubmit={handleRejectSubmit}
          className="mt-1 w-full max-w-md space-y-2 rounded-2xl border border-[#D98282] bg-[#FDF2F2]/75 p-3"
        >
          <label
            htmlFor={`reason-${entityId}`}
            className="block text-[11px] font-bold uppercase tracking-wide text-[#7A1C1C]"
          >
            Motivo del rechazo (visible para el emprendedor) *
          </label>
          <textarea
            id={`reason-${entityId}`}
            rows={2}
            required
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Ej. Por favor verificá el número de WhatsApp o completá los datos del rubro..."
            className="w-full rounded-xl border border-[#D98282] bg-[#FDFCFA] px-3 py-2 text-xs text-[#2C302E] placeholder:text-[#5A615D]/80 focus:border-[#7A1C1C] focus:outline-none focus:ring-2 focus:ring-[#7A1C1C]/20"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#8F2424] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#701B1B] disabled:opacity-60"
            >
              {isPending ? "Guardando..." : "Confirmar rechazo"}
            </button>
          </div>
        </form>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="text-xs font-semibold text-[#8F2424]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
