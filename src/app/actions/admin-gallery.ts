"use server";

import { AuditEntityType } from "@prisma/client";
import { db } from "@/lib/db";
import type { FairTypeKey } from "@/lib/fairs";
import { requireAdmin, toActionError } from "@/lib/server/admin-auth";
import { revalidateAdminMutation } from "@/lib/server/admin-revalidate";
import { removeStoredFairMedia } from "@/lib/server/image-upload";
import {
  fairAlbumIdSchema,
  setFairAlbumPublishedSchema,
  updateFairConfigSchema,
} from "@/lib/validations/admin";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

export interface FairConfigActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  savedAt?: number;
}

export interface SimpleActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Actualiza la cartelera pública (próxima fecha, horario, lugar, Google Maps y WhatsApp de inscripción)
 * para Expo Emprendedores o Mercado Sanroqueño.
 */
export async function updateFairConfigAction(
  _prevState: FairConfigActionState,
  formData: FormData,
): Promise<FairConfigActionState> {
  const raw = {
    fairType: String(formData.get("fairType") ?? ""),
    nextDate: String(formData.get("nextDate") ?? ""),
    schedule: String(formData.get("schedule") ?? ""),
    location: String(formData.get("location") ?? ""),
    mapsUrl: String(formData.get("mapsUrl") ?? ""),
    whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
  };

  const parsed = updateFairConfigSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los campos marcados antes de guardar.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch (err) {
    return toActionError(err, "No tenés permisos.");
  }

  const normalizedWhatsapp = normalizeWhatsappNumber(parsed.data.whatsappNumber);
  const nextDateValue = parsed.data.nextDate
    ? new Date(`${parsed.data.nextDate}T00:00:00.000Z`)
    : null;
  const fairType = parsed.data.fairType as FairTypeKey;

  try {
    await db.$transaction(async (tx) => {
      const config = await tx.fairConfig.upsert({
        where: { fairType },
        update: {
          nextDate: nextDateValue,
          schedule: parsed.data.schedule,
          location: parsed.data.location,
          mapsUrl: parsed.data.mapsUrl,
          whatsappNumber: normalizedWhatsapp,
          updatedById: admin.userId,
        },
        create: {
          fairType,
          nextDate: nextDateValue,
          schedule: parsed.data.schedule,
          location: parsed.data.location,
          mapsUrl: parsed.data.mapsUrl,
          whatsappNumber: normalizedWhatsapp,
          updatedById: admin.userId,
        },
      });

      await tx.systemConfig.upsert({
        where: { key: "institutional" },
        update:
          fairType === "EXPO_EMPRENDEDORES"
            ? {
                employmentWhatsapp: normalizedWhatsapp,
                expoNextDate: nextDateValue,
                expoSchedule: parsed.data.schedule ?? "17:00 a 21:00 hs",
                expoLocation: parsed.data.location ?? "Plaza Libertad",
                expoMapsUrl: parsed.data.mapsUrl,
                updatedById: admin.userId,
              }
            : {
                productionWhatsapp: normalizedWhatsapp,
                mercadoNextDate: nextDateValue,
                mercadoSchedule: parsed.data.schedule ?? "08:00 a 13:00 hs",
                mercadoLocation: parsed.data.location ?? "Plaza Libertad",
                mercadoMapsUrl: parsed.data.mapsUrl,
                updatedById: admin.userId,
              },
        create:
          fairType === "EXPO_EMPRENDEDORES"
            ? {
                key: "institutional",
                employmentWhatsapp: normalizedWhatsapp,
                expoNextDate: nextDateValue,
                expoSchedule: parsed.data.schedule ?? "17:00 a 21:00 hs",
                expoLocation: parsed.data.location ?? "Plaza Libertad",
                expoMapsUrl: parsed.data.mapsUrl,
                updatedById: admin.userId,
              }
            : {
                key: "institutional",
                productionWhatsapp: normalizedWhatsapp,
                mercadoNextDate: nextDateValue,
                mercadoSchedule: parsed.data.schedule ?? "08:00 a 13:00 hs",
                mercadoLocation: parsed.data.location ?? "Plaza Libertad",
                mercadoMapsUrl: parsed.data.mapsUrl,
                updatedById: admin.userId,
              },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.FAIR_CONFIG,
          entityId: config.id,
          action: "UPDATE_FAIR_CONFIG",
          metadata: {
            title:
              fairType === "EXPO_EMPRENDEDORES"
                ? "Expo Emprendedores"
                : "Mercado Sanroqueño",
            fairType,
            nextDate: parsed.data.nextDate,
            schedule: parsed.data.schedule,
            location: parsed.data.location,
            whatsappNumber: normalizedWhatsapp,
          },
        },
      });
    });

    revalidateAdminMutation({ fairs: true, systemConfig: true });
    return { ok: true, savedAt: Date.now() };
  } catch (err) {
    console.error("[updateFairConfigAction] Error guardando cartelera:", err);
    return {
      ok: false,
      error: "No pudimos guardar la cartelera. Intentá de nuevo en unos segundos.",
    };
  }
}

/** Muestra u oculta una crónica en la portada sin borrar sus archivos. */
export async function setFairAlbumPublishedAction(input: {
  id: string;
  published: boolean;
}): Promise<SimpleActionResult> {
  const parsed = setFairAlbumPublishedSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  try {
    const admin = await requireAdmin();
    await db.$transaction(async (tx) => {
      const album = await tx.fairAlbum.findUnique({
        where: { id: parsed.data.id },
        select: { id: true, title: true, fairType: true },
      });
      if (!album) throw new Error("No encontramos esa crónica.");

      await tx.fairAlbum.update({
        where: { id: album.id },
        data: { isPublished: parsed.data.published },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.FAIR_ALBUM,
          entityId: album.id,
          action: "SET_FAIR_ALBUM_PUBLISHED",
          metadata: {
            title: album.title,
            fairType: album.fairType,
            newStatus: parsed.data.published ? "VISIBLE" : "OCULTA",
          },
        },
      });
    });

    revalidateAdminMutation({ expos: true });
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo actualizar la crónica.");
  }
}

/** Elimina la crónica completa y todos sus archivos multimedia (fotos WebP y videos) de Supabase Storage. */
export async function deleteFairAlbumAction(input: {
  id: string;
}): Promise<SimpleActionResult> {
  const parsed = fairAlbumIdSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  try {
    const admin = await requireAdmin();
    const mediaList = await db.$transaction(async (tx) => {
      const album = await tx.fairAlbum.findUnique({
        where: { id: parsed.data.id },
        select: {
          id: true,
          title: true,
          fairType: true,
          media: {
            select: { relativePath: true, mediaType: true },
          },
        },
      });
      if (!album) throw new Error("No encontramos esa crónica.");

      await tx.fairAlbum.delete({ where: { id: album.id } });
      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.FAIR_ALBUM,
          entityId: album.id,
          action: "DELETE_FAIR_ALBUM",
          metadata: {
            title: album.title,
            fairType: album.fairType,
            mediaCount: album.media.length,
          },
        },
      });
      return album.media;
    });

    await Promise.allSettled(
      mediaList.map((item) =>
        removeStoredFairMedia(item.relativePath, item.mediaType),
      ),
    );

    revalidateAdminMutation({ expos: true });
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo eliminar la crónica.");
  }
}
