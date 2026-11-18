import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";

export interface PublicExpoPhoto {
  id: string;
  caption: string;
  /** Fecha de la Expo en formato `YYYY-MM-DD` (se formatea en el cliente/servidor en UTC). */
  eventDate: string;
  relativePath: string;
  width: number;
  height: number;
}

/**
 * Últimas fotos publicadas de la Expo Emprendedores para la portada pública.
 * Se invalida con el tag `public-expos` cuando Prensa sube, oculta o borra una foto.
 */
export async function getPublicExpoPhotos(limit = 8): Promise<PublicExpoPhoto[]> {
  "use cache";
  cacheTag("public-expos");
  cacheLife("minutes");

  const photos = await db.expoPhoto.findMany({
    where: { isPublished: true },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      caption: true,
      eventDate: true,
      relativePath: true,
      width: true,
      height: true,
    },
  });

  return photos.map((photo) => ({
    id: photo.id,
    caption: photo.caption,
    eventDate: photo.eventDate.toISOString().slice(0, 10),
    relativePath: photo.relativePath,
    width: photo.width,
    height: photo.height,
  }));
}
