"use client";

import { Building2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

export function MayorAuthorityBanner({
  authorityTitle,
  authorityName,
}: {
  authorityTitle: string;
  authorityName: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // En modo 'Vidriera Exclusiva' (/?emprendedor=...) se oculta la tarjeta del Intendente
  const hasEntrepreneurFilter =
    pathname === "/" && Boolean(searchParams.get("emprendedor")?.trim());

  if (hasEntrepreneurFilter) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-6 sm:px-8 sm:pb-7">
      <section
        aria-label={`Autoridad municipal — ${authorityTitle} ${authorityName}`}
        className="overflow-hidden rounded-[26px] border border-[#A6C4E0] bg-gradient-to-r from-[#D6E6F4] via-[#C5DCEF] to-[#D6E6F4] px-6 py-5 shadow-lg shadow-[#1F4478]/[0.07] sm:px-8 sm:py-6"
      >
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#B5D0EA]/75 p-1.5 ring-1 ring-[#92B7DC]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-san-roque.png"
                alt="Escudo Municipalidad de San Roque"
                width={370}
                height={583}
                className="municipal-shield-green h-full w-auto object-contain"
              />
            </div>

            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-sky-dark">
                {authorityTitle}
              </p>
              <p className="mt-0.5 text-lg font-extrabold tracking-tight text-brand-ink sm:text-xl">
                {authorityName}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-brand-sky/30 bg-white/65 px-4 py-1.5 text-xs font-semibold text-brand-ink">
            <Building2
              className="h-3.5 w-3.5 shrink-0 text-brand-sky-dark"
              aria-hidden="true"
            />
            <span>Municipalidad de San Roque · Corrientes</span>
          </div>
        </div>
      </section>
    </div>
  );
}
