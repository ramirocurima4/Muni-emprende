"use client";

import { Check, Loader2, Pause, RotateCcw, Send } from "lucide-react";
import { useState, useTransition } from "react";
import {
  approveEntrepreneurAction,
  approveProductAction,
  reactivateProductAction,
  rejectEntrepreneurAction,
  rejectProductAction,
  suspendProductAction,
} from "@/app/actions/moderation";
import { rejectEntitySchema } from "@/lib/validations/moderation";
import {
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  BTN_AMBER,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "./ui";

export type ModerationActionKey = "approve" | "correct" | "pause" | "reactivate";

interface ModerationActionsProps {
  entityId: string;
  kind: "product" | "entrepreneur";
  /** Nombre del elemento (para lectores de pantalla). */
  label: string;
  actions: ModerationActionKey[];
}

const QUICK_REASONS: Record<string, string[]> = {
  "product:correct": [
    "La foto no se ve bien: subí otra más clara.",
    "Falta contar mejor qué es el producto.",
    "El rubro elegido no corresponde.",
    "Sacá los precios: en el portal no se muestran.",
  ],
  "product:pause": [
    "Pausado por revisión de la Muni.",
    "El producto no cumple con las pautas de la feria.",
  ],
  "entrepreneur:correct": [
    "Revisá que el número de WhatsApp sea correcto.",
    "Completá el barrio o zona.",
    "Contanos mejor qué hace tu emprendimiento.",
  ],
};

export function ModerationActions({
  entityId,
  kind,
  label,
  actions,
}: ModerationActionsProps) {
  const [panel, setPanel] = useState<"correct" | "pause" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(
    action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>,
    extra?: Record<string, string>,
  ) {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", entityId);
      for (const [key, value] of Object.entries(extra ?? {})) {
        formData.set(key, value);
      }
      const result = await action(formData);
      if (!result.ok) {
        setError(result.error ?? "No se pudo completar la acción.");
        return;
      }
      setPanel(null);
      setReason("");
    });
  }

  function handleApprove() {
    run(kind === "product" ? approveProductAction : approveEntrepreneurAction);
  }

  function handleReactivate() {
    run(reactivateProductAction);
  }

  function handleReasonSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = rejectEntitySchema.safeParse({ id: entityId, rejectionReason: reason });
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Escribí una observación breve (mínimo 5 letras).",
      );
      return;
    }

    const action =
      panel === "pause"
        ? suspendProductAction
        : kind === "product"
          ? rejectProductAction
          : rejectEntrepreneurAction;

    run(action, { rejectionReason: parsed.data.rejectionReason });
  }

  const quick = panel ? (QUICK_REASONS[`${kind}:${panel}`] ?? []) : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {actions.includes("approve") ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleApprove}
            aria-label={`Aprobar ${label}`}
            className={BTN_PRIMARY}
          >
            {isPending && panel === null ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{kind === "product" ? "Aprobar y publicar" : "Habilitar emprendimiento"}</span>
          </button>
        ) : null}

        {actions.includes("reactivate") ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleReactivate}
            aria-label={`Reactivar ${label}`}
            className={BTN_PRIMARY}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reactivar y publicar</span>
          </button>
        ) : null}

        {actions.includes("correct") ? (
          <button
            type="button"
            disabled={isPending}
            aria-expanded={panel === "correct"}
            onClick={() => {
              setPanel(panel === "correct" ? null : "correct");
              setError(null);
            }}
            className={BTN_AMBER}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>Pedir corrección</span>
          </button>
        ) : null}

        {actions.includes("pause") ? (
          <button
            type="button"
            disabled={isPending}
            aria-expanded={panel === "pause"}
            onClick={() => {
              setPanel(panel === "pause" ? null : "pause");
              setError(null);
            }}
            className={BTN_SECONDARY}
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
            <span>Pausar</span>
          </button>
        ) : null}
      </div>

      {panel ? (
        <form
          onSubmit={handleReasonSubmit}
          className="space-y-2.5 rounded-2xl border border-brand-amber/50 bg-brand-amber-soft/60 p-4"
        >
          <label htmlFor={`reason-${entityId}`} className={ADMIN_LABEL_CLASS}>
            {panel === "pause"
              ? "¿Por qué lo pausás? (lo ve el emprendedor)"
              : "¿Qué tiene que corregir? (lo ve el emprendedor)"}
          </label>

          {quick.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {quick.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => setReason(text)}
                  className="rounded-full border border-brand-amber/50 bg-white px-3 py-1 text-xs font-semibold text-brand-amber-text transition-colors hover:bg-brand-amber-soft"
                >
                  {text}
                </button>
              ))}
            </div>
          ) : null}

          <textarea
            id={`reason-${entityId}`}
            rows={2}
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Escribí una observación breve y clara..."
            className={ADMIN_INPUT_CLASS}
          />
          <div className="flex justify-end">
            <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              <span>{panel === "pause" ? "Confirmar pausa" : "Enviar corrección"}</span>
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-bold text-[#8F2424]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
