import { AuditEntityType, FairMediaType } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { revalidateAdminFairsFromRouteHandler } from "@/lib/server/admin-revalidate";
import {
  isValidManagedFairVideoUrl,
  MAX_FAIR_ALBUM_PHOTOS,
  processAndSaveExpoImage,
  removeStoredFairMedia,
  removeUploadedProductImageVariants,
  type SavedProductImageVariants,
} from "@/lib/server/image-upload";
import { createFairAlbumSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "No tenés permisos para publicar crónicas." },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "No pudimos leer los datos de la crónica." },
      { status: 400 },
    );
  }

  const rawValues = {
    fairType: String(formData.get("fairType") ?? ""),
    title: String(formData.get("title") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    location: String(formData.get("location") ?? ""),
    description: String(formData.get("description") ?? ""),
    videoUrl: String(formData.get("videoUrl") ?? ""),
  };

  const parsed = createFairAlbumSchema.safeParse(rawValues);
  const rawImages = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  const hasVideo = Boolean(parsed.success && parsed.data.videoUrl);
  const hasMedia = rawImages.length > 0 || hasVideo;

  if (!parsed.success || !hasMedia || rawImages.length > MAX_FAIR_ALBUM_PHOTOS) {
    const fieldErrors = parsed.success
      ? {}
      : parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      {
        ok: false,
        error: "Revisá los campos marcados antes de publicar.",
        fieldErrors: {
          ...fieldErrors,
          media: !hasMedia
            ? ["Subí al menos una foto o un video corto para la crónica."]
            : rawImages.length > MAX_FAIR_ALBUM_PHOTOS
              ? [
                  `Podés subir hasta ${MAX_FAIR_ALBUM_PHOTOS} fotos por crónica.`,
                ]
              : undefined,
        },
      },
      { status: 400 },
    );
  }

  const cleanVideoUrl = parsed.data.videoUrl;
  if (cleanVideoUrl && !isValidManagedFairVideoUrl(cleanVideoUrl)) {
    return NextResponse.json(
      {
        ok: false,
        error: "La URL del video no pertenece al almacenamiento oficial.",
        fieldErrors: {
          media: ["Volvé a subir el video desde el formulario."],
        },
      },
      { status: 400 },
    );
  }

  const savedImages: SavedProductImageVariants[] = [];
  try {
    for (const imageFile of rawImages) {
      const saved = await processAndSaveExpoImage(imageFile);
      savedImages.push(saved);
    }
  } catch (err) {
    await Promise.allSettled(
      savedImages.map((img) => removeUploadedProductImageVariants(img)),
    );
    const message =
      err instanceof Error ? err.message : "No se pudieron procesar las fotos.";
    return NextResponse.json(
      { ok: false, error: message, fieldErrors: { media: [message] } },
      { status: 400 },
    );
  }

  try {
    const createdAlbum = await db.$transaction(async (tx) => {
      const mediaRecords = [
        ...savedImages.map((img, index) => ({
          mediaType: FairMediaType.IMAGE,
          relativePath: img.relativePath,
          width: img.width,
          height: img.height,
          sortOrder: index,
        })),
        ...(cleanVideoUrl
          ? [
              {
                mediaType: FairMediaType.VIDEO,
                relativePath: cleanVideoUrl,
                width: null,
                height: null,
                sortOrder: savedImages.length,
              },
            ]
          : []),
      ];

      const album = await tx.fairAlbum.create({
        data: {
          fairType: parsed.data.fairType,
          title: parsed.data.title,
          eventDate: new Date(`${parsed.data.eventDate}T00:00:00.000Z`),
          location: parsed.data.location,
          description: parsed.data.description,
          isPublished: true,
          uploadedById: admin.userId,
          media: {
            create: mediaRecords,
          },
        },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.FAIR_ALBUM,
          entityId: album.id,
          action: "CREATE_FAIR_ALBUM",
          metadata: {
            title: parsed.data.title,
            fairType: parsed.data.fairType,
            eventDate: parsed.data.eventDate,
            location: parsed.data.location,
            photosCount: savedImages.length,
            hasVideo: Boolean(cleanVideoUrl),
          },
        },
      });

      return album;
    });

    revalidateAdminFairsFromRouteHandler();

    return NextResponse.json(
      { ok: true, id: createdAlbum.id },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/galeria/albums] Error guardando crónica:", err);
    await Promise.allSettled([
      ...savedImages.map((img) => removeUploadedProductImageVariants(img)),
      ...(cleanVideoUrl
        ? [removeStoredFairMedia(cleanVideoUrl, "VIDEO")]
        : []),
    ]);
    return NextResponse.json(
      {
        ok: false,
        error: "No pudimos guardar la crónica. Intentá de nuevo en unos segundos.",
      },
      { status: 500 },
    );
  }
}
