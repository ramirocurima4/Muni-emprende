import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import { ExpoPhotoActions } from "@/components/admin/ExpoPhotoActions";
import { ExpoUploader } from "@/components/admin/ExpoUploader";
import {
  EmptyState,
  PageHeader,
  Panel,
  SectionTitle,
  StatusBadge,
} from "@/components/admin/ui";
import { formatEventDateLong } from "@/lib/admin-labels";
import { getUploadImageUrl } from "@/lib/images";
import { requireAdminPage } from "@/lib/server/admin-auth";
import { getExpoPhotosForAdmin } from "@/lib/server/admin-data";

export const metadata: Metadata = {
  title: "Galería de Expos · Panel de Administración",
};

export default function AdminGalleryPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminGalleryContent />
    </Suspense>
  );
}

async function AdminGalleryContent() {
  await requireAdminPage();
  const photos = await getExpoPhotosForAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Galería de Expos"
        description="Espacio para que Comunicación y Prensa suba fotos de la Expo Emprendedores de los domingos. Aparecen directo en la portada pública."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <Panel className="lg:col-span-5">
          <SectionTitle
            title="Subir nueva foto"
            description="Elegí la imagen, la fecha del domingo y una descripción corta."
          />
          <ExpoUploader />
        </Panel>

        <Panel className="lg:col-span-7">
          <SectionTitle
            title="Fotos cargadas"
            description="Las últimas 8 fotos visibles se muestran en la sección 'Expo Emprendedores' de la portada."
            count={photos.length}
          />

          {photos.length === 0 ? (
            <EmptyState
              title="Todavía no hay fotos de la Expo"
              description="Cuando subas la primera foto desde el formulario, se habilitará la sección en la portada del sitio."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {photos.map((photo) => (
                <li
                  key={photo.id}
                  className="flex flex-col justify-between overflow-hidden rounded-3xl border border-brand-sky/30 bg-brand-cream/50"
                >
                  <div>
                    <div className="relative aspect-[4/3] overflow-hidden bg-brand-sky-tint">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getUploadImageUrl(photo.relativePath, "thumb")}
                        alt={photo.caption}
                        width={photo.width}
                        height={photo.height}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <StatusBadge
                          label={photo.isPublished ? "Visible en portada" : "Oculta"}
                          tone={photo.isPublished ? "green" : "amber"}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 p-4">
                      <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-brand-green">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{formatEventDateLong(photo.eventDate)}</span>
                      </p>
                      <p className="text-sm font-bold leading-snug text-brand-ink">
                        {photo.caption}
                      </p>
                      <p className="text-xs text-brand-muted">
                        Subida por{" "}
                        {photo.uploadedBy
                          ? `@${photo.uploadedBy.username}`
                          : "Administración"}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <ExpoPhotoActions
                      id={photo.id}
                      caption={photo.caption}
                      isPublished={photo.isPublished}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
