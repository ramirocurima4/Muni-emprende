import { z } from "zod";

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
    .min(3, "Ingresá un título de al menos 3 caracteres.")
    .max(160, "El título no puede superar los 160 caracteres."),
  description: z
    .string()
    .trim()
    .min(10, "Contanos un poco más sobre el producto (mínimo 10 caracteres).")
    .max(2000, "La descripción no puede superar los 2000 caracteres."),
  categoryId: z
    .string()
    .trim()
    .uuid("Seleccioná una categoría válida del listado."),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
