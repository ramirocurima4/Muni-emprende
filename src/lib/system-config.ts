import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";
import type { PublicFairConfig } from "./expos";
import { FAIR_META, type FairTypeKey } from "./fairs";

export const DEFAULT_AUTHORITY_NAME = "Cr. Raúl Pelozo";
export const DEFAULT_AUTHORITY_TITLE = "Intendente de San Roque";
export const DEFAULT_LEGAL_DISCLAIMER =
  "La Municipalidad de San Roque brinda únicamente este espacio de difusión publicitaria y no interviene en precios, medios de pago, entregas ni garantías comerciales.";
export const DEFAULT_EMPLOYMENT_WHATSAPP = "5493794819378";
export const DEFAULT_PRODUCTION_WHATSAPP = "5493794819378";

export interface PublicSystemConfig {
  employmentWhatsapp: string;
  productionWhatsapp: string;
  authorityName: string;
  authorityTitle: string;
  legalDisclaimer: string;
  fairs: Record<FairTypeKey, PublicFairConfig>;
}

/**
 * Obtiene la configuración institucional activa (SystemConfig) con valores por defecto seguros.
 * Se invalida mediante `public-system-config` y `public-fairs`.
 */
export async function getPublicSystemConfig(): Promise<PublicSystemConfig> {
  "use cache";
  cacheTag("public-system-config", "public-fairs");
  cacheLife("minutes");

  let row = null;
  try {
    row = await db.systemConfig.findUnique({
      where: { key: "institutional" },
    });
  } catch {
    // Fallback seguro durante el build de la imagen Docker (cuando la DB aún no está conectada)
    row = null;
  }

  const expoMeta = FAIR_META.EXPO_EMPRENDEDORES;
  const mercadoMeta = FAIR_META.MERCADO_SANROQUENO;

  const employmentWhatsapp =
    row?.employmentWhatsapp?.trim() || DEFAULT_EMPLOYMENT_WHATSAPP;
  const productionWhatsapp =
    row?.productionWhatsapp?.trim() || DEFAULT_PRODUCTION_WHATSAPP;

  return {
    employmentWhatsapp,
    productionWhatsapp,
    authorityName: row?.authorityName?.trim() || DEFAULT_AUTHORITY_NAME,
    authorityTitle: row?.authorityTitle?.trim() || DEFAULT_AUTHORITY_TITLE,
    legalDisclaimer: row?.legalDisclaimer?.trim() || DEFAULT_LEGAL_DISCLAIMER,
    fairs: {
      EXPO_EMPRENDEDORES: {
        fairType: "EXPO_EMPRENDEDORES",
        nextDate: row?.expoNextDate
          ? row.expoNextDate.toISOString().slice(0, 10)
          : null,
        schedule: row?.expoSchedule?.trim() || expoMeta.defaultSchedule,
        location: row?.expoLocation?.trim() || expoMeta.defaultLocation,
        mapsUrl: row?.expoMapsUrl?.trim() || null,
        whatsappNumber: employmentWhatsapp,
      },
      MERCADO_SANROQUENO: {
        fairType: "MERCADO_SANROQUENO",
        nextDate: row?.mercadoNextDate
          ? row.mercadoNextDate.toISOString().slice(0, 10)
          : null,
        schedule: row?.mercadoSchedule?.trim() || mercadoMeta.defaultSchedule,
        location: row?.mercadoLocation?.trim() || mercadoMeta.defaultLocation,
        mapsUrl: row?.mercadoMapsUrl?.trim() || null,
        whatsappNumber: productionWhatsapp,
      },
    },
  };
}
