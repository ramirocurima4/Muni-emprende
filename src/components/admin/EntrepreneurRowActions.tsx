"use client";

import { Ban, RotateCcw, ShieldCheck, ShieldOff } from "lucide-react";
import {
  setEntrepreneurStatusAction,
  setEntrepreneurTrustAction,
} from "@/app/actions/admin-entrepreneurs";
import { ConfirmActionButton } from "./ConfirmActionButton";
import { ResetPasswordButton } from "./ResetPasswordButton";
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY } from "./ui";

const SMALL = "!min-h-[34px] !px-2.5 !py-1 !text-xs";

interface EntrepreneurRowActionsProps {
  entrepreneurId: string;
  userId: string;
  businessName: string;
  username: string;
  trusted: boolean;
  suspended: boolean;
}

export function EntrepreneurRowActions({
  entrepreneurId,
  userId,
  businessName,
  username,
  trusted,
  suspended,
}: EntrepreneurRowActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ConfirmActionButton
        triggerClassName={`${BTN_SECONDARY} ${SMALL}`}
        triggerLabel={
          trusted
            ? `Pedir revisión previa a ${businessName}`
            : `Dar publicación directa a ${businessName}`
        }
        trigger={
          <>
            {trusted ? (
              <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{trusted ? "Pedir revisión" : "Dar confianza"}</span>
          </>
        }
        title={trusted ? "Volver a pedir revisión previa" : "Dar publicación directa"}
        description={
          trusted
            ? `Los productos nuevos o editados de ${businessName} van a volver a pasar por revisión de la Muni antes de aparecer en el catálogo.`
            : `Los productos de ${businessName} se van a publicar directo en el catálogo, sin revisión previa. Usalo con emprendedores de confianza.`
        }
        confirmLabel={trusted ? "Sí, pedir revisión previa" : "Sí, publicar directo"}
        confirmClassName={BTN_PRIMARY}
        onConfirm={() =>
          setEntrepreneurTrustAction({ entrepreneurId, trusted: !trusted })
        }
      />

      <ResetPasswordButton
        userId={userId}
        username={username}
        compact
        className={`${BTN_SECONDARY} ${SMALL}`}
      />

      {suspended ? (
        <ConfirmActionButton
          triggerClassName={`${BTN_SECONDARY} ${SMALL}`}
          triggerLabel={`Reactivar ${businessName}`}
          trigger={
            <>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reactivar</span>
            </>
          }
          title="Reactivar emprendimiento"
          description={`${businessName} vuelve a estar activo y sus productos aprobados se muestran de nuevo en el catálogo.`}
          confirmLabel="Sí, reactivar"
          confirmClassName={BTN_PRIMARY}
          onConfirm={() =>
            setEntrepreneurStatusAction({ entrepreneurId, action: "reactivate" })
          }
        />
      ) : (
        <ConfirmActionButton
          triggerClassName={`${BTN_DANGER} ${SMALL}`}
          triggerLabel={`Suspender ${businessName}`}
          trigger={
            <>
              <Ban className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Suspender</span>
            </>
          }
          title="Suspender emprendimiento"
          description={`Se ocultan todos los productos de ${businessName} y no podrá ingresar a su panel hasta que lo reactives.`}
          reason={{
            label: "Motivo de la suspensión",
            placeholder: "Ej. Denuncia de vecinos, datos falsos, pedido del emprendedor...",
            minLength: 5,
          }}
          confirmLabel="Sí, suspender"
          confirmClassName="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#B91C1C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#991B1B] disabled:opacity-60"
          onConfirm={(reason) =>
            setEntrepreneurStatusAction({ entrepreneurId, action: "suspend", reason })
          }
        />
      )}
    </div>
  );
}
