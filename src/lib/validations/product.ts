import { z } from "zod";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export const toggleProductAvailabilitySchema = z.object({
  productId: z.string().uuid("Identificador de producto inválido."),
  available: z.boolean(),
});

export type ToggleProductAvailabilityInput = z.infer<
  typeof toggleProductAvailabilitySchema
>;

export const createProductSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Escribí un nombre de al menos 3 letras.")
    .max(160, "El nombre no puede superar las 160 letras."),
  description: z
    .string()
    .trim()
    .min(10, "Contanos un poquito más sobre el producto (al menos 10 letras).")
    .max(2000, "La descripción es demasiado larga (máximo 2000 letras)."),
  categoryId: z
    .string()
    .trim()
    .uuid("Elegí un rubro de la lista."),
  ingredients: z
    .string()
    .trim()
    .max(1000, "Los ingredientes no pueden superar las 1000 letras.")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateEntrepreneurProfileSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Escribí el nombre de tu emprendimiento (al menos 2 letras).")
    .max(150, "El nombre del emprendimiento no puede superar las 150 letras."),
  whatsappNumber: z
    .string()
    .trim()
    .min(8, "El WhatsApp es obligatorio para que tus clientes te escriban.")
    .max(25, "El número de WhatsApp es demasiado largo.")
    .refine(
      (val) => {
        const normalized = normalizeWhatsappNumber(val);
        return /^549\d{10,11}$/.test(normalized);
      },
      {
        message:
          "Ingresá un WhatsApp válido con código de área (ej. 3777 554433).",
      },
    ),
  neighborhood: z
    .string()
    .trim()
    .max(120, "El barrio o zona no puede superar las 120 letras.")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  bio: z
    .string()
    .trim()
    .max(600, "La descripción breve no puede superar las 600 letras.")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type UpdateEntrepreneurProfileInput = z.infer<
  typeof updateEntrepreneurProfileSchema
>;
