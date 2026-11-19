"use server";

import { AuditEntityType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, toActionError } from "@/lib/server/admin-auth";
import { revalidateAdminMutation } from "@/lib/server/admin-revalidate";
import { updateSystemConfigSchema } from "@/lib/validations/admin";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

export interface SystemConfigActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  savedAt?: number;
}

/**
 * Actualiza en vivo la Configuración Institucional completa (WhatsApp de Empleo y Producción,
 * Cartelera de Próximas Ferias y Datos de Autoridad/Aviso Legal).
 */
export async function updateSystemConfigAction(
  _prevState: SystemConfigActionState,
  formData: FormData,
): Promise<SystemConfigActionState> {
  const raw = {
    employmentWhatsapp: String(formData.get("employmentWhatsapp") ?? ""),
    productionWhatsapp: String(formData.get("productionWhatsapp") ?? ""),
    expoNextDate: String(formData.get("expoNextDate") ?? ""),
    expoSchedule: String(formData.get("expoSchedule") ?? ""),
    expoLocation: String(formData.get("expoLocation") ?? ""),
    expoMapsUrl: String(formData.get("expoMapsUrl") ?? ""),
    mercadoNextDate: String(formData.get("mercadoNextDate") ?? ""),
    mercadoSchedule: String(formData.get("mercadoSchedule") ?? ""),
    mercadoLocation: String(formData.get("mercadoLocation") ?? ""),
    mercadoMapsUrl: String(formData.get("mercadoMapsUrl") ?? ""),
    authorityName: String(formData.get("authorityName") ?? ""),
    authorityTitle: String(formData.get("authorityTitle") ?? ""),
    legalDisclaimer: String(formData.get("legalDisclaimer") ?? ""),
  };

  const parsed = updateSystemConfigSchema.safeParse(raw);
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

  const employmentWhatsapp = normalizeWhatsappNumber(
    parsed.data.employmentWhatsapp,
  );
  const productionWhatsapp = normalizeWhatsappNumber(
    parsed.data.productionWhatsapp,
  );
  const expoNextDate = parsed.data.expoNextDate
    ? new Date(`${parsed.data.expoNextDate}T00:00:00.000Z`)
    : null;
  const mercadoNextDate = parsed.data.mercadoNextDate
    ? new Date(`${parsed.data.mercadoNextDate}T00:00:00.000Z`)
    : null;

  try {
    await db.$transaction(async (tx) => {
      const config = await tx.systemConfig.upsert({
        where: { key: "institutional" },
        update: {
          employmentWhatsapp,
          productionWhatsapp,
          expoNextDate,
          expoSchedule: parsed.data.expoSchedule,
          expoLocation: parsed.data.expoLocation,
          expoMapsUrl: parsed.data.expoMapsUrl,
          mercadoNextDate,
          mercadoSchedule: parsed.data.mercadoSchedule,
          mercadoLocation: parsed.data.mercadoLocation,
          mercadoMapsUrl: parsed.data.mercadoMapsUrl,
          authorityName: parsed.data.authorityName,
          authorityTitle: parsed.data.authorityTitle,
          legalDisclaimer: parsed.data.legalDisclaimer,
          updatedById: admin.userId,
        },
        create: {
          key: "institutional",
          employmentWhatsapp,
          productionWhatsapp,
          expoNextDate,
          expoSchedule: parsed.data.expoSchedule,
          expoLocation: parsed.data.expoLocation,
          expoMapsUrl: parsed.data.expoMapsUrl,
          mercadoNextDate,
          mercadoSchedule: parsed.data.mercadoSchedule,
          mercadoLocation: parsed.data.mercadoLocation,
          mercadoMapsUrl: parsed.data.mercadoMapsUrl,
          authorityName: parsed.data.authorityName,
          authorityTitle: parsed.data.authorityTitle,
          legalDisclaimer: parsed.data.legalDisclaimer,
          updatedById: admin.userId,
        },
      });

      // Mantener fair_configs sincronizada para compatibilidad con /admin/galeria
      await tx.fairConfig.upsert({
        where: { fairType: "EXPO_EMPRENDEDORES" },
        update: {
          nextDate: expoNextDate,
          schedule: parsed.data.expoSchedule,
          location: parsed.data.expoLocation,
          mapsUrl: parsed.data.expoMapsUrl,
          whatsappNumber: employmentWhatsapp,
          updatedById: admin.userId,
        },
        create: {
          fairType: "EXPO_EMPRENDEDORES",
          nextDate: expoNextDate,
          schedule: parsed.data.expoSchedule,
          location: parsed.data.expoLocation,
          mapsUrl: parsed.data.expoMapsUrl,
          whatsappNumber: employmentWhatsapp,
          updatedById: admin.userId,
        },
      });

      await tx.fairConfig.upsert({
        where: { fairType: "MERCADO_SANROQUENO" },
        update: {
          nextDate: mercadoNextDate,
          schedule: parsed.data.mercadoSchedule,
          location: parsed.data.mercadoLocation,
          mapsUrl: parsed.data.mercadoMapsUrl,
          whatsappNumber: productionWhatsapp,
          updatedById: admin.userId,
        },
        create: {
          fairType: "MERCADO_SANROQUENO",
          nextDate: mercadoNextDate,
          schedule: parsed.data.mercadoSchedule,
          location: parsed.data.mercadoLocation,
          mapsUrl: parsed.data.mercadoMapsUrl,
          whatsappNumber: productionWhatsapp,
          updatedById: admin.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          entityType: AuditEntityType.SYSTEM_CONFIG,
          entityId: config.id,
          action: "UPDATE_SYSTEM_CONFIG",
          metadata: {
            title: "Configuración Institucional y Áreas",
            employmentWhatsapp,
            productionWhatsapp,
            authorityName: parsed.data.authorityName,
            authorityTitle: parsed.data.authorityTitle,
          },
        },
      });
    });

    revalidateAdminMutation({ systemConfig: true, fairs: true });
    return { ok: true, savedAt: Date.now() };
  } catch (err) {
    console.error("[updateSystemConfigAction] Error guardando configuración:", err);
    return {
      ok: false,
      error:
        "No pudimos guardar la configuración. Intentá de nuevo en unos segundos.",
    };
  }
}
