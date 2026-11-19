export type ImageVariant = "thumb" | "full";

const VARIANT_SUFFIX_REGEX = /_(thumb|full)\.webp(\?.*)?$/i;

/**
 * Construye la URL pública de una imagen WebP subida (producto, avatar o expo).
 * - Si el valor en DB ya es una URL absoluta (Supabase Storage), adapta el sufijo `_thumb.webp` / `_full.webp`.
 * - Si es una ruta relativa heredada (ej. "products/2026/11/uuid"), construye `/uploads/...`.
 */
export function getUploadImageUrl(
  relativePath: string,
  variant: ImageVariant = "thumb",
): string {
  const trimmed = relativePath.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    if (VARIANT_SUFFIX_REGEX.test(trimmed)) {
      return trimmed.replace(VARIANT_SUFFIX_REGEX, `_${variant}.webp$2`);
    }
    return trimmed;
  }

  const cleanPath = trimmed.replace(/^\/+|\/+$/g, "");
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

/**
 * Resuelve la URL pública de un video corto subido a Supabase Storage (o ruta local heredada).
 */
export function getUploadVideoUrl(relativePath: string): string {
  const trimmed = relativePath.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const cleanPath = trimmed.replace(/^\/+|\/+$/g, "");
  return `/uploads/${cleanPath}`;
}
