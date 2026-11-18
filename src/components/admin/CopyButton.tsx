"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { BTN_SECONDARY } from "./ui";

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={BTN_SECONDARY}>
      {copied ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{copied ? "¡Copiado!" : label}</span>
    </button>
  );
}

/**
 * Muestra una contraseña temporal generada por el sistema (se ve una sola vez).
 */
export function TemporaryPasswordBox({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-brand-amber/50 bg-brand-amber-soft p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="font-bold text-brand-amber-text">Usuario</dt>
            <dd className="font-mono text-base font-extrabold text-brand-ink">{username}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="font-bold text-brand-amber-text">Contraseña temporal</dt>
            <dd className="select-all font-mono text-xl font-extrabold tracking-wider text-brand-ink">
              {password}
            </dd>
          </div>
        </dl>
      </div>
      <p className="text-xs leading-relaxed text-brand-muted">
        Copiala y entregala en mano o por un canal seguro. <strong>Esta clave no
        se vuelve a mostrar</strong>: si se pierde, se puede blanquear de nuevo.
      </p>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={password} label="Copiar contraseña" />
        <CopyButton
          text={`Usuario: ${username}\nContraseña: ${password}`}
          label="Copiar usuario y contraseña"
        />
      </div>
    </div>
  );
}
