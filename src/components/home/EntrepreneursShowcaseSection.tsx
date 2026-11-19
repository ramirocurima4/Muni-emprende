import { MapPin, MessageCircle, Store } from "lucide-react";
import Link from "next/link";
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
 * Vitrina compacta 'Emprendedores Sanroqueños' con logos/nombres de los emprendimientos activos
 * y botón discreto para compartir MuniEmprende en grupos locales de WhatsApp.
 */
export function EntrepreneursShowcaseSection({
  entrepreneurs,
}: EntrepreneursShowcaseSectionProps) {
  return (
    <section
      id="emprendedores"
      aria-labelledby="entrepreneurs-showcase-heading"
      className="rounded-[32px] border border-[#A8C6E3] bg-[#D6E6F4] p-5 shadow-lg shadow-[#1F4478]/[0.05] sm:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C5DCEF] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-brand-sky-dark">
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            Comunidad Local
          </span>
          <h2
            id="entrepreneurs-showcase-heading"
            className="mt-2 text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl"
          >
            Emprendedores Sanroqueños
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-brand-muted sm:text-sm">
            Conocé los talleres, cocinas y emprendimientos habilitados en la
            ciudad.
          </p>
        </div>

        <ShareMuniEmprendeButton className="self-start sm:self-auto" />
      </div>

      {entrepreneurs.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-[#B8D2EA] bg-brand-surface px-5 py-6 text-center">
          <p className="text-xs font-semibold text-brand-muted sm:text-sm">
            Pronto verás aquí a los emprendimientos sanroqueños verificados.
          </p>
        </div>
      ) : (
        <ul className="no-scrollbar -mx-5 mt-5 flex gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3.5 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-4">
          {entrepreneurs.map((item) => {
            const avatarUrl = item.avatarPath
              ? getUploadImageUrl(item.avatarPath, "thumb")
              : null;
            const hasProducts = item.productCount > 0;
            const href = `/?emprendedor=${encodeURIComponent(item.slug)}`;

            const content = (
              <>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#B8D2EA] bg-[#EDF4FC]">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={item.businessName}
                      width={96}
                      height={96}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-black tracking-tight text-brand-green-dark">
                      {getInitials(item.businessName)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-brand-ink group-hover:text-brand-green">
                    {item.businessName}
                  </p>
                  {item.neighborhood ? (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-brand-muted">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.neighborhood}</span>
                    </p>
                  ) : null}
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-brand-green">
                    {hasProducts ? (
                      <span>
                        Ver vidriera ({item.productCount}{" "}
                        {item.productCount === 1 ? "producto" : "productos"}) →
                      </span>
                    ) : (
                      <>
                        <MessageCircle className="h-3 w-3" aria-hidden="true" />
                        <span>Ver vidriera →</span>
                      </>
                    )}
                  </p>
                </div>
              </>
            );

            return (
              <li
                key={item.id}
                className="w-[74%] min-w-[230px] shrink-0 sm:w-auto sm:min-w-0"
              >
                <Link
                  href={href}
                  className="group flex h-full items-center gap-3 rounded-2xl border border-[#B8D2EA] bg-brand-surface p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-green/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                >
                  {content}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
