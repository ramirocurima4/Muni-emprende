"use client";

import {
  CheckCircle2,
  Film,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { compressImageFileForUpload } from "@/lib/client/image-compress";
import {
  FAIR_META,
  FAIR_TYPES,
  PRESET_FAIR_LOCATIONS,
  type FairTypeKey,
} from "@/lib/fairs";
import {
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  BTN_PRIMARY,
} from "./ui";

const MAX_PHOTOS = 8;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB

interface StagedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

/** Hoy en formato YYYY-MM-DD según hora de Argentina. */
function todayInArgentina(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

async function readFileHeaderBase64(file: File, length = 32): Promise<string> {
  const slice = await file.slice(0, length).arrayBuffer();
  const bytes = new Uint8Array(slice);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function resolveVideoMimeType(file: File): "video/mp4" | "video/webm" | null {
  const lowerName = file.name.toLowerCase();
  if (file.type === "video/mp4" || lowerName.endsWith(".mp4")) {
    return "video/mp4";
  }
  if (file.type === "video/webm" || lowerName.endsWith(".webm")) {
    return "video/webm";
  }
  return null;
}

function uploadFileViaPutWithProgress(
  signedUrl: string,
  file: File,
  contentType: "video/mp4" | "video/webm",
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error("No se pudo subir el video al almacenamiento."));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Error de red al subir el video."));
    };

    xhr.send(file);
  });
}

/**
 * Formulario de Prensa para publicar crónicas multi-foto y/o video corto (.mp4 / .webm, máx. 25 MB)
 * separadas por Expo Emprendedores vs Mercado Sanroqueño.
 */
export function ExpoUploader() {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [fairType, setFairType] = useState<FairTypeKey>("EXPO_EMPRENDEDORES");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(todayInArgentina);
  const [location, setLocation] = useState<string>("Plaza Libertad");
  const [description, setDescription] = useState("");

  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const busy = isPreparingPhotos || isSubmitting;

  async function handlePhotosChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const pickedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (pickedFiles.length === 0) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setError(`Podés subir hasta ${MAX_PHOTOS} fotos por crónica.`);
      return;
    }

    const toProcess = pickedFiles.slice(0, remainingSlots);
    setError(null);
    setSuccessMessage(null);
    setIsPreparingPhotos(true);

    try {
      const compressedList: StagedPhoto[] = [];
      for (const picked of toProcess) {
        const compressed = await compressImageFileForUpload(picked, {
          maxDimension: 1600,
          quality: 0.82,
          fileNamePrefix: "cronica",
        });
        compressedList.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
        });
      }
      setPhotos((prev) => [...prev, ...compressedList]);
      if (pickedFiles.length > remainingSlots) {
        setError(
          `Se agregaron ${remainingSlots} fotos (máximo ${MAX_PHOTOS} por crónica).`,
        );
      }
    } catch {
      setError("No pudimos procesar alguna de las fotos elegidas.");
    } finally {
      setIsPreparingPhotos(false);
    }
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function handleVideoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;

    setError(null);
    setSuccessMessage(null);

    const mimeType = resolveVideoMimeType(picked);
    if (!mimeType) {
      setError("El video debe ser formato .mp4 o .webm.");
      return;
    }

    if (picked.size > MAX_VIDEO_BYTES) {
      setError("El video supera el tamaño máximo de 25 MB.");
      return;
    }

    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(picked);
    setVideoPreviewUrl(URL.createObjectURL(picked));
  }

  function removeVideo() {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoProgress(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    if (photos.length === 0 && !videoFile) {
      setError("Subí al menos una foto o un video corto para publicar la crónica.");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedVideoUrl = "";

      if (videoFile) {
        const contentType = resolveVideoMimeType(videoFile);
        if (!contentType) {
          throw new Error("El video debe ser formato .mp4 o .webm.");
        }
        const headerBase64 = await readFileHeaderBase64(videoFile, 32);

        const signRes = await fetch("/api/admin/galeria/signed-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType,
            fileSize: videoFile.size,
            headerBase64,
          }),
        });
        const signJson = (await signRes.json()) as {
          ok: boolean;
          error?: string;
          signedUrl?: string;
          publicUrl?: string;
        };

        if (!signRes.ok || !signJson.ok || !signJson.signedUrl || !signJson.publicUrl) {
          throw new Error(
            signJson.error ?? "No se pudo autorizar la subida del video.",
          );
        }

        setVideoProgress(0);
        await uploadFileViaPutWithProgress(
          signJson.signedUrl,
          videoFile,
          contentType,
          setVideoProgress,
        );
        uploadedVideoUrl = signJson.publicUrl;
      }

      const payload = new FormData();
      payload.set("fairType", fairType);
      payload.set("title", title);
      payload.set("eventDate", eventDate);
      payload.set("location", location);
      payload.set("description", description);
      if (uploadedVideoUrl) {
        payload.set("videoUrl", uploadedVideoUrl);
      }
      for (const photo of photos) {
        payload.append("images", photo.file);
      }

      const res = await fetch("/api/admin/galeria/albums", {
        method: "POST",
        body: payload,
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        fieldErrors?: Record<string, string[] | undefined>;
      };

      if (!res.ok || !data.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        throw new Error(data.error ?? "No se pudo publicar la crónica.");
      }

      // Limpiar estado tras publicar con éxito
      for (const p of photos) URL.revokeObjectURL(p.previewUrl);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setPhotos([]);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setVideoProgress(null);
      setTitle("");
      setDescription("");
      setSuccessMessage(
        `¡Crónica publicada en ${FAIR_META[fairType].label}! Ya se ve en la portada.`,
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos publicar la crónica. Intentá de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-[#D98282] bg-[#FDF2F2] px-3.5 py-2.5 text-sm font-semibold text-[#7A1C1C]"
        >
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-brand-green/35 bg-brand-green-soft px-3.5 py-2.5 text-xs font-bold text-brand-green-dark"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {/* Selector de feria */}
      <div>
        <span className={ADMIN_LABEL_CLASS}>Feria *</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {FAIR_TYPES.map((key) => {
            const selected = fairType === key;
            return (
              <button
                key={key}
                type="button"
                disabled={busy}
                onClick={() => setFairType(key)}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs font-extrabold transition-all ${
                  selected
                    ? "border-brand-green bg-brand-green text-white shadow-sm"
                    : "border-brand-sky/45 bg-brand-sky-tint/50 text-brand-ink hover:bg-brand-sky-light"
                }`}
              >
                {FAIR_META[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Título de la crónica */}
      <div>
        <label htmlFor="album-title" className={ADMIN_LABEL_CLASS}>
          Título de la crónica *
        </label>
        <input
          id="album-title"
          name="title"
          type="text"
          maxLength={140}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Expo en el Balneario - Domingo 15"
          className={ADMIN_INPUT_CLASS}
        />
        {fieldErrors.title?.[0] ? (
          <p className="mt-1 text-xs font-semibold text-[#9B2226]">
            {fieldErrors.title[0]}
          </p>
        ) : null}
      </div>

      {/* Fecha y Ubicación */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="album-date" className={ADMIN_LABEL_CLASS}>
            Fecha del encuentro *
          </label>
          <input
            id="album-date"
            name="eventDate"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={ADMIN_INPUT_CLASS}
          />
          {fieldErrors.eventDate?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#9B2226]">
              {fieldErrors.eventDate[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="album-location" className={ADMIN_LABEL_CLASS}>
            Ubicación *
          </label>
          <input
            id="album-location"
            name="location"
            type="text"
            maxLength={120}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ej. Plaza Libertad"
            className={ADMIN_INPUT_CLASS}
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PRESET_FAIR_LOCATIONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLocation(preset)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                  location.trim() === preset
                    ? "bg-brand-green text-white"
                    : "border border-brand-sky/45 bg-white text-brand-sky-dark hover:bg-brand-sky-light"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          {fieldErrors.location?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#9B2226]">
              {fieldErrors.location[0]}
            </p>
          ) : null}
        </div>
      </div>

      {/* Descripción corta */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="album-description" className={ADMIN_LABEL_CLASS}>
            Descripción corta (2-3 renglones, opcional)
          </label>
          <span className="text-[11px] text-brand-muted">
            {description.length}/320
          </span>
        </div>
        <textarea
          id="album-description"
          name="description"
          rows={2}
          maxLength={320}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Resumen breve de la jornada, stands o productores que participaron..."
          className={ADMIN_INPUT_CLASS}
        />
        {fieldErrors.description?.[0] ? (
          <p className="mt-1 text-xs font-semibold text-[#9B2226]">
            {fieldErrors.description[0]}
          </p>
        ) : null}
      </div>

      {/* Fotos múltiples */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={ADMIN_LABEL_CLASS}>
            Fotos de la crónica (hasta {MAX_PHOTOS})
          </span>
          <span className="text-xs font-bold text-brand-sky-dark">
            {photos.length}/{MAX_PHOTOS}
          </span>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotosChange}
          className="sr-only"
          aria-label="Agregar fotos a la crónica"
        />

        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {photos.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-brand-sky/35 bg-brand-sky-tint"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removePhoto(item.id)}
                  aria-label="Quitar foto"
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-[#B91C1C]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {photos.length < MAX_PHOTOS ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => photoInputRef.current?.click()}
            className="flex min-h-[96px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-brand-sky bg-brand-sky-tint/60 p-3 text-center transition-colors hover:border-brand-green hover:bg-brand-sky-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
          >
            {isPreparingPhotos ? (
              <Loader2 className="h-6 w-6 animate-spin text-brand-green" aria-hidden="true" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-brand-sky-dark" aria-hidden="true" />
                <span className="text-xs font-bold text-brand-ink">
                  {photos.length > 0
                    ? "Agregar más fotos"
                    : "Tocá para elegir una o varias fotos"}
                </span>
                <span className="text-[11px] text-brand-muted">
                  Se optimizan automáticamente a WebP sin EXIF
                </span>
              </>
            )}
          </button>
        ) : null}
      </div>

      {/* Video corto opcional */}
      <div className="space-y-2">
        <span className={ADMIN_LABEL_CLASS}>
          Video corto (opcional · .mp4 / .webm · máx. 25 MB)
        </span>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,.mp4,.webm"
          onChange={handleVideoChange}
          className="sr-only"
          aria-label="Elegir video corto"
        />

        {videoFile && videoPreviewUrl ? (
          <div className="space-y-2 rounded-2xl border border-brand-sky/40 bg-brand-sky-tint/50 p-3">
            <video
              src={videoPreviewUrl}
              controls
              playsInline
              className="max-h-48 w-full rounded-xl bg-black"
            />
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-semibold text-brand-ink">
                {videoFile.name} (
                {(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={removeVideo}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-[#9B2226] hover:bg-[#FDF2F2]"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Quitar video
              </button>
            </div>
            {videoProgress !== null ? (
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-brand-green transition-all"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
                <p className="text-[11px] font-bold text-brand-green-dark">
                  Subiendo video directo a Supabase: {videoProgress}%
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => videoInputRef.current?.click()}
            className="flex min-h-[76px] w-full items-center justify-center gap-2.5 rounded-2xl border border-dashed border-brand-sky/70 bg-white px-4 py-3 text-left transition-colors hover:border-brand-green hover:bg-brand-sky-tint/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
          >
            <Film className="h-5 w-5 shrink-0 text-brand-sky-dark" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-brand-ink">
                Agregar un video corto de la feria
              </p>
              <p className="text-[11px] text-brand-muted">
                Se sube directo al bucket muniemprende (.mp4 o .webm, hasta 25 MB)
              </p>
            </div>
          </button>
        )}
        {fieldErrors.media?.[0] ? (
          <p className="text-xs font-semibold text-[#9B2226]">
            {fieldErrors.media[0]}
          </p>
        ) : null}
      </div>

      <div className="pt-1">
        <button type="submit" disabled={busy} className={`${BTN_PRIMARY} w-full`}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>
                {videoProgress !== null && videoProgress < 100
                  ? `Subiendo video (${videoProgress}%)...`
                  : "Publicando crónica..."}
              </span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Publicar crónica en la portada</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
