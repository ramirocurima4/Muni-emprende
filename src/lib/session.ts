import { cookies } from "next/headers";
import { z } from "zod";

export const SESSION_COOKIE_NAME = "muni_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 días

export const sessionPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["ENTREPRENEUR", "MODERATOR", "ADMIN"]),
  entrepreneurId: z.string().uuid().nullable().optional(),
  iat: z.number(),
  exp: z.number(),
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

function getJwtSecretBytes(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET no está configurada o es demasiado corta en las variables de entorno.",
    );
  }
  return new TextEncoder().encode(secret);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const secretBytes = getJwtSecretBytes();
  return crypto.subtle.importKey(
    "raw",
    secretBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Firma un JWT HS256 estándar compatible con Edge Runtime y Node.js.
 */
export async function signSessionToken(
  input: Omit<SessionPayload, "iat" | "exp">,
): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...input,
    iat: nowSeconds,
    exp: nowSeconds + SESSION_DURATION_SECONDS,
  };

  const headerSegment = toBase64Url(
    new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );
  const payloadSegment = toBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signingInput = `${headerSegment}.${payloadSegment}`;

  const key = await getHmacKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );
  const signatureSegment = toBase64Url(new Uint8Array(signatureBuffer));

  return `${signingInput}.${signatureSegment}`;
}

/**
 * Verifica la firma criptográfica y expiración de un JWT HS256, validando su estructura con Zod.
 */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerSegment, payloadSegment, signatureSegment] = parts;

  try {
    const key = await getHmacKey();
    const signingInput = new TextEncoder().encode(
      `${headerSegment}.${payloadSegment}`,
    );
    const signatureBytes = fromBase64Url(signatureSegment);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.buffer as ArrayBuffer,
      signingInput,
    );
    if (!isValid) return null;

    const decodedJson = new TextDecoder().decode(fromBase64Url(payloadSegment));
    const parsed = sessionPayloadSchema.safeParse(JSON.parse(decodedJson));
    if (!parsed.success) return null;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (parsed.data.exp <= nowSeconds) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * Crea la cookie HttpOnly con el JWT de sesión.
 */
export async function createSessionCookie(
  payload: Omit<SessionPayload, "iat" | "exp">,
): Promise<void> {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Elimina la cookie de sesión actual.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Lee y valida la sesión actual en el servidor desde las cookies de la petición.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
