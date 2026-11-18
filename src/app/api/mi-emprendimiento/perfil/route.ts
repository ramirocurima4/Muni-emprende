import { AuditEntityType, EntrepreneurStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUploadImageUrl } from "@/lib/images";
import {
  PanelAuthError,
  requireAuthenticatedEntrepreneur,
  revalidateEntrepreneurAndCatalogSurfaces,
} from "@/lib/server/entrepreneur-panel";
import {
  processAndSaveAvatarImage,
  removeStoredImageVariantsByRelativePath,
  removeUploadedProductImageVariants,
  type SavedProductImageVariants,
} from "@/lib/server/image-upload";
import { updateEntrepreneurProfileSchema } from "@/lib/validations/product";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

export async function PATCH(request: Request) {
  let context: Awaited<ReturnType<typeof requireAuthenticatedEntrepreneur>>;
  try {
    context = await requireAuthenticatedEntrepreneur();
  } catch (err) {
    if (err instanceof PanelAuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: "No pudimos verificar tu sesión." },
      { status: 401 },
    );
  }

  const { entrepreneur, session } = context;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Formato de solicitud inválido." },
      { status: 400 },
    );
  }

  const avatarOnly = String(formData.get("avatarOnly") ?? "") === "true";
  const removeAvatar = String(formData.get("removeAvatar") ?? "") === "true";
  const rawAvatar = formData.get("avatar");
  const hasAvatarFile = rawAvatar instanceof File && rawAvatar.size > 0;

  let validatedText: {
    businessName: string;
    whatsappNumber: string;
    neighborhood: string | null;
    bio: string | null;
  } | null = null;

  if (!avatarOnly) {
    const parsed = updateEntrepreneurProfileSchema.safeParse({
      businessName: String(formData.get("businessName") ?? ""),
      whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
      neighborhood: String(formData.get("neighborhood") ?? ""),
      bio: String(formData.get("bio") ?? ""),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Revisá los datos marcados antes de guardar.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    validatedText = {
      businessName: parsed.data.businessName,
      whatsappNumber: normalizeWhatsappNumber(parsed.data.whatsappNumber),
      neighborhood: parsed.data.neighborhood,
      bio: parsed.data.bio,
    };
  }

  if (avatarOnly && !hasAvatarFile && !removeAvatar) {
    return NextResponse.json(
      { ok: false, error: "Elegí una imagen para actualizar tu logo o foto." },
      { status: 400 },
    );
  }

  let savedAvatar: SavedProductImageVariants | null = null;
  if (hasAvatarFile) {
    try {
      savedAvatar = await processAndSaveAvatarImage(rawAvatar);
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : "No pudimos procesar la imagen elegida.",
        },
        { status: 400 },
      );
    }
  }

  const previousAvatarPath = entrepreneur.avatarPath;
  const nextAvatarPath = savedAvatar
    ? savedAvatar.relativePath
    : removeAvatar
      ? null
      : previousAvatarPath;

  const shouldResetRejected =
    !avatarOnly && entrepreneur.status === EntrepreneurStatus.REJECTED;

  try {
    const updated = await db.$transaction(async (tx) => {
      const record = await tx.entrepreneur.update({
        where: { id: entrepreneur.id },
        data: {
          ...(validatedText
            ? {
                businessName: validatedText.businessName,
                whatsappNumber: validatedText.whatsappNumber,
                neighborhood: validatedText.neighborhood,
                bio: validatedText.bio,
              }
            : {}),
          ...(savedAvatar || removeAvatar ? { avatarPath: nextAvatarPath } : {}),
          ...(shouldResetRejected
            ? {
                status: EntrepreneurStatus.PENDING,
                rejectionReason: null,
              }
            : {}),
        },
        select: {
          id: true,
          businessName: true,
          slug: true,
          ownerName: true,
          whatsappNumber: true,
          neighborhood: true,
          bio: true,
          avatarPath: true,
          status: true,
          rejectionReason: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          entityType: AuditEntityType.ENTREPRENEUR,
          entityId: entrepreneur.id,
          action: "UPDATE_ENTREPRENEUR_PROFILE",
          metadata: {
            businessName: record.businessName,
            whatsappNumber: record.whatsappNumber,
            avatarUpdated: Boolean(savedAvatar || removeAvatar),
            avatarOnly,
            note: avatarOnly
              ? "Actualización de logo/foto del emprendimiento."
              : "Actualización de identidad del emprendimiento desde /mi-emprendimiento.",
          },
        },
      });

      return record;
    });

    if (
      (savedAvatar || removeAvatar) &&
      previousAvatarPath &&
      previousAvatarPath !== updated.avatarPath
    ) {
      await removeStoredImageVariantsByRelativePath(previousAvatarPath);
    }

    revalidateEntrepreneurAndCatalogSurfaces();

    return NextResponse.json({
      ok: true,
      profile: {
        id: updated.id,
        businessName: updated.businessName,
        slug: updated.slug,
        ownerName: updated.ownerName,
        whatsappNumber: updated.whatsappNumber,
        neighborhood: updated.neighborhood ?? "",
        bio: updated.bio ?? "",
        avatarUrl: updated.avatarPath
          ? getUploadImageUrl(updated.avatarPath, "thumb")
          : null,
        status: updated.status,
        rejectionReason: updated.rejectionReason,
      },
    });
  } catch {
    if (savedAvatar) {
      await removeUploadedProductImageVariants(savedAvatar);
    }
    return NextResponse.json(
      {
        ok: false,
        error:
          "No pudimos guardar los cambios en este momento. Probá de nuevo en unos segundos.",
      },
      { status: 500 },
    );
  }
}
