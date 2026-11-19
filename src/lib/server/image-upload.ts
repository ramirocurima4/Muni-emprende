import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { MAX_PRODUCT_IMAGE_BYTES } from "@/lib/validations/product";

const SUPABASE_STORAGE_BUCKET = "muniemprende";
const PUBLIC_OBJECT_PREFIX = `/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;

export const MAX_FAIR_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_FAIR_ALBUM_PHOTOS = 8;

const ALLOWED_MP4_BRANDS = new Set([
  "isom",
  "iso2",
  "iso5",
  "iso6",
  "mp41",
  "mp42",
  "avc1",
  "m4v ",
  "qt  ",
  "msnv",
  "f4v ",
  "dash",
]);

const ALLOWED_ISOBMFF_BRANDS = new Set([
  "avif",
  "avis",
  "heic",
  "heix",
  "hevc",
  "hevx",
  "mif1",
  "msf1",
]);

export type UploadFolder = "products" | "avatars" | "expos";

export interface SavedProductImageVariants {
  /** URL pública completa en Supabase Storage (variante `_full.webp`) para guardar en PostgreSQL. */
  relativePath: string;
  width: number;
  height: number;
  fullFilePath: string;
  thumbFilePath: string;
}

function getUploadRoot(): string {
  return path.resolve(
    process.cwd(),
    process.env.UPLOAD_DIR ?? "./storage/uploads",
  );
}

function getSupabaseStorageClient(): SupabaseClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    throw new Error(
      "Configuración inválida de Supabase: NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida (https://<proyecto>.supabase.co).",
    );
  }

  if (!serviceRoleKey || /^https?:\/\//i.test(serviceRoleKey)) {
    throw new Error(
      "Configuración inválida de Supabase: falta un SUPABASE_SERVICE_ROLE_KEY válido en .env.",
    );
  }

  const supabaseUrl = new URL(rawUrl).origin;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Valida la firma binaria real (magic bytes) del archivo de imagen sin confiar en file.type o extensión.
 */
export function hasSupportedImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG (FF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // WebP (RIFF....WEBP)
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return true;
  }

  // AVIF / HEIC (ISO Base Media File Format: ftyp<brand>)
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
    if (ALLOWED_ISOBMFF_BRANDS.has(brand)) {
      return true;
    }
  }

  return false;
}

/**
 * Valida magic bytes, elimina metadatos EXIF, re-encodea a WebP (thumb 480px y full)
 * con nombre UUID aleatorio y devuelve la ruta relativa y dimensiones reales.
 */
export async function processAndSaveImageVariants(
  file: File,
  folder: UploadFolder,
  fullMaxWidth = 1200,
): Promise<SavedProductImageVariants> {
  if (file.size <= 0) {
    throw new Error("El archivo de imagen está vacío.");
  }

  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("La imagen supera el tamaño máximo permitido de 8 MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  if (!hasSupportedImageMagicBytes(inputBuffer)) {
    throw new Error(
      "Formato de archivo inválido. Subí una foto JPG, PNG, WebP, HEIC o AVIF.",
    );
  }

  // sharp.rotate() aplica orientación EXIF antes de descartar todos los metadatos EXIF por defecto
  const fullPipeline = sharp(inputBuffer)
    .rotate()
    .resize({ width: fullMaxWidth, withoutEnlargement: true })
    .webp({ quality: 82 });

  const thumbPipeline = sharp(inputBuffer)
    .rotate()
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 78 });

  const [{ data: fullBuffer, info: fullInfo }, thumbBuffer] = await Promise.all(
    [
      fullPipeline.toBuffer({ resolveWithObject: true }),
      thumbPipeline.toBuffer(),
    ],
  );

  if (!fullInfo.width || !fullInfo.height) {
    throw new Error("No se pudieron leer las dimensiones de la imagen.");
  }

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  const baseObjectPath = `${folder}/${year}/${month}/${uuid}`;
  const fullObjectPath = `${baseObjectPath}_full.webp`;
  const thumbObjectPath = `${baseObjectPath}_thumb.webp`;

  const storage = getSupabaseStorageClient().storage.from(
    SUPABASE_STORAGE_BUCKET,
  );

  const [fullUpload, thumbUpload] = await Promise.all([
    storage.upload(fullObjectPath, fullBuffer, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    }),
    storage.upload(thumbObjectPath, thumbBuffer, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    }),
  ]);

  if (fullUpload.error || thumbUpload.error) {
    const uploadedPaths = [
      ...(fullUpload.error ? [] : [fullObjectPath]),
      ...(thumbUpload.error ? [] : [thumbObjectPath]),
    ];
    if (uploadedPaths.length > 0) {
      await storage.remove(uploadedPaths).catch(() => undefined);
    }

    const detail =
      fullUpload.error?.message ??
      thumbUpload.error?.message ??
      "Error desconocido en Supabase Storage.";
    throw new Error(`No se pudo subir la imagen a la nube: ${detail}`);
  }

  const {
    data: { publicUrl },
  } = storage.getPublicUrl(fullObjectPath);

  return {
    relativePath: publicUrl,
    width: fullInfo.width,
    height: fullInfo.height,
    fullFilePath: fullObjectPath,
    thumbFilePath: thumbObjectPath,
  };
}

export async function processAndSaveProductImage(
  file: File,
): Promise<SavedProductImageVariants> {
  return processAndSaveImageVariants(file, "products", 1200);
}

export async function processAndSaveAvatarImage(
  file: File,
): Promise<SavedProductImageVariants> {
  return processAndSaveImageVariants(file, "avatars", 800);
}

export async function processAndSaveExpoImage(
  file: File,
): Promise<SavedProductImageVariants> {
  return processAndSaveImageVariants(file, "expos", 1600);
}

/**
 * Valida la firma binaria real (magic bytes) de videos cortos .mp4 o .webm.
 */
export function hasSupportedVideoMagicBytes(
  buffer: Buffer,
  contentType: "video/mp4" | "video/webm",
): boolean {
  if (contentType === "video/mp4") {
    if (buffer.length < 12) return false;
    if (buffer.subarray(4, 8).toString("ascii") !== "ftyp") return false;
    const brand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
    return ALLOWED_MP4_BRANDS.has(brand);
  }

  // WebM / Matroska EBML header (1A 45 DF A3)
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  );
}

export interface SignedVideoUploadResult {
  signedUrl: string;
  token: string;
  objectPath: string;
  publicUrl: string;
}

/**
 * Genera una URL firmada en Supabase Storage (`muniemprende`) para subir un video corto (.mp4/.webm, máx. 25 MB)
 * directamente desde el navegador sin pasar el archivo completo por Next.js.
 */
export async function createSignedFairVideoUploadUrl(input: {
  contentType: "video/mp4" | "video/webm";
  fileSize: number;
  headerBuffer: Buffer;
}): Promise<SignedVideoUploadResult> {
  if (input.fileSize <= 0) {
    throw new Error("El archivo de video está vacío.");
  }
  if (input.fileSize > MAX_FAIR_VIDEO_BYTES) {
    throw new Error("El video supera el tamaño máximo permitido de 25 MB.");
  }
  if (!hasSupportedVideoMagicBytes(input.headerBuffer, input.contentType)) {
    throw new Error(
      "Formato de video inválido. Subí un video MP4 (.mp4) o WebM (.webm) válido.",
    );
  }

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  const ext = input.contentType === "video/webm" ? "webm" : "mp4";
  const objectPath = `expos/videos/${year}/${month}/${uuid}.${ext}`;

  const storage = getSupabaseStorageClient().storage.from(
    SUPABASE_STORAGE_BUCKET,
  );
  const { data, error } = await storage.createSignedUploadUrl(objectPath);

  if (error || !data?.signedUrl || !data?.token) {
    throw new Error(
      `No se pudo preparar la subida del video: ${error?.message ?? "Error de Supabase Storage."}`,
    );
  }

  const {
    data: { publicUrl },
  } = storage.getPublicUrl(objectPath);

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    objectPath,
    publicUrl,
  };
}

/**
 * Verifica que una URL de video pertenezca al bucket `muniemprende` configurado bajo `expos/videos/`.
 */
export function isValidManagedFairVideoUrl(videoUrl: string): boolean {
  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!rawSupabaseUrl) return false;

  try {
    const expectedOrigin = new URL(rawSupabaseUrl).origin;
    const parsed = new URL(videoUrl.trim());
    if (parsed.origin !== expectedOrigin) return false;

    const decodedPathname = decodeURIComponent(parsed.pathname);
    if (decodedPathname.includes("..")) return false;

    const expectedPrefix = `${PUBLIC_OBJECT_PREFIX}expos/videos/`;
    if (!decodedPathname.startsWith(expectedPrefix)) return false;

    return /\.(mp4|webm)$/i.test(decodedPathname);
  } catch {
    return false;
  }
}

export async function removeStoredFairMedia(
  relativePath: string | null | undefined,
  mediaType: "IMAGE" | "VIDEO",
): Promise<void> {
  if (!relativePath) return;
  if (mediaType === "VIDEO") {
    const supabasePaths = extractSupabaseObjectPaths(relativePath);
    if (!supabasePaths || supabasePaths.length === 0) return;
    try {
      const storage = getSupabaseStorageClient().storage.from(
        SUPABASE_STORAGE_BUCKET,
      );
      const { error } = await storage.remove(supabasePaths);
      if (error) {
        console.warn(
          "[image-upload] No se pudo eliminar el video de Supabase Storage:",
          error.message,
        );
      }
    } catch (err) {
      console.warn(
        "[image-upload] Error al conectar con Supabase Storage para eliminar video:",
        err,
      );
    }
    return;
  }

  await removeStoredImageVariantsByRelativePath(relativePath);
}

/**
 * Extrae las claves de objeto dentro del bucket `muniemprende` a partir de una URL pública de Supabase.
 */
function extractSupabaseObjectPaths(storedValue: string): string[] | null {
  const trimmed = storedValue.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const decodedPathname = decodeURIComponent(parsed.pathname);
    const markerIndex = decodedPathname.indexOf(PUBLIC_OBJECT_PREFIX);
    if (markerIndex === -1) {
      return null;
    }

    const objectPath = decodedPathname
      .slice(markerIndex + PUBLIC_OBJECT_PREFIX.length)
      .replace(/^\/+/, "");

    if (!objectPath || objectPath.includes("..")) {
      return null;
    }

    if (/_(full|thumb)\.webp$/i.test(objectPath)) {
      const basePath = objectPath.replace(/_(full|thumb)\.webp$/i, "");
      return [`${basePath}_full.webp`, `${basePath}_thumb.webp`];
    }

    return [objectPath];
  } catch {
    return null;
  }
}

/**
 * Elimina las variantes WebP recién subidas si falla la persistencia en base de datos.
 */
export async function removeUploadedProductImageVariants(
  variants: Pick<SavedProductImageVariants, "fullFilePath" | "thumbFilePath">,
): Promise<void> {
  const objectPaths = [variants.fullFilePath, variants.thumbFilePath].filter(
    Boolean,
  );
  if (objectPaths.length === 0) return;

  try {
    const storage = getSupabaseStorageClient().storage.from(
      SUPABASE_STORAGE_BUCKET,
    );
    const { error } = await storage.remove(objectPaths);
    if (error) {
      console.error(
        "[image-upload] Error al revertir imágenes en Supabase Storage:",
        error.message,
      );
    }
  } catch (err) {
    console.error(
      "[image-upload] No se pudieron limpiar las imágenes recién subidas:",
      err,
    );
  }
}

/**
 * Elimina de forma segura las variantes WebP desde Supabase Storage (o disco local para registros heredados).
 */
export async function removeStoredImageVariantsByRelativePath(
  relativePath: string | null | undefined,
): Promise<void> {
  if (!relativePath) return;

  const trimmed = relativePath.trim();
  if (!trimmed) return;

  const supabasePaths = extractSupabaseObjectPaths(trimmed);
  if (supabasePaths && supabasePaths.length > 0) {
    try {
      const storage = getSupabaseStorageClient().storage.from(
        SUPABASE_STORAGE_BUCKET,
      );
      const { error } = await storage.remove(supabasePaths);
      if (error) {
        console.warn(
          "[image-upload] No se pudo eliminar de Supabase Storage (se ignora para no bloquear):",
          error.message,
        );
      }
    } catch (err) {
      console.warn(
        "[image-upload] Error al conectar con Supabase Storage para eliminar:",
        err,
      );
    }
    return;
  }

  // Si es otra URL HTTP(S) ajena al bucket configurado, no intentar operar en disco local
  if (/^https?:\/\//i.test(trimmed)) return;

  const clean = trimmed
    .replace(/^\/+|\/+$/g, "")
    .replace(/^uploads\//i, "")
    .replace(/_(full|thumb)\.webp$/i, "");

  if (!clean || clean.includes("..")) return;

  try {
    const uploadRoot = getUploadRoot();
    const fullFilePath = path.resolve(uploadRoot, `${clean}_full.webp`);
    const thumbFilePath = path.resolve(uploadRoot, `${clean}_thumb.webp`);

    if (
      !fullFilePath.startsWith(uploadRoot + path.sep) ||
      !thumbFilePath.startsWith(uploadRoot + path.sep)
    ) {
      return;
    }

    await Promise.allSettled([fs.unlink(fullFilePath), fs.unlink(thumbFilePath)]);
  } catch (err) {
    console.warn("[image-upload] No se pudo limpiar imagen local heredada:", err);
  }
}
