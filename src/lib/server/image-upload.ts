import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { MAX_PRODUCT_IMAGE_BYTES } from "@/lib/validations/product";

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
  const relativePath = `${folder}/${year}/${month}/${uuid}`;

  const uploadRoot = getUploadRoot();
  const fullFilePath = path.join(uploadRoot, `${relativePath}_full.webp`);
  const thumbFilePath = path.join(uploadRoot, `${relativePath}_thumb.webp`);

  await fs.mkdir(path.dirname(fullFilePath), { recursive: true });

  await Promise.all([
    fs.writeFile(fullFilePath, fullBuffer),
    fs.writeFile(thumbFilePath, thumbBuffer),
  ]);

  return {
    relativePath,
    width: fullInfo.width,
    height: fullInfo.height,
    fullFilePath,
    thumbFilePath,
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
 * Elimina las variantes WebP generadas si falla la persistencia en base de datos.
 */
export async function removeUploadedProductImageVariants(
  variants: Pick<SavedProductImageVariants, "fullFilePath" | "thumbFilePath">,
): Promise<void> {
  await Promise.allSettled([
    fs.unlink(variants.fullFilePath),
    fs.unlink(variants.thumbFilePath),
  ]);
}

/**
 * Elimina de forma segura las variantes WebP de una ruta relativa almacenada en DB.
 */
export async function removeStoredImageVariantsByRelativePath(
  relativePath: string | null | undefined,
): Promise<void> {
  if (!relativePath) return;

  const clean = relativePath.replace(/^\/+|\/+$/g, "");
  if (!clean || clean.includes("..")) return;

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
}
