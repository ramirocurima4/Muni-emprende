import { Camera } from "lucide-react";
import { getUploadImageUrl } from "@/lib/images";
import type { PublicExpoPhoto } from "@/lib/expos";

const EVENT_DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function formatEventDate(isoDate: string): string {
  const label = EVENT_DATE_FORMATTER.format(new Date(`${isoDate}T00:00:00.000Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

interface ExpoGallerySectionProps {
  photos: PublicExpoPhoto[];
}

/**
 * Sección pública "Expo Emprendedores": últimas fotos de la feria de los domingos,
 * cargadas por el equipo de Prensa desde /admin/galeria. No se muestra si no hay fotos.
 */
export function ExpoGallerySection({ photos }: ExpoGallerySectionProps) {
  if (photos.length === 0) return null;

  return (
    <section
      aria-labelledby="expo-heading"
      className="rounded-[32px] border border-brand-sky/25 bg-brand-sky-tint/80 px-5 py-7 sm:px-8 sm:py-9"
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-amber-soft px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-brand-amber-text">
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            Todos los domingos
          </span>
          <h2
            id="expo-heading"
            className="mt-2.5 text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl"
          >
            Expo Emprendedores
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-brand-muted">
          Así se vive la feria en la plaza. Vení a conocer a los emprendedores
          de San Roque.
        </p>
      </div>

      <ul className="no-scrollbar carousel-snap-x -mx-5 mt-5 flex gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        {photos.map((photo) => (
          <li
            key={photo.id}
            className="carousel-snap-start w-[78%] shrink-0 sm:w-[300px]"
          >
            <figure className="overflow-hidden rounded-3xl bg-brand-surface shadow-lg shadow-black/[0.05]">
              <a
                href={getUploadImageUrl(photo.relativePath, "full")}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-[4/3] overflow-hidden bg-brand-sky-light focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green"
                aria-label={`Ver foto completa: ${photo.caption}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getUploadImageUrl(photo.relativePath, "thumb")}
                  alt={photo.caption}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </a>
              <figcaption className="space-y-0.5 px-4 py-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-brand-green">
                  {formatEventDate(photo.eventDate)}
                </p>
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-brand-ink">
                  {photo.caption}
                </p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
