"use client";

import { Share2 } from "lucide-react";

const CANONICAL_SHARE_URL = "https://muniemprende.sanroque.gob.ar";

/**
 * Botón discreto para compartir MuniEmprende por WhatsApp en grupos locales de San Roque.
 */
export function ShareMuniEmprendeButton({
  className = "",
}: {
  className?: string;
}) {
  function buildShareHref(): string {
    const shareUrl =
      typeof window !== "undefined" &&
      window.location.origin &&
      !window.location.origin.includes("localhost")
        ? window.location.origin
        : CANONICAL_SHARE_URL;

    const text = `¡Sumate a recorrer MuniEmprende San Roque! Encontrá las próximas fechas de la Expo Emprendedores y el Mercado Sanroqueño, y contactá directo con productores y emprendedores locales: ${shareUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  return (
    <a
      href={buildShareHref()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#A8C6E3] bg-brand-surface px-3.5 py-1.5 text-xs font-bold text-brand-sky-dark shadow-xs transition-colors hover:border-brand-green/50 hover:bg-brand-green-soft hover:text-brand-green-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${className}`}
    >
      <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Compartir por WhatsApp</span>
    </a>
  );
}
