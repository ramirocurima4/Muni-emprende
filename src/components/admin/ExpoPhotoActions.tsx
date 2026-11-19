"use client";

import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  deleteFairAlbumAction,
  setFairAlbumPublishedAction,
} from "@/app/actions/admin-gallery";
import { ConfirmActionButton } from "./ConfirmActionButton";
import { BTN_DANGER, BTN_SECONDARY } from "./ui";

const COMPACT = "!min-h-[36px] !px-3 !py-1.5 !text-xs";

interface ExpoPhotoActionsProps {
  id: string;
  title: string;
  isPublished: boolean;
}

export function ExpoPhotoActions({
  id,
  title,
  isPublished,
}: ExpoPhotoActionsProps) {
  const [isToggling, startToggleTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleTogglePublish() {
    setError(null);
    startToggleTransition(async () => {
      const result = await setFairAlbumPublishedAction({
        id,
        published: !isPublished,
      });
      if (!result.ok) {
        setError(result.error ?? "No se pudo cambiar la visibilidad.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isToggling}
          onClick={handleTogglePublish}
          className={`${BTN_SECONDARY} ${COMPACT} flex-1`}
        >
          {isToggling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : isPublished ? (
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>{isPublished ? "Ocultar" : "Mostrar en portada"}</span>
        </button>

        <ConfirmActionButton
          triggerClassName={`${BTN_DANGER} ${COMPACT}`}
          triggerLabel={`Eliminar crónica ${title}`}
          trigger={
            <>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Eliminar</span>
            </>
          }
          title="Eliminar crónica de feria"
          description={`¿Seguro querés borrar "${title}"? Se quita de la portada y se eliminan sus fotos y video del almacenamiento.`}
          confirmLabel="Sí, eliminar crónica"
          confirmClassName="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#B91C1C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#991B1B] disabled:opacity-60"
          onConfirm={() => deleteFairAlbumAction({ id })}
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs font-semibold text-[#9B2226]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
