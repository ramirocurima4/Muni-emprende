export type ImageVariant = "thumb" | "full";

/**
 * Construye la URL pública de una imagen WebP a partir de su ruta relativa en DB.
 * Ejemplo: "products/2026/11/uuid" -> "/uploads/products/2026/11/uuid_thumb.webp"
 */
export function getProductImageUrl(
  relativePath: string,
  variant: ImageVariant = "thumb",
): string {
  const cleanPath = relativePath.replace(/^\/+|\/+$/g, "");
  return `/uploads/${cleanPath}_${variant}.webp`;
}
