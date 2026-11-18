/**
 * Serialización CSV pensada para Excel en configuración regional es-AR:
 * separador `;`, BOM UTF-8 (tildes y ñ correctas) y defensa contra inyección de fórmulas.
 */
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_TRIGGERS.test(text)) {
    text = `'${text}`;
  }
  if (/[";\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | boolean | Date | null | undefined>>,
): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(";"));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
