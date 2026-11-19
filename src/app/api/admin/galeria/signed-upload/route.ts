import { NextResponse } from "next/server";
import { z } from "zod";
import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import {
  createSignedFairVideoUploadUrl,
  MAX_FAIR_VIDEO_BYTES,
} from "@/lib/server/image-upload";

const signedVideoRequestSchema = z.object({
  contentType: z.enum(["video/mp4", "video/webm"], {
    message: "Solo se admiten videos MP4 (.mp4) o WebM (.webm).",
  }),
  fileSize: z
    .number()
    .int()
    .min(1, "El video está vacío.")
    .max(
      MAX_FAIR_VIDEO_BYTES,
      "El video supera el máximo permitido de 25 MB.",
    ),
  headerBase64: z
    .string()
    .min(8, "No pudimos verificar el formato real del video.")
    .max(256),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "No tenés permisos para subir videos." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const parsed = signedVideoRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "El video no cumple con los requisitos.",
      },
      { status: 400 },
    );
  }

  const headerBuffer = Buffer.from(parsed.data.headerBase64, "base64");

  try {
    const signed = await createSignedFairVideoUploadUrl({
      contentType: parsed.data.contentType,
      fileSize: parsed.data.fileSize,
      headerBuffer,
    });

    return NextResponse.json({
      ok: true,
      ...signed,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo preparar la subida del video.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
