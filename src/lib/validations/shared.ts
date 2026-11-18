import { z } from "zod";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

/**
 * WhatsApp argentino obligatorio: se valida normalizado a formato wa.me (549 + área + número).
 */
export const whatsappNumberSchema = z
  .string()
  .trim()
  .min(8, "El WhatsApp es obligatorio. Ingresá el número con código de área.")
  .max(25, "El número de WhatsApp es demasiado largo.")
  .refine((val) => /^549\d{10,11}$/.test(normalizeWhatsappNumber(val)), {
    message:
      "Ingresá un WhatsApp válido con código de área (ej. 3777 554433).",
  });

/** Texto opcional: vacío se convierte en `null`. */
export function optionalText(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null));
}
