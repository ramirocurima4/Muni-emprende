export type ImageVariant = "thumb" | "full";

/**
 * Construye la URL pública de una imagen WebP subida (producto o logo) a partir de su ruta relativa en DB.
 * Ejemplo: "products/2026/11/uuid" -> "/uploads/products/2026/11/uuid_thumb.webp"
 */
export function getUploadImageUrl(
  relativePath: string,
  variant: ImageVariant = "thumb",
): string {
  const cleanPath = relativePath.replace(/^\/+|\/+$/g, "");
  return `/uploads/${cleanPath}_${variant}.webp`;
}

/**
 * Alias de compatibilidad para URLs de imágenes de productos.
 */
export function getProductImageUrl(
  relativePath: string,
  variant: ImageVariant = "thumb",
): string {
  return getUploadImageUrl(relativePath, variant);
}
