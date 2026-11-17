import Link from "next/link";
import { ArrowUpRight, Building2, MapPin, MessageCircle } from "lucide-react";
import { buildInstitutionalWhatsappUrl } from "@/lib/whatsapp";

const EMPLOYMENT_WHATSAPP_DISPLAY = "3794 819378";
const EMPLOYMENT_WHATSAPP_RAW = "3794819378";

const USEFUL_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Explorar Catálogo" },
  { href: "/login", label: "Acceso Emprendedores" },
  { href: "/registro", label: "Sumate a MuniEmprende" },
] as const;

/**
 * Footer institucional global de MuniEmprende.
 * Incluye la tarjeta del Intendente en celeste ultra pastel en su cabecera superior
 * y el cuerpo principal en verde oscuro institucional con escudo monocromático blanco.
 */
export function Footer() {
  const whatsappUrl = buildInstitutionalWhatsappUrl(
    EMPLOYMENT_WHATSAPP_RAW,
    "Hola! Me comunico con la Dirección de Empleo y Emprendedores de San Roque por MuniEmprende.",
  );

  return (
    <footer className="mt-10 sm:mt-14">
      {/* Tarjeta institucional del Intendente integrándose suavemente antes del bloque verde oscuro */}
      <div className="mx-auto max-w-6xl px-5 pb-8 sm:px-8 sm:pb-10">
        <section
          aria-label="Autoridad municipal — Intendente Cr. Raúl Pelozo"
          className="overflow-hidden rounded-[26px] border border-brand-sky/30 bg-brand-sky-tint px-6 py-5 shadow-md shadow-black/[0.03] sm:px-8 sm:py-6"
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-sky-light/70 p-1.5 ring-1 ring-brand-sky/35">
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
                  Intendente de San Roque
                </p>
                <p className="mt-0.5 text-lg font-extrabold tracking-tight text-brand-ink sm:text-xl">
                  Cr. Raúl Pelozo
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

      {/* Cuerpo principal en verde oscuro institucional */}
      <div className="bg-brand-green-dark text-white">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <div className="grid grid-cols-1 gap-9 md:grid-cols-12 md:gap-8">
            {/* Identidad municipal con escudo en blanco puro */}
            <div className="space-y-4 md:col-span-5">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-san-roque.png"
                  alt="San Roque Municipio"
                  width={370}
                  height={583}
                  className="h-16 w-auto shrink-0 object-contain brightness-0 invert sm:h-20"
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#CFE0C9]">
                    Municipalidad de San Roque
                  </p>
                  <p className="text-xl font-extrabold tracking-tight text-white">
                    MuniEmprende
                  </p>
                </div>
              </div>

              <p className="max-w-sm text-sm leading-relaxed text-[#D8E5D4]">
                Feria Digital oficial impulsada por la Dirección de Empleo y
                Emprendedores para visibilizar la producción local y conectar
                vecinos con emprendedores sanroqueños sin intermediarios.
              </p>
            </div>

            {/* Enlaces útiles */}
            <div className="md:col-span-3">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#CFE0C9]">
                Enlaces útiles
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
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
                Dirección de Empleo y Emprendedores
              </h2>
              <div className="mt-4 space-y-3 text-sm text-[#D8E5D4]">
                <p className="flex items-start gap-2.5">
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
                  className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-brand-amber-gold/60 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber-gold"
                >
                  <MessageCircle
                    className="h-4 w-4 shrink-0 text-brand-amber-gold"
                    aria-hidden="true"
                  />
                  <span>WhatsApp: {EMPLOYMENT_WHATSAPP_DISPLAY}</span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-white/75 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Aviso oficial y cierre */}
          <div className="mt-10 space-y-4 border-t border-white/15 pt-6">
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-xs leading-relaxed text-[#E3ECE0]">
              <strong className="font-bold text-white">Aviso oficial:</strong>{" "}
              La Municipalidad de San Roque brinda únicamente este espacio de
              difusión publicitaria y no interviene en precios, medios de pago,
              entregas ni garantías comerciales.
            </div>

            <div className="flex flex-col gap-2 text-xs text-[#C7D7C2] sm:flex-row sm:items-center sm:justify-between">
              <p>
                © 2026 Municipalidad de San Roque · Dirección de Empleo y
                Emprendedores
              </p>
              <p>Elaboración Sanroqueña · Portal Comunitario</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
