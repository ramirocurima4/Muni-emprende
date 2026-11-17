import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { buildInstitutionalWhatsappUrl } from "@/lib/whatsapp";

const MUNICIPAL_WHATSAPP_DISPLAY = "3794 819378";
const MUNICIPAL_WHATSAPP_RAW = "3794819378";

/**
 * Sección institucional 'Sumate a Nosotros' inspirada en la gráfica oficial
 * de la Dirección de Producción y Dirección de Empleo y Emprendedores de San Roque.
 */
export function JoinUsSection() {
  const whatsappUrl = buildInstitutionalWhatsappUrl(
    MUNICIPAL_WHATSAPP_RAW,
    "Hola! Quiero ser parte de MuniEmprende San Roque y recibir información para sumar mi emprendimiento a la plataforma digital.",
  );

  return (
    <section
      aria-labelledby="join-us-heading"
      className="relative overflow-hidden rounded-[36px] bg-brand-green px-6 py-10 text-white shadow-2xl shadow-brand-green/20 sm:px-12 sm:py-14"
    >
      {/* Motivo geométrico decorativo inspirado en los flyers municipales */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 grid h-48 w-48 grid-cols-2 opacity-30 sm:h-64 sm:w-64"
      >
        <div className="rounded-tl-full bg-brand-green-dark" />
        <div className="rounded-tr-full bg-brand-amber-gold" />
        <div className="rounded-bl-full bg-brand-amber-gold/60" />
        <div className="rounded-br-full bg-brand-green-dark" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-brand-green-dark/45 blur-2xl"
      />

      <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-5 lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-green-dark/70 px-3.5 py-1.5 text-xs font-bold tracking-wide text-brand-amber-soft">
            <Sparkles className="h-3.5 w-3.5 text-brand-amber-gold" aria-hidden="true" />
            Sumate a Nosotros · San Roque Municipio
          </span>

          <h2
            id="join-us-heading"
            className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl"
          >
            ¿Querés ser parte de{" "}
            <span className="mt-1 inline-block rounded-xl bg-white px-3 py-0.5 text-brand-green-dark shadow-sm">
              MuniEmprende
            </span>
            ?
          </h2>

          <div className="space-y-3 text-sm leading-relaxed text-white/95 sm:text-base">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-amber text-brand-ink shadow-sm"
              >
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <p>
                Invitamos a productores y emprendedores a formar parte de
                nuestra plataforma digital. Te brindamos un espacio virtual y el
                acompañamiento de nuestro equipo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3.5 rounded-[28px] bg-brand-green-dark/45 p-5 backdrop-blur-xs sm:p-6 lg:col-span-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-amber-soft">
            Si te interesa participar o necesitás más información
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-center text-sm font-extrabold text-brand-green-dark shadow-xl shadow-black/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-amber-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-green sm:text-base"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green text-white transition-transform duration-200 group-hover:scale-105">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>Comunicate al {MUNICIPAL_WHATSAPP_DISPLAY}</span>
          </a>

          <Link
            href="/registro"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-brand-amber-soft transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber"
          >
            <span>¿Preferís inscribirte online? Creá tu perfil ahora</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
