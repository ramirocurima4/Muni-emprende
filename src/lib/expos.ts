import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";
import type { FairTypeKey } from "./fairs";
import { getPublicSystemConfig } from "./system-config";

export interface PublicFairConfig {
  fairType: FairTypeKey;
  /** Próxima fecha en formato `YYYY-MM-DD`, o `null` si todavía está a confirmar. */
  nextDate: string | null;
  schedule: string;
  location: string;
  mapsUrl: string | null;
  whatsappNumber: string;
}

export interface PublicFairMediaItem {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  relativePath: string;
  width: number | null;
  height: number | null;
  sortOrder: number;
}

export interface PublicFairAlbum {
  id: string;
  fairType: FairTypeKey;
  title: string;
  /** Fecha de la feria en formato `YYYY-MM-DD` (UTC). */
  eventDate: string;
  location: string;
  description: string | null;
  media: PublicFairMediaItem[];
}

export async function getPublicFairConfigs(): Promise<
  Record<FairTypeKey, PublicFairConfig>
> {
  const systemConfig = await getPublicSystemConfig();
  return systemConfig.fairs;
}

/**
 * Crónicas publicadas de una feria específica (feed tipo diario virtual).
 * Se invalida con los tags `public-expos` / `public-fairs` al publicar, ocultar o borrar.
 */
export async function getPublicFairAlbumsByType(
  fairType: FairTypeKey,
  limit = 30,
): Promise<PublicFairAlbum[]> {
  "use cache";
  cacheTag("public-expos", "public-fairs");
  cacheLife("minutes");

  const safeLimit = Math.min(Math.max(limit, 1), 60);

  const albums = await db.fairAlbum.findMany({
    where: { fairType, isPublished: true, media: { some: {} } },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    take: safeLimit,
    include: {
      media: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          mediaType: true,
          relativePath: true,
          width: true,
          height: true,
          sortOrder: true,
        },
      },
    },
  });

  return albums.map((album) => ({
    id: album.id,
    fairType: album.fairType,
    title: album.title,
    eventDate: album.eventDate.toISOString().slice(0, 10),
    location: album.location,
    description: album.description,
    media: album.media,
  }));
}
