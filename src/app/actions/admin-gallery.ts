"use server";

import { AuditEntityType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, toActionError } from "@/lib/server/admin-auth";
import { revalidateAdminMutation } from "@/lib/server/admin-revalidate";
import {
  processAndSaveExpoImage,
  removeStoredImageVariantsByRelativePath,
  removeUploadedProductImageVariants,
  type SavedProductImageVariants,
} from "@/lib/server/image-upload";
import {
  createExpoPhotoSchema,
  expoPhotoIdSchema,
  setExpoPhotoPublishedSchema,
} from "@/lib/validations/admin";

export interface ExpoPhotoActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: { caption?: string; eventDate?: string };
  /** Marca de tiempo del último guardado correcto (permite reiniciar el formulario). */
  savedAt?: number;
}

export interface SimpleActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Sube una foto de la Expo (WebP sin EXIF, thumb + full) con fecha y descripción corta.
 * Queda publicada en la portada pública de inmediato.
 */
export async function createExpoPhotoAction(
  _prevState: ExpoPhotoActionState,
  formData: FormData,
): Promise<ExpoPhotoActionState> {
  const values = {
    caption: String(formData.get("caption") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
  };

  const parsed = createExpoPhotoSchema.safeParse(values);
  const rawImage = formData.get("image");
  const hasImage = rawImage instanceof File && rawImage.size > 0;

  if (!parsed.success || !hasImage) {
    return {
      ok: false,
      error: "Revisá los campos marcados.",
      fieldErrors: {
        ...(parsed.success ? {} : parsed.error.flatten().fieldErrors),
        image: hasImage ? undefined : ["Elegí una foto de la Expo."],
      },
      values,
    };
  }

  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch (err) {
    return { ...toActionError(err, "No tenés permisos."), values };
  }

  let saved: SavedProductImageVariants;
  try {
    saved = await processAndSaveExpoImage(rawImage);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo procesar la foto.";
    return { ok: false, error: message, fieldErrors: { image: [message] }, values };
  }

  try {
    await db.$transaction(async (tx) => {
      const photo = await tx.expoPhoto.create({
        data: {
          relativePath: saved.relativePath,
          width: saved.width,
          height: saved.height,
          eventDate: new Date(`${parsed.data.eventDate}T00:00:00.000Z`),
          caption: parsed.data.caption,
          isPublished: true,
          uploadedById: admin.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.EXPO_PHOTO,
          entityId: photo.id,
          action: "CREATE_EXPO_PHOTO",
          metadata: {
            title: parsed.data.caption,
            eventDate: parsed.data.eventDate,
            imageRelativePath: saved.relativePath,
          },
        },
      });
    });

    revalidateAdminMutation({ expos: true });
    return { ok: true, savedAt: Date.now() };
  } catch {
    await removeUploadedProductImageVariants(saved);
    return {
      ok: false,
      error: "No pudimos guardar la foto. Intentá de nuevo en unos segundos.",
      values,
    };
  }
}

/** Muestra u oculta una foto en la portada sin borrarla. */
export async function setExpoPhotoPublishedAction(input: {
  id: string;
  published: boolean;
}): Promise<SimpleActionResult> {
  const parsed = setExpoPhotoPublishedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const admin = await requireAdmin();
    await db.$transaction(async (tx) => {
      const photo = await tx.expoPhoto.findUnique({
        where: { id: parsed.data.id },
        select: { id: true, caption: true },
      });
      if (!photo) throw new Error("No encontramos esa foto.");

      await tx.expoPhoto.update({
        where: { id: photo.id },
        data: { isPublished: parsed.data.published },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.EXPO_PHOTO,
          entityId: photo.id,
          action: "SET_EXPO_PHOTO_PUBLISHED",
          metadata: {
            title: photo.caption,
            newStatus: parsed.data.published ? "VISIBLE" : "OCULTA",
          },
        },
      });
    });

    revalidateAdminMutation({ expos: true });
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo actualizar la foto.");
  }
}

/** Elimina la foto y sus archivos del disco. */
export async function deleteExpoPhotoAction(input: {
  id: string;
}): Promise<SimpleActionResult> {
  const parsed = expoPhotoIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const admin = await requireAdmin();
    const relativePath = await db.$transaction(async (tx) => {
      const photo = await tx.expoPhoto.findUnique({
        where: { id: parsed.data.id },
        select: { id: true, caption: true, relativePath: true },
      });
      if (!photo) throw new Error("No encontramos esa foto.");

      await tx.expoPhoto.delete({ where: { id: photo.id } });
      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.EXPO_PHOTO,
          entityId: photo.id,
          action: "DELETE_EXPO_PHOTO",
          metadata: { title: photo.caption },
        },
      });
      return photo.relativePath;
    });

    await removeStoredImageVariantsByRelativePath(relativePath);
    revalidateAdminMutation({ expos: true });
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo eliminar la foto.");
  }
}
