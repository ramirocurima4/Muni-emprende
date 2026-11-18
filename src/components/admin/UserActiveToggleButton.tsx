"use client";

import { Ban, RotateCcw } from "lucide-react";
import { setUserActiveAction } from "@/app/actions/admin-users";
import { ConfirmActionButton } from "./ConfirmActionButton";
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY } from "./ui";

const COMPACT = "!min-h-[34px] !px-2.5 !py-1 !text-xs";

interface UserActiveToggleButtonProps {
  userId: string;
  username: string;
  isActive: boolean;
  isSelf: boolean;
}

export function UserActiveToggleButton({
  userId,
  username,
  isActive,
  isSelf,
}: UserActiveToggleButtonProps) {
  if (isSelf) {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-sky-light px-2.5 py-1 text-[11px] font-bold text-brand-sky-dark">
        Tu cuenta
      </span>
    );
  }

  return isActive ? (
    <ConfirmActionButton
      triggerClassName={`${BTN_DANGER} ${COMPACT}`}
      triggerLabel={`Quitar acceso a @${username}`}
      trigger={
        <>
          <Ban className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Quitar acceso</span>
        </>
      }
      title={`Quitar acceso a @${username}`}
      description={`@${username} no podrá volver a entrar al panel hasta que habilites su cuenta otra vez.`}
      confirmLabel="Sí, quitar acceso"
      confirmClassName="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#B91C1C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#991B1B] disabled:opacity-60"
      onConfirm={() => setUserActiveAction({ userId, active: false })}
    />
  ) : (
    <ConfirmActionButton
      triggerClassName={`${BTN_SECONDARY} ${COMPACT}`}
      triggerLabel={`Habilitar acceso a @${username}`}
      trigger={
        <>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Habilitar</span>
        </>
      }
      title={`Habilitar acceso a @${username}`}
      description={`@${username} volverá a poder ingresar con su usuario y contraseña.`}
      confirmLabel="Sí, habilitar"
      confirmClassName={BTN_PRIMARY}
      onConfirm={() => setUserActiveAction({ userId, active: true })}
    />
  );
}
