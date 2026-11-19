import { ArrowRight, Sprout, Store } from "lucide-react";
import Link from "next/link";

/**
 * Tarjeta institucional limpia con accesos directos a las páginas de las ferias municipales.
 */
export function FairsInviteCard() {
  return (
    <section
      aria-labelledby="fairs-invite-heading"
      className="relative overflow-hidden rounded-[32px] bg-brand-green px-6 py-8 text-white shadow-xl shadow-brand-green/20 sm:px-10 sm:py-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 grid h-40 w-40 grid-cols-2 opacity-20"
      >
        <div className="rounded-tl-full bg-brand-green-dark" />
        <div className="rounded-tr-full bg-brand-amber-gold" />
        <div className="rounded-bl-full bg-brand-amber-gold/60" />
        <div className="rounded-br-full bg-brand-green-dark" />
      </div>

      <div className="relative space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-amber-soft">
            Ferias de la Municipalidad de San Roque
          </p>
          <h2
            id="fairs-invite-heading"
            className="mt-1.5 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl"
          >
            Conocé nuestras ferias municipales
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
            Próximas fechas, crónicas con fotos y videos de cada edición, e
            inscripción para emprendedores y productores locales.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/expo-emprendedores"
            className="group inline-flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-brand-green-dark shadow-lg shadow-black/15 transition-all hover:-translate-y-0.5 hover:bg-brand-amber-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber"
          >
            <span className="inline-flex items-center gap-2.5">
              <Store className="h-5 w-5 shrink-0" aria-hidden="true" />
              Expo Emprendedores
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>

          <Link
            href="/mercado-sanroqueno"
            className="group inline-flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-brand-green-dark shadow-lg shadow-black/15 transition-all hover:-translate-y-0.5 hover:bg-brand-amber-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber"
          >
            <span className="inline-flex items-center gap-2.5">
              <Sprout className="h-5 w-5 shrink-0" aria-hidden="true" />
              Mercado Sanroqueño
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
