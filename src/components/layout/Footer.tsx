import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, MapPin, MessageCircle } from "lucide-react";
import { formatWhatsappDisplay } from "@/lib/admin-labels";
import { getPublicSystemConfig } from "@/lib/system-config";
import { buildInstitutionalWhatsappUrl } from "@/lib/whatsapp";
import { MayorAuthorityBanner } from "./MayorAuthorityBanner";

const USEFUL_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Explorar Catálogo" },
  { href: "/login", label: "Acceso Emprendedores" },
  { href: "/registro", label: "Sumate a MuniEmprende" },
] as const;

/**
 * Footer institucional global de MuniEmprende.
 * Se alimenta dinámicamente desde SystemConfig (/admin/configuracion):
 * - Autoridad municipal (por defecto Cr. Raúl Pelozo - Intendente de San Roque)
 * - WhatsApp oficial de consultas de la Dirección de Empleo
 * - Mensaje de aviso oficial / descargo legal
 */
export async function Footer() {
  const config = await getPublicSystemConfig();

  const whatsappDisplay = formatWhatsappDisplay(config.employmentWhatsapp);
  const whatsappUrl = buildInstitutionalWhatsappUrl(
    config.employmentWhatsapp,
    "Hola! Me comunico con la Dirección de Empleo de San Roque por MuniEmprende.",
  );

  return (
    <footer className="mt-8 sm:mt-10">
      {/* Tarjeta institucional de Autoridad Municipal (se oculta automáticamente en /?emprendedor=...) */}
      <Suspense fallback={null}>
        <MayorAuthorityBanner
          authorityTitle={config.authorityTitle}
          authorityName={config.authorityName}
        />
      </Suspense>

      {/* Cuerpo principal en verde oscuro institucional (compacto y equilibrado) */}
      <div className="bg-brand-green-dark text-white">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
            {/* Identidad municipal con escudo en blanco puro */}
            <div className="space-y-3 md:col-span-5">
              <div className="flex items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-san-roque.png"
                  alt="San Roque Municipio"
                  width={370}
                  height={583}
                  className="h-14 w-auto shrink-0 object-contain brightness-0 invert sm:h-16"
                />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#CFE0C9]">
                    Municipalidad de San Roque
                  </p>
                  <p className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
                    MuniEmprende
                  </p>
                </div>
              </div>

              <p className="max-w-sm text-xs leading-relaxed text-[#D8E5D4] sm:text-sm">
                Portal oficial gestionado para la{" "}
                <strong className="font-semibold text-white">
                  Dirección de Empleo · Municipalidad de San Roque
                </strong>
                , para visibilizar las ferias y el trabajo local sin
                intermediarios.
              </p>
            </div>

            {/* Enlaces útiles */}
            <div className="md:col-span-3">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#CFE0C9]">
                Enlaces útiles
              </h2>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm">
                {USEFUL_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 font-medium text-white/90 transition-colors hover:text-brand-amber-soft focus:outline-none focus-visible:underline"
                    >
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contacto de la Dirección de Empleo */}
            <div className="md:col-span-4">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#CFE0C9]">
                Dirección de Empleo
              </h2>
              <div className="mt-3 space-y-2.5 text-xs text-[#D8E5D4] sm:text-sm">
                <p className="flex items-start gap-2">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber-gold"
                    aria-hidden="true"
                  />
                  <span>San Roque, Provincia de Corrientes</span>
                </p>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:border-brand-amber-gold/60 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber-gold sm:text-sm"
                >
                  <MessageCircle
                    className="h-4 w-4 shrink-0 text-brand-amber-gold"
                    aria-hidden="true"
                  />
                  <span>WhatsApp: {whatsappDisplay}</span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-white/75 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Aviso oficial y barra de créditos */}
          <div className="mt-6 space-y-3 border-t border-white/15 pt-4">
            <div className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[11px] leading-relaxed text-[#E3ECE0] sm:text-xs">
              <strong className="font-bold text-white">Aviso oficial:</strong>{" "}
              {config.legalDisclaimer}
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-[#C7D7C2] sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Dirección de Empleo · Municipalidad de San Roque</p>
              <p className="font-semibold text-white">
                Desarrollado por la{" "}
                <span className="text-brand-amber-soft">
                  Dirección de Modernización
                </span>{" "}
                · Municipalidad de San Roque
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
