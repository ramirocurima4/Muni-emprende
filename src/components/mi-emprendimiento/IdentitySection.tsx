"use client";

import {
  Camera,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Store,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { compressImageFileForUpload } from "@/lib/client/image-compress";
import type { PanelEntrepreneurProfile } from "@/lib/server/entrepreneur-panel";
import { updateEntrepreneurProfileSchema } from "@/lib/validations/product";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

interface IdentitySectionProps {
  profile: PanelEntrepreneurProfile;
  onProfileUpdated: (nextProfile: PanelEntrepreneurProfile) => void;
}

const LABEL_CLASS = "block text-sm font-bold text-brand-ink";
const INPUT_CLASS =
  "mt-1.5 min-h-[48px] w-full rounded-2xl border border-brand-sky/40 bg-[#FDFBF7] px-4 py-3 text-base text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/25";

export function IdentitySection({
  profile,
  onProfileUpdated,
}: IdentitySectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber);
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isSavingText, setIsSavingText] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const normalizedPhone = normalizeWhatsappNumber(whatsappNumber);
  const hasValidWhatsapp = /^549\d{10,11}$/.test(normalizedPhone);

  const accountBadge = {
    APPROVED: {
      label: "Vidriera activa",
      classes: "bg-brand-green-soft text-brand-green-dark border-brand-green/25",
      dot: "bg-brand-green",
    },
    PENDING: {
      label: "En revisión",
      classes: "bg-[#FEF3DC] text-[#8A4F00] border-[#F5A623]/50",
      dot: "bg-[#D97706]",
    },
    REJECTED: {
      label: "Necesita cambios",
      classes: "bg-[#FDF2F2] text-[#7A1C1C] border-[#D98282]",
      dot: "bg-[#B91C1C]",
    },
    SUSPENDED: {
      label: "Suspendida",
      classes: "bg-[#FDF2F2] text-[#7A1C1C] border-[#D98282]",
      dot: "bg-[#B91C1C]",
    },
  }[profile.status];

  async function handleAvatarFileSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setAvatarMessage(null);
    setIsUploadingAvatar(true);

    const previousAvatarUrl = avatarUrl;
    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarUrl(localPreviewUrl);

    try {
      const compressedFile = await compressImageFileForUpload(file, {
        maxDimension: 800,
        quality: 0.82,
        fileNamePrefix: "logo-emprendimiento",
      });

      const body = new FormData();
      body.set("avatarOnly", "true");
      body.set("avatar", compressedFile);

      const response = await fetch("/api/mi-emprendimiento/perfil", {
        method: "PATCH",
        body,
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "No pudimos subir tu imagen. Probá con otra foto.",
        );
      }

      const nextAvatarUrl: string | null = data.profile?.avatarUrl ?? null;
      setAvatarUrl(nextAvatarUrl);
      onProfileUpdated({
        ...profile,
        avatarUrl: nextAvatarUrl,
      });
      setAvatarMessage({
        type: "success",
        text: "¡Listo! Ya guardamos la imagen de tu emprendimiento.",
      });
    } catch (err) {
      setAvatarUrl(previousAvatarUrl);
      setAvatarMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "No pudimos guardar la imagen. Intentá de nuevo.",
      });
    } finally {
      URL.revokeObjectURL(localPreviewUrl);
      setIsUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    if (isUploadingAvatar) return;
    setAvatarMessage(null);
    setIsUploadingAvatar(true);

    try {
      const body = new FormData();
      body.set("avatarOnly", "true");
      body.set("removeAvatar", "true");

      const response = await fetch("/api/mi-emprendimiento/perfil", {
        method: "PATCH",
        body,
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "No pudimos quitar la foto.");
      }

      setAvatarUrl(null);
      onProfileUpdated({
        ...profile,
        avatarUrl: null,
      });
      setAvatarMessage({
        type: "success",
        text: "Quitamos la foto anterior.",
      });
    } catch (err) {
      setAvatarMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "No pudimos quitar la foto en este momento.",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);
    setFieldErrors({});

    const parsed = updateEntrepreneurProfileSchema.safeParse({
      businessName,
      whatsappNumber,
      neighborhood,
      bio,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      setFormMessage({
        type: "error",
        text: "Revisá los campos marcados antes de guardar.",
      });
      return;
    }

    setIsSavingText(true);
    try {
      const body = new FormData();
      body.set("businessName", parsed.data.businessName);
      body.set("whatsappNumber", parsed.data.whatsappNumber);
      body.set("neighborhood", parsed.data.neighborhood ?? "");
      body.set("bio", parsed.data.bio ?? "");

      const response = await fetch("/api/mi-emprendimiento/perfil", {
        method: "PATCH",
        body,
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        throw new Error(
          data.error ?? "No pudimos guardar los cambios de tu vidriera.",
        );
      }

      const updated: PanelEntrepreneurProfile = {
        ...profile,
        businessName: data.profile.businessName,
        whatsappNumber: data.profile.whatsappNumber,
        neighborhood: data.profile.neighborhood,
        bio: data.profile.bio,
        avatarUrl: data.profile.avatarUrl,
        status: data.profile.status,
        rejectionReason: data.profile.rejectionReason,
      };

      setBusinessName(updated.businessName);
      setWhatsappNumber(updated.whatsappNumber);
      setNeighborhood(updated.neighborhood);
      setBio(updated.bio);
      onProfileUpdated(updated);

      setFormMessage({
        type: "success",
        text: "¡Listo! Guardamos los datos de tu emprendimiento.",
      });
    } catch (err) {
      setFormMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Ocurrió un problema al guardar. Probá de nuevo.",
      });
    } finally {
      setIsSavingText(false);
    }
  }

  return (
    <section
      aria-labelledby="identidad-heading"
      className="rounded-[28px] border border-brand-sky/30 bg-white p-5 shadow-xl shadow-brand-sky/10 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="identidad-heading"
            className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl"
          >
            Identidad de mi Emprendimiento
          </h2>
          <p className="mt-1 text-sm text-brand-muted">
            Así te van a encontrar y contactar los vecinos de San Roque.
          </p>
        </div>

        <span
          role="status"
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold ${accountBadge.classes}`}
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${accountBadge.dot}`}
          />
          {accountBadge.label}
        </span>
      </div>

      {profile.status === "PENDING" ? (
        <div className="mt-4 rounded-2xl border border-[#F5A623]/45 bg-[#FEF3DC] px-4 py-3 text-sm leading-relaxed text-[#78350F]">
          El equipo de la Muni está revisando tus datos para habilitar tu
          vidriera en el catálogo. Mientras tanto, ya podés completar tu perfil
          y cargar tus productos.
        </div>
      ) : null}

      {profile.status === "REJECTED" && profile.rejectionReason ? (
        <div className="mt-4 rounded-2xl border border-[#D98282] bg-[#FDF2F2] px-4 py-3 text-sm leading-relaxed text-[#7A1C1C]">
          <strong>Observación de la Muni:</strong> {profile.rejectionReason}.
          Corregí tus datos abajo y guardá para volver a enviarlo.
        </div>
      ) : null}

      {/* Bloque Logo / Foto del puesto */}
      <div className="mt-5 rounded-3xl border border-brand-sky/30 bg-[#E8F1F8]/70 p-4 sm:p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-2 border-white bg-white shadow-md">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`Logo o foto de ${businessName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-[#EDF4FC] text-brand-sky-dark">
                <Store className="h-9 w-9" strokeWidth={1.75} aria-hidden="true" />
                <span className="mt-1 text-[11px] font-bold">Tu vidriera</span>
              </div>
            )}

            {isUploadingAvatar ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <Loader2
                  className="h-7 w-7 animate-spin text-brand-green"
                  aria-label="Subiendo imagen"
                />
              </div>
            ) : null}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-bold text-brand-ink">
              Logo de tu marca o foto del puesto
            </p>
            <p className="mt-1 text-sm leading-relaxed text-brand-muted">
              Podés subir tu logo, una imagen creada con IA o una foto de tus
              productos
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileSelected}
              className="sr-only"
              aria-label="Elegir logo o foto del emprendimiento"
            />

            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:opacity-60"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isUploadingAvatar
                    ? "Subiendo foto..."
                    : avatarUrl
                      ? "Cambiar foto o logo"
                      : "Subir foto o logo"}
                </span>
              </button>

              {avatarUrl ? (
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={handleRemoveAvatar}
                  className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl border border-brand-sky/40 bg-white px-3.5 py-2.5 text-sm font-semibold text-brand-muted transition-colors hover:border-[#D98282] hover:bg-[#FDF2F2] hover:text-[#7A1C1C] disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>Quitar</span>
                </button>
              ) : null}
            </div>

            {avatarMessage ? (
              <p
                role={avatarMessage.type === "error" ? "alert" : "status"}
                className={`mt-2.5 text-xs font-bold ${
                  avatarMessage.type === "success"
                    ? "text-brand-green-dark"
                    : "text-[#9B2226]"
                }`}
              >
                {avatarMessage.text}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Formulario de edición rápida */}
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="identity-businessName" className={LABEL_CLASS}>
            Nombre del Emprendimiento *
          </label>
          <input
            id="identity-businessName"
            name="businessName"
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Ej: Panificados Doña Rosa"
            className={INPUT_CLASS}
          />
          {fieldErrors.businessName?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#9B2226]">
              {fieldErrors.businessName[0]}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="identity-whatsapp" className={LABEL_CLASS}>
              WhatsApp de ventas *
            </label>
            {hasValidWhatsapp ? (
              <a
                href={`https://wa.me/${normalizedPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-brand-green-soft px-2.5 py-1 text-xs font-bold text-brand-green-dark transition-colors hover:bg-brand-green-sage/60"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Probar mi WhatsApp</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : null}
          </div>
          <input
            id="identity-whatsapp"
            name="whatsappNumber"
            type="tel"
            inputMode="tel"
            required
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="Ej: 3777 554433"
            className={INPUT_CLASS}
          />
          <p className="mt-1 text-xs text-brand-muted">
            Obligatorio: acá te van a escribir los vecinos para comprarte.
          </p>
          {fieldErrors.whatsappNumber?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#9B2226]">
              {fieldErrors.whatsappNumber[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="identity-neighborhood" className={LABEL_CLASS}>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand-sky-dark" aria-hidden="true" />
              <span>Barrio o Zona</span>
            </span>
          </label>
          <input
            id="identity-neighborhood"
            name="neighborhood"
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Ej: Barrio Centro, San Roque"
            className={INPUT_CLASS}
          />
          {fieldErrors.neighborhood?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#9B2226]">
              {fieldErrors.neighborhood[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="identity-bio" className={LABEL_CLASS}>
            Descripción breve
          </label>
          <textarea
            id="identity-bio"
            name="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Contá en pocas palabras qué hacés, qué vendés o en qué días y horarios entregás."
            className={INPUT_CLASS}
          />
          {fieldErrors.bio?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#9B2226]">
              {fieldErrors.bio[0]}
            </p>
          ) : null}
        </div>

        {formMessage ? (
          <div
            role={formMessage.type === "error" ? "alert" : "status"}
            className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-bold ${
              formMessage.type === "success"
                ? "border-brand-green/30 bg-brand-green-soft text-brand-green-dark"
                : "border-[#D98282] bg-[#FDF2F2] text-[#7A1C1C]"
            }`}
          >
            {formMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            ) : null}
            <span>{formMessage.text}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSavingText}
          className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-3.5 text-base font-extrabold text-white shadow-lg shadow-brand-green/20 transition-colors hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:opacity-65"
        >
          {isSavingText ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>Guardando cambios...</span>
            </>
          ) : (
            <span>Guardar datos de mi emprendimiento</span>
          )}
        </button>
      </form>
    </section>
  );
}
