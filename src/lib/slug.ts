/**
 * Normaliza un texto en español a un slug URL-safe sin tildes ni caracteres especiales.
 */
export function slugifyText(
  input: string,
  fallback = "item",
  maxLength = 120,
): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);

  return base || fallback;
}
