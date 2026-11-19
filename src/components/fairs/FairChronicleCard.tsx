"use client";

import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Film,
  MapPin,
  Play,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicFairAlbum, PublicFairMediaItem } from "@/lib/expos";
import { getUploadImageUrl, getUploadVideoUrl } from "@/lib/images";

const EVENT_DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatEventDate(isoDate: string): string {
  const label = EVENT_DATE_FORMATTER.format(
    new Date(`${isoDate}T00:00:00.000Z`),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const PRESS_CREDIT = "Publicado por: Dirección de Comunicación y Redes";

/**
 * Crónica estilo nota de diario digital: medio principal destacado, título grande,
 * fecha y lugar, descripción, galería de miniaturas (abre visor) y epígrafe de prensa.
 */
export function FairChronicleCard({ album }: { album: PublicFairAlbum }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const media = album.media;
  const hero = media.find((m) => m.mediaType === "IMAGE") ?? media[0];
  const heroIndex = hero ? media.indexOf(hero) : 0;
  const extras = media
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => index !== heroIndex);

  return (
    <article className="overflow-hidden rounded-[28px] border border-[#B8D2EA] bg-brand-surface shadow-lg shadow-[#1F4478]/[0.06]">
      {hero ? (
        hero.mediaType === "VIDEO" ? (
          <video
            src={getUploadVideoUrl(hero.relativePath)}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLightboxIndex(heroIndex)}
            aria-label={`Ampliar foto principal de ${album.title}`}
            className="block aspect-[16/10] w-full overflow-hidden bg-[#C5DCEF] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getUploadImageUrl(hero.relativePath, "full")}
              alt={album.title}
              width={hero.width ?? 1200}
              height={hero.height ?? 750}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
          </button>
        )
      ) : null}

      <div className="space-y-3 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-extrabold uppercase tracking-wide">
          <span className="inline-flex items-center gap-1.5 text-brand-green">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {formatEventDate(album.eventDate)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-brand-sky-dark">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {album.location}
          </span>
        </div>

        <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-brand-ink sm:text-3xl">
          {album.title}
        </h2>

        {album.description ? (
          <p className="text-sm leading-relaxed text-brand-muted sm:text-base">
            {album.description}
          </p>
        ) : null}

        {extras.length > 0 ? (
          <div className="pt-1">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-brand-muted">
              Más imágenes de la jornada ({extras.length})
            </p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {extras.map(({ item, index }) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`Ver ${item.mediaType === "VIDEO" ? "video" : "foto"} ${index + 1} de ${album.title}`}
                    className="relative block aspect-square w-full overflow-hidden rounded-xl bg-[#C5DCEF] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                  >
                    {item.mediaType === "VIDEO" ? (
                      <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-brand-ink text-white">
                        <Play className="h-6 w-6" aria-hidden="true" />
                        <span className="text-[10px] font-bold">Video</span>
                      </span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getUploadImageUrl(item.relativePath, "thumb")}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="flex items-center gap-1.5 border-t border-[#E2ECF5] pt-3 text-[11px] font-medium italic text-brand-muted">
          <Camera className="h-3.5 w-3.5 shrink-0 text-brand-sky-dark" aria-hidden="true" />
          <span>{PRESS_CREDIT}</span>
        </p>
      </div>

      {lightboxIndex !== null ? (
        <Lightbox
          album={album}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </article>
  );
}

function Lightbox({
  album,
  initialIndex,
  onClose,
}: {
  album: PublicFairAlbum;
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const media: PublicFairMediaItem[] = album.media;
  const active = media[index] ?? media[0];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setIndex((prev) => (prev - 1 + media.length) % media.length);
      if (e.key === "ArrowRight") setIndex((prev) => (prev + 1) % media.length);
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [media.length, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de ${album.title}`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] bg-brand-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-brand-border px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="truncate text-base font-extrabold text-brand-ink">
              {album.title}
            </h3>
            <p className="text-xs text-brand-muted">
              {index + 1} / {media.length} · {formatEventDate(album.eventDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar galería"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-sky-tint text-brand-ink hover:bg-brand-sky-light"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center bg-black p-2">
          {active ? (
            active.mediaType === "VIDEO" ? (
              <video
                key={active.id}
                src={getUploadVideoUrl(active.relativePath)}
                controls
                playsInline
                autoPlay
                className="max-h-[72dvh] w-full rounded-xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getUploadImageUrl(active.relativePath, "full")}
                alt={album.title}
                className="max-h-[72dvh] w-auto rounded-xl object-contain"
              />
            )
          ) : null}

          {media.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() =>
                  setIndex((prev) => (prev - 1 + media.length) % media.length)
                }
                aria-label="Anterior"
                className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow-md hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((prev) => (prev + 1) % media.length)}
                aria-label="Siguiente"
                className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow-md hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>

        <p className="flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-medium italic text-brand-muted">
          <Film className="hidden" aria-hidden="true" />
          <Camera className="h-3.5 w-3.5 shrink-0 text-brand-sky-dark" aria-hidden="true" />
          <span>{PRESS_CREDIT}</span>
        </p>
      </div>
    </div>
  );
}
