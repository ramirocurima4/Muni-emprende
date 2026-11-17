/**
 * Normaliza un número telefónico argentino al formato E.164 sin '+' para wa.me (ej. 5493777554433).
 */
export function normalizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("549") && digits.length >= 12) {
    return digits;
  }

  if (digits.startsWith("54") && !digits.startsWith("549")) {
    return `549${digits.slice(2)}`;
  }

  const withoutLeadingZero = digits.replace(/^0+/, "");
  const withoutLocal15 = withoutLeadingZero.replace(
    /^(\d{2,4})15(\d{6,8})$/,
    "$1$2",
  );

  return `549${withoutLocal15}`;
}

export interface ProductWhatsappLinkInput {
  whatsappNumber: string;
  businessName: string;
  productTitle: string;
}

/**
 * Genera el enlace oficial a WhatsApp con el mensaje prearmado según memory.md §4.3.
 */
export function buildProductWhatsappUrl({
  whatsappNumber,
  businessName,
  productTitle,
}: ProductWhatsappLinkInput): string {
  const normalizedPhone = normalizeWhatsappNumber(whatsappNumber);
  const message = `Hola ${businessName}! Vi tu producto "${productTitle}" en el portal de Emprendedores de San Roque y quería consultarte.`;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Genera un enlace a WhatsApp para contacto institucional (ej. sumarse a MuniEmprende).
 */
export function buildInstitutionalWhatsappUrl(
  rawPhone: string,
  message: string,
): string {
  const normalizedPhone = normalizeWhatsappNumber(rawPhone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/**
 * Formatea el precio en pesos argentinos o devuelve "Consultar" si es nulo.
 */
export function formatPriceArs(
  priceArs: number | string | { toString(): string } | null | undefined,
): string {
  if (priceArs === null || priceArs === undefined) {
    return "Consultar";
  }
  const numeric =
    typeof priceArs === "number" ? priceArs : Number(priceArs.toString());
  if (Number.isNaN(numeric) || numeric <= 0) {
    return "Consultar";
  }
  return arsFormatter.format(numeric);
}
