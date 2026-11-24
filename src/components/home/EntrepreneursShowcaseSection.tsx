"use client";

import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicEntrepreneurShowcaseItem } from "@/lib/catalog";
import { getUploadImageUrl } from "@/lib/images";
import { ShareMuniEmprendeButton } from "./ShareMuniEmprendeButton";

interface EntrepreneursShowcaseSectionProps {
  entrepreneurs: PublicEntrepreneurShowcaseItem[];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "SR";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/**
 * Carrusel horizontal compacto 'Emprendedores en San Roque' para la parte superior de la portada.
 * Deslizamiento táctil suave en mobile (sin scrollbar visible) y controles ChevronLeft/ChevronRight en desktop.
 */
export function EntrepreneursShowcaseSection({
  entrepreneurs,
}: EntrepreneursShowcaseSectionProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScrollLeft - el.scrollLeft > 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateScrollButtons();

    const handleScroll = () => updateScrollButtons();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateScrollButtons);
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollButtons);
      resizeObserver?.disconnect();
    };
  }, [entrepreneurs.length, updateScrollButtons]);

  const scrollTrack = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(260, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <section
      id="emprendedores"
      aria-labelledby="entrepreneurs-showcase-heading"
      className="rounded-[28px] border border-[#A8C6E3] bg-[#D6E6F4] p-4 shadow-md shadow-[#1F4478]/[0.05] sm:px-6 sm:py-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C5DCEF] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-sky-dark">
            <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Comunidad Local
          </span>
          <h2
            id="entrepreneurs-showcase-heading"
            className="text-lg font-extrabold tracking-tight text-brand-ink sm:text-xl"
          >
            Emprendedores en San Roque
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <ShareMuniEmprendeButton />

          {entrepreneurs.length > 0 ? (
            <div
              className="hidden items-center gap-1.5 md:flex"
              aria-label="Controles del carrusel de emprendedores"
            >
              <button
                type="button"
                onClick={() => scrollTrack(-1)}
                disabled={!canScrollLeft}
                aria-label="Desplazar emprendedores hacia la izquierda"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#A8C6E3] bg-brand-surface text-brand-ink shadow-2xs transition-colors hover:border-brand-green hover:bg-brand-green hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#A8C6E3] disabled:hover:bg-brand-surface disabled:hover:text-brand-ink"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollTrack(1)}
                disabled={!canScrollRight}
                aria-label="Desplazar emprendedores hacia la derecha"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#A8C6E3] bg-brand-surface text-brand-ink shadow-2xs transition-colors hover:border-brand-green hover:bg-brand-green hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#A8C6E3] disabled:hover:bg-brand-surface disabled:hover:text-brand-ink"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {entrepreneurs.length === 0 ? (
        <div className="mt-3.5 rounded-2xl border border-[#B8D2EA] bg-brand-surface px-4 py-4 text-center">
          <p className="text-xs font-semibold text-brand-muted sm:text-sm">
            Pronto verás aquí a los emprendimientos sanroqueños activos.
          </p>
        </div>
      ) : (
        <ul
          ref={trackRef}
          className="no-scrollbar -mx-4 mt-3.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth px-4 py-1 sm:-mx-1 sm:gap-3 sm:px-1"
        >
          {entrepreneurs.map((item) => {
            const avatarUrl = item.avatarPath
              ? getUploadImageUrl(item.avatarPath, "thumb")
              : null;
            const href = `/catalogo?emprendedor=${encodeURIComponent(item.id)}`;

            return (
              <li
                key={item.id}
                className="w-[112px] shrink-0 snap-start sm:w-[124px]"
              >
                <Link
                  href={href}
                  title={item.businessName}
                  aria-label={`Ver productos de ${item.businessName} en el catálogo`}
                  className="group flex h-full flex-col items-center rounded-2xl border border-[#B8D2EA] bg-brand-surface px-2.5 py-3 text-center shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-green/55 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#C5DCEF] bg-gradient-to-br from-[#DCE9F9] via-[#EDF4FC] to-brand-green-soft shadow-2xs transition-colors group-hover:border-brand-green/60 sm:h-16 sm:w-16">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={item.businessName}
                        width={96}
                        height={96}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-black tracking-tight text-brand-green-dark sm:text-base">
                        {getInitials(item.businessName)}
                      </span>
                    )}
                  </div>

                  <span className="mt-2 line-clamp-2 text-xs font-extrabold leading-tight text-brand-ink transition-colors group-hover:text-brand-green">
                    {item.businessName}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
