export const FAIR_TYPES = [
  "EXPO_EMPRENDEDORES",
  "MERCADO_SANROQUENO",
] as const;

export type FairTypeKey = (typeof FAIR_TYPES)[number];

export interface FairStaticMeta {
  fairType: FairTypeKey;
  label: string;
  badge: string;
  audience: string;
  joinPrompt: string;
  ctaLabel: string;
  areaLabel: string;
  whatsappMessage: string;
  defaultSchedule: string;
  defaultLocation: string;
  defaultWhatsappRaw: string;
}

export const FAIR_META: Record<FairTypeKey, FairStaticMeta> = {
  EXPO_EMPRENDEDORES: {
    fairType: "EXPO_EMPRENDEDORES",
    label: "Expo Emprendedores",
    badge: "Domingos en San Roque",
    audience:
      "Elaboración propia, gastronomía lista, artesanías e indumentaria.",
    joinPrompt:
      "¿Hacés comidas, artesanías o indumentaria? Reservá tu lugar en la próxima Expo Emprendedores",
    ctaLabel: "Reservar lugar por WhatsApp",
    areaLabel: "Dirección de Empleo",
    whatsappMessage:
      "Hola! Hago comidas, artesanías o indumentaria y quiero reservar mi lugar en la próxima Expo Emprendedores de San Roque.",
    defaultSchedule: "17:00 a 21:00 hs",
    defaultLocation: "Plaza Libertad",
    defaultWhatsappRaw: "5493794819378",
  },
  MERCADO_SANROQUENO: {
    fairType: "MERCADO_SANROQUENO",
    label: "Mercado Sanroqueño",
    badge: "Productores Locales",
    audience:
      "Frutas, verduras frescas, huevos caseros y producción de granja.",
    joinPrompt:
      "¿Sos productor de frutas, verduras o granja? Sumate al Mercado Sanroqueño",
    ctaLabel: "Sumarme por WhatsApp",
    areaLabel: "Dirección de Producción",
    whatsappMessage:
      "Hola! Soy productor de frutas, verduras o granja y quiero sumarme al Mercado Sanroqueño.",
    defaultSchedule: "08:00 a 13:00 hs",
    defaultLocation: "Plaza Libertad",
    defaultWhatsappRaw: "5493794819378",
  },
};

export const PRESET_FAIR_LOCATIONS = [
  "Plaza Libertad",
  "Balneario Municipal",
] as const;
