import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import { ExpoUploader } from "@/components/admin/ExpoUploader";
import {
  FairAlbumsList,
  type AdminFairAlbumRow,
} from "@/components/admin/FairAlbumsList";
import { FairConfigEditor } from "@/components/admin/FairConfigEditor";
import { PageHeader, Panel, SectionTitle } from "@/components/admin/ui";
import { formatEventDateLong } from "@/lib/admin-labels";
import { requireAdminPage } from "@/lib/server/admin-auth";
import { getFairAlbumsForAdmin } from "@/lib/server/admin-data";
import { getPublicSystemConfig } from "@/lib/system-config";

export const metadata: Metadata = {
  title: "Cartelera y Galería de Ferias · Panel de Administración",
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
  const [systemConfig, rawAlbums] = await Promise.all([
    getPublicSystemConfig(),
    getFairAlbumsForAdmin(),
  ]);

  const configs = systemConfig.fairs;

  const albums: AdminFairAlbumRow[] = rawAlbums.map((album) => ({
    id: album.id,
    fairType: album.fairType,
    title: album.title,
    eventDateIso: album.eventDate.toISOString().slice(0, 10),
    eventDateFormatted: formatEventDateLong(album.eventDate),
    location: album.location,
    description: album.description,
    isPublished: album.isPublished,
    uploadedByUsername: album.uploadedBy?.username ?? null,
    media: album.media,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartelera y Galería de Ferias"
        description="Editá las próximas fechas, lugares y WhatsApp de inscripción de Expo Emprendedores y Mercado Sanroqueño, y publicá crónicas con fotos y videos cortos."
      />

      {/* 1. Cartelera de Próximas Fechas e Inscripción */}
      <Panel>
        <SectionTitle
          title="Próximas fechas y WhatsApp de inscripción"
          description="Estos datos actualizan en vivo la cartelera 'Próximas Fechas en San Roque' y los dos botones de inscripción de la portada."
        />
        <FairConfigEditor configs={configs} />
      </Panel>

      {/* 2. Crónicas Multimedia Separadas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <Panel className="lg:col-span-5">
          <SectionTitle
            title="Publicar nueva crónica"
            description="Elegí la feria, cargá varias fotos y/o un video corto (.mp4 o .webm, máx. 25 MB)."
          />
          <ExpoUploader />
        </Panel>

        <Panel className="lg:col-span-7">
          <SectionTitle
            title="Crónicas cargadas"
            description="En la portada se muestran en pestañas separadas: Expo Emprendedores por un lado y Mercado Sanroqueño por otro."
            count={albums.length}
          />
          <FairAlbumsList albums={albums} />
        </Panel>
      </div>
    </div>
  );
}
