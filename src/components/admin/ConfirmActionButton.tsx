"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { AdminModal } from "./AdminModal";
import { ADMIN_INPUT_CLASS, ADMIN_LABEL_CLASS } from "./ui";

interface ConfirmActionButtonProps {
  /** Contenido del botón que abre la confirmación. */
  trigger: ReactNode;
  triggerClassName: string;
  triggerLabel?: string;
  title: string;
  description?: string;
  confirmLabel: string;
  confirmClassName: string;
  /** Si se define, se pide un motivo escrito (visible para el emprendedor / registrado en actividad). */
  reason?: { label: string; placeholder: string; minLength: number };
  onConfirm: (reason: string) => Promise<{ ok: boolean; error?: string }>;
  disabled?: boolean;
}

/**
 * Botón que abre una ventana de confirmación antes de ejecutar una acción sensible.
 * Maneja carga, errores y cierre automático al terminar bien.
 */
export function ConfirmActionButton({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  description,
  confirmLabel,
  confirmClassName,
  reason,
  onConfirm,
  disabled = false,
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setOpen(false);
    setError(null);
    setReasonText("");
  }

  function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (reason && reasonText.trim().length < reason.minLength) {
      setError(`Escribí un motivo breve (mínimo ${reason.minLength} letras).`);
      return;
    }

    startTransition(async () => {
      const result = await onConfirm(reasonText.trim());
      if (!result.ok) {
        setError(result.error ?? "No se pudo completar la acción.");
        return;
      }
      setOpen(false);
      setReasonText("");
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={triggerLabel}
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {open ? (
        <AdminModal
          title={title}
          description={description}
          onClose={close}
          closeDisabled={isPending}
        >
          <form onSubmit={handleConfirm} className="space-y-4">
            {reason ? (
              <div>
                <label htmlFor="confirm-reason" className={ADMIN_LABEL_CLASS}>
                  {reason.label}
                </label>
                <textarea
                  id="confirm-reason"
                  rows={3}
                  autoFocus
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder={reason.placeholder}
                  className={ADMIN_INPUT_CLASS}
                />
              </div>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-[#D98282] bg-[#FDF2F2] px-3.5 py-2.5 text-sm font-semibold text-[#7A1C1C]"
              >
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={close}
                disabled={isPending}
                className="inline-flex min-h-[40px] items-center rounded-xl border border-brand-border bg-white px-4 py-2 text-sm font-bold text-brand-muted hover:bg-brand-cream disabled:opacity-60"
              >
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className={confirmClassName}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Un momento...</span>
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </>
  );
}
