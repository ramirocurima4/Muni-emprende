"use client";

import { Loader2, Upload } from "lucide-react";
import { useActionState, useRef, useState, useTransition } from "react";
import {
  createExpoPhotoAction,
  type ExpoPhotoActionState,
} from "@/app/actions/admin-gallery";
import { compressImageFileForUpload } from "@/lib/client/image-compress";
import {
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "./ui";

const initialState: ExpoPhotoActionState = {};

/** Hoy en formato YYYY-MM-DD según hora de Argentina (para sugerir la fecha de la Expo). */
function todayInArgentina(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

/**
 * Subida de fotos de la Expo para el equipo de Prensa: la foto se achica en el navegador antes de enviarla.
 * El formulario interno se remonta (key) después de cada guardado correcto, dejando todo limpio.
 */
export function ExpoUploader() {
  const [state, formAction, isPending] = useActionState(createExpoPhotoAction, initialState);

  return (
    <ExpoUploadFields
      key={state.savedAt ?? 0}
      state={state}
      formAction={formAction}
      isActionPending={isPending}
    />
  );
}

function ExpoUploadFields({
  state,
  formAction,
  isActionPending,
}: {
  state: ExpoPhotoActionState;
  formAction: (payload: FormData) => void;
  isActionPending: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [, startTransition] = useTransition();

  const fieldErrors = state.fieldErrors ?? {};
  const busy = isPreparing || isActionPending;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (!picked) return;

    setLocalError(null);
    setIsPreparing(true);
    try {
      const compressed = await compressImageFileForUpload(picked, {
        maxDimension: 1600,
        quality: 0.82,
        fileNamePrefix: "expo",
      });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      setLocalError("No pudimos leer esa foto. Probá con otra imagen.");
    } finally {
      setIsPreparing(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setLocalError("Elegí una foto de la Expo antes de guardar.");
      return;
    }
    setLocalError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("image", file);
    startTransition(() => formAction(formData));
  }

  const errorMessage = localError ?? (state.ok === false ? state.error : null);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {state.ok && state.savedAt ? null : null}

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-[#D98282] bg-[#FDF2F2] px-3.5 py-2.5 text-sm font-semibold text-[#7A1C1C]"
        >
          {errorMessage}
        </div>
      ) : null}

      <div>
        <span className={ADMIN_LABEL_CLASS}>Foto *</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Elegir foto de la Expo"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="mt-1.5 flex min-h-[170px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-brand-sky bg-brand-sky-tint/60 p-3 text-center transition-colors hover:border-brand-green hover:bg-brand-sky-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Vista previa de la foto elegida"
              className="max-h-44 w-auto rounded-xl object-contain"
            />
          ) : isPreparing ? (
            <Loader2 className="h-7 w-7 animate-spin text-brand-green" aria-hidden="true" />
          ) : (
            <>
              <Upload className="h-7 w-7 text-brand-sky-dark" aria-hidden="true" />
              <span className="text-sm font-bold text-brand-ink">
                Tocá para elegir la foto
              </span>
              <span className="text-xs text-brand-muted">
                Se achica automáticamente para que suba rápido
              </span>
            </>
          )}
        </button>
        {previewUrl ? (
          <p className="mt-1.5 text-xs font-semibold text-brand-green-dark">
            Foto lista · hacé clic sobre la imagen para cambiarla
          </p>
        ) : null}
        {fieldErrors.image?.[0] ? (
          <p className="mt-1 text-xs font-semibold text-[#9B2226]">{fieldErrors.image[0]}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="expo-date" className={ADMIN_LABEL_CLASS}>
          Fecha de la Expo *
        </label>
        <input
          id="expo-date"
          name="eventDate"
          type="date"
          defaultValue={state.values?.eventDate ?? todayInArgentina()}
          className={ADMIN_INPUT_CLASS}
        />
        {fieldErrors.eventDate?.[0] ? (
          <p className="mt-1 text-xs font-semibold text-[#9B2226]">
            {fieldErrors.eventDate[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="expo-caption" className={ADMIN_LABEL_CLASS}>
          Descripción corta *
        </label>
        <input
          id="expo-caption"
          name="caption"
          type="text"
          maxLength={200}
          defaultValue={state.values?.caption ?? ""}
          placeholder="Ej. Expo en Plaza Libertad - Domingo 15"
          className={ADMIN_INPUT_CLASS}
        />
        {fieldErrors.caption?.[0] ? (
          <p className="mt-1 text-xs font-semibold text-[#9B2226]">
            {fieldErrors.caption[0]}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button type="submit" disabled={busy} className={BTN_PRIMARY}>
          {isActionPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Subiendo...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Publicar en la portada</span>
            </>
          )}
        </button>
        <span className={`${BTN_SECONDARY} pointer-events-none !border-transparent !bg-transparent !px-0 !text-xs !font-semibold !text-brand-muted`}>
          Se muestra enseguida en la portada del sitio
        </span>
      </div>
    </form>
  );
}
