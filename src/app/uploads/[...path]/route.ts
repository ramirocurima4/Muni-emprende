import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const SAFE_SEGMENT_REGEX = /^[a-zA-Z0-9._-]+$/;

/**
 * Route Handler para servir imágenes WebP desde UPLOAD_DIR en entorno de desarrollo.
 * En producción, Nginx sirve /uploads/* directamente desde el sistema de archivos.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;

  if (!segments || segments.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  for (const segment of segments) {
    if (
      !segment ||
      segment === "." ||
      segment === ".." ||
      !SAFE_SEGMENT_REGEX.test(segment)
    ) {
      return new NextResponse("Bad Request", { status: 400 });
    }
  }

  const lastSegment = segments[segments.length - 1];
  if (!lastSegment.endsWith(".webp")) {
    return new NextResponse("Unsupported Media Type", { status: 415 });
  }

  const uploadRoot = path.resolve(
    process.cwd(),
    process.env.UPLOAD_DIR ?? "./storage/uploads",
  );
  const resolvedFile = path.resolve(uploadRoot, ...segments);

  if (!resolvedFile.startsWith(uploadRoot + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const fileBuffer = await fs.readFile(resolvedFile);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
