import {
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Newspaper,
  Sprout,
  Store,
} from "lucide-react";
import Link from "next/link";
import { formatWhatsappDisplay } from "@/lib/admin-labels";
import { getPublicFairAlbumsByType } from "@/lib/expos";
import { FAIR_META, type FairTypeKey } from "@/lib/fairs";
import { getPublicSystemConfig } from "@/lib/system-config";
import { buildInstitutionalWhatsappUrl } from "@/lib/whatsapp";
import { FairChronicleCard } from "./FairChronicleCard";

const FAIR_DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function formatFairDate(isoDate: string | null): string {
  if (!isoDate) return "Próxima fecha a confirmar";
  const label = FAIR_DATE_FORMATTER.format(new Date(`${isoDate}T00:00:00.000Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const PAGE_COPY: Record<
  FairTypeKey,
  {
    title: string;
    area: string;
    kicker: string;
    nextLabel: string;
    cta: string;
    emptyTitle: string;
  }
> = {
  EXPO_EMPRENDEDORES: {
    title: "Expo Emprendedores",
    area: "Dirección de Empleo",
    kicker: "Feria Municipal · Elaboración propia, gastronomía, artesanías e indumentaria",
    nextLabel: "Próxima fecha",
    cta: "Reservá tu stand por WhatsApp",
    emptyTitle: "Pronto compartiremos las crónicas de la Expo Emprendedores",
  },
  MERCADO_SANROQUENO: {
    title: "Mercado Sanroqueño",
    area: "Producción y Empleo",
    kicker: "Feria Municipal · Frutas, verduras, huevos caseros y producción de granja",
    nextLabel: "Próxima jornada",
    cta: "Sumate como productor por WhatsApp",
    emptyTitle: "Pronto compartiremos las crónicas del Mercado Sanroqueño",
  },
};

/**
 * Página dedicada de una feria municipal con estética de diario virtual:
 * cabecera verde institucional + feed de crónicas filtradas por feria.
 */
export async function FairPortalPage({ fairType }: { fairType: FairTypeKey }) {
  const [systemConfig, albums] = await Promise.all([
    getPublicSystemConfig(),
    getPublicFairAlbumsByType(fairType),
  ]);

  const fair = systemConfig.fairs[fairType];
  const copy = PAGE_COPY[fairType];
  const meta = FAIR_META[fairType];
  const isExpo = fairType === "EXPO_EMPRENDEDORES";

  const whatsappUrl = buildInstitutionalWhatsappUrl(
    fair.whatsappNumber,
    meta.whatsappMessage,
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-5 py-7 sm:space-y-10 sm:px-8 sm:py-12">
      {/* Cabecera verde institucional */}
      <header className="relative overflow-hidden rounded-[36px] bg-brand-green px-6 py-8 text-white shadow-2xl shadow-brand-green/20 sm:px-10 sm:py-11">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 grid h-48 w-48 grid-cols-2 opacity-20 sm:h-64 sm:w-64"
        >
          <div className="rounded-tl-full bg-brand-green-dark" />
          <div className="rounded-tr-full bg-brand-amber-gold" />
          <div className="rounded-bl-full bg-brand-amber-gold/60" />
          <div className="rounded-br-full bg-brand-green-dark" />
        </div>

        <div className="relative space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-green-dark/70 px-3.5 py-1.5 text-xs font-bold tracking-wide text-brand-amber-soft">
            {isExpo ? (
              <Store className="h-3.5 w-3.5 text-brand-amber-gold" aria-hidden="true" />
            ) : (
              <Sprout className="h-3.5 w-3.5 text-brand-amber-gold" aria-hidden="true" />
            )}
            Municipalidad de San Roque
          </span>

          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {copy.title}{" "}
              <span className="text-brand-amber-soft">· {copy.area}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
              {copy.kicker}
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-2.5 rounded-2xl bg-white/95 p-4 text-sm text-brand-ink shadow-sm sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" aria-hidden="true" />
              <div>
                <dt className="text-[11px] font-extrabold uppercase tracking-wide text-brand-muted">
                  {copy.nextLabel}
                </dt>
                <dd className="font-extrabold">{formatFairDate(fair.nextDate)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-sky-dark" aria-hidden="true" />
              <div>
                <dt className="text-[11px] font-extrabold uppercase tracking-wide text-brand-muted">
                  Horario
                </dt>
                <dd className="font-semibold">{fair.schedule}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber-text" aria-hidden="true" />
              <div>
                <dt className="text-[11px] font-extrabold uppercase tracking-wide text-brand-muted">
                  Lugar
                </dt>
                <dd className="font-semibold">{fair.location}</dd>
              </div>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-brand-green-dark shadow-xl shadow-black/15 transition-all hover:-translate-y-0.5 hover:bg-brand-amber-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber"
            >
              <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                {copy.cta} ({formatWhatsappDisplay(fair.whatsappNumber)})
              </span>
            </a>

            {fair.mapsUrl ? (
              <a
                href={fair.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-brand-green-dark/50 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber"
              >
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Cómo llegar (Google Maps)</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </header>

      {/* Feed tipo diario digital */}
      <section aria-labelledby="fair-feed-heading" className="space-y-6">
        <div className="flex items-center gap-2.5 border-b-2 border-brand-green/30 pb-2.5">
          <Newspaper className="h-5 w-5 text-brand-green" aria-hidden="true" />
          <h2
            id="fair-feed-heading"
            className="text-lg font-extrabold uppercase tracking-wide text-brand-ink"
          >
            Crónicas de {copy.title}
          </h2>
        </div>

        {albums.length === 0 ? (
          <div className="rounded-3xl border border-[#B8D2EA] bg-brand-surface px-6 py-12 text-center shadow-sm">
            <p className="text-base font-extrabold text-brand-ink">
              {copy.emptyTitle}
            </p>
            <p className="mt-1.5 text-sm text-brand-muted">
              Mientras tanto, conocé a los emprendimientos sanroqueños en el
              catálogo.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-2xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-green-hover"
            >
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {albums.map((album) => (
              <FairChronicleCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function FairPortalSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto w-full max-w-4xl space-y-8 px-5 py-7 sm:px-8 sm:py-12"
    >
      <div className="h-72 animate-pulse rounded-[36px] bg-brand-green/25" />
      <div className="h-96 animate-pulse rounded-[28px] bg-white/70" />
    </div>
  );
}
