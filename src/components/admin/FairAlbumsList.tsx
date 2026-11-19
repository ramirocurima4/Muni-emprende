"use client";

import { CalendarDays, Film, Images, MapPin } from "lucide-react";
import { useState } from "react";
import { FAIR_META, type FairTypeKey } from "@/lib/fairs";
import { getUploadImageUrl, getUploadVideoUrl } from "@/lib/images";
import { ExpoPhotoActions } from "./ExpoPhotoActions";
import { EmptyState, StatusBadge } from "./ui";

export interface AdminFairAlbumRow {
  id: string;
  fairType: FairTypeKey;
  title: string;
  eventDateIso: string;
  eventDateFormatted: string;
  location: string;
  description: string | null;
  isPublished: boolean;
  uploadedByUsername: string | null;
  media: Array<{
    id: string;
    mediaType: "IMAGE" | "VIDEO";
    relativePath: string;
    width: number | null;
    height: number | null;
  }>;
}

export function FairAlbumsList({ albums }: { albums: AdminFairAlbumRow[] }) {
  const [filter, setFilter] = useState<"ALL" | FairTypeKey>("ALL");

  const filtered =
    filter === "ALL" ? albums : albums.filter((a) => a.fairType === filter);

  const expoCount = albums.filter(
    (a) => a.fairType === "EXPO_EMPRENDEDORES",
  ).length;
  const mercadoCount = albums.filter(
    (a) => a.fairType === "MERCADO_SANROQUENO",
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "ALL", label: `Todas (${albums.length})` },
            {
              key: "EXPO_EMPRENDEDORES",
              label: `Expo Emprendedores (${expoCount})`,
            },
            {
              key: "MERCADO_SANROQUENO",
              label: `Mercado Sanroqueño (${mercadoCount})`,
            },
          ] as const
        ).map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
                active
                  ? "bg-brand-green text-white shadow-xs"
                  : "border border-brand-sky/40 bg-brand-sky-tint/70 text-brand-sky-dark hover:bg-brand-sky-light"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Todavía no hay crónicas cargadas en esta sección"
          description="Cuando publiques fotos o un video desde el formulario, aparecerán acá y en la portada pública."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((album) => {
            const images = album.media.filter((m) => m.mediaType === "IMAGE");
            const video = album.media.find((m) => m.mediaType === "VIDEO");
            const cover = images[0];
            const isExpo = album.fairType === "EXPO_EMPRENDEDORES";

            return (
              <li
                key={album.id}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-brand-sky/35 bg-brand-cream/60"
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden bg-brand-sky-tint">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getUploadImageUrl(cover.relativePath, "thumb")}
                        alt={album.title}
                        width={cover.width ?? 800}
                        height={cover.height ?? 600}
                        className="h-full w-full object-cover"
                      />
                    ) : video ? (
                      <video
                        src={getUploadVideoUrl(video.relativePath)}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full bg-black object-cover"
                      />
                    ) : null}

                    <div className="pointer-events-none absolute top-2.5 left-2.5">
                      <StatusBadge
                        label={FAIR_META[album.fairType].label}
                        tone={isExpo ? "amber" : "green"}
                      />
                    </div>

                    <div className="pointer-events-none absolute top-2.5 right-2.5">
                      <StatusBadge
                        label={album.isPublished ? "Visible" : "Oculta"}
                        tone={album.isPublished ? "green" : "neutral"}
                      />
                    </div>

                    <div className="pointer-events-none absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                      {images.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-0.5 text-[11px] font-bold text-white">
                          <Images className="h-3 w-3" aria-hidden="true" />
                          {images.length}{" "}
                          {images.length === 1 ? "foto" : "fotos"}
                        </span>
                      ) : null}
                      {video ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/90 px-2.5 py-0.5 text-[11px] font-bold text-white">
                          <Film className="h-3 w-3" aria-hidden="true" />
                          Video
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-brand-green">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        {album.eventDateFormatted}
                      </span>
                      <span className="inline-flex items-center gap-1 text-brand-sky-dark">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {album.location}
                      </span>
                    </div>

                    <p className="text-sm font-extrabold leading-snug text-brand-ink">
                      {album.title}
                    </p>

                    {album.description ? (
                      <p className="line-clamp-2 text-xs leading-relaxed text-brand-muted">
                        {album.description}
                      </p>
                    ) : null}

                    <p className="text-[11px] text-brand-muted">
                      Subida por{" "}
                      {album.uploadedByUsername
                        ? `@${album.uploadedByUsername}`
                        : "Administración"}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <ExpoPhotoActions
                    id={album.id}
                    title={album.title}
                    isPublished={album.isPublished}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
