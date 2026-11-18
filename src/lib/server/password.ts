import { randomInt } from "node:crypto";

// Sin caracteres ambiguos (0/O, 1/l/I) para que se pueda dictar por teléfono.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * Genera una contraseña temporal aleatoria con `crypto.randomInt`
 * en 3 bloques legibles (ej. `Kq7m-Zx3p-Wd9R`, 12 caracteres útiles).
 */
export function generateTemporaryPassword(): string {
  const blocks: string[] = [];
  for (let b = 0; b < 3; b++) {
    let block = "";
    for (let i = 0; i < 4; i++) {
      block += ALPHABET[randomInt(ALPHABET.length)];
    }
    blocks.push(block);
  }
  return blocks.join("-");
}
