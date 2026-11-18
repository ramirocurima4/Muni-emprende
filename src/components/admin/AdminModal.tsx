"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Ventana de diálogo accesible (Escape cierra, foco al abrir, fondo bloqueado).
 * Se monta solo cuando está abierta, así el estado interno de los hijos se reinicia.
 */
export function AdminModal({
  title,
  description,
  onClose,
  children,
  closeDisabled = false,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  closeDisabled?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !closeDisabled) onClose();
        }}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-brand-ink">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-brand-muted transition-colors hover:bg-brand-sky-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
