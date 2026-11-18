"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  resetUserPasswordAction,
  type ResetPasswordResult,
} from "@/app/actions/admin-users";
import { AdminModal } from "./AdminModal";
import { TemporaryPasswordBox } from "./CopyButton";
import { BTN_AMBER, BTN_PRIMARY } from "./ui";

/**
 * Blanqueo de contraseña con confirmación. La clave nueva la genera el sistema y se muestra una sola vez.
 */
export function ResetPasswordButton({
  userId,
  username,
  className = BTN_AMBER,
  compact = false,
}: {
  userId: string;
  username: string;
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ResetPasswordResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setOpen(false);
    setResult(null);
  }

  function handleConfirm() {
    startTransition(async () => {
      setResult(await resetUserPasswordAction({ userId }));
    });
  }

  const succeeded = result?.ok && result.temporaryPassword;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        aria-label={`Blanquear contraseña de ${username}`}
      >
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        <span>{compact ? "Clave" : "Blanquear contraseña"}</span>
      </button>

      {open ? (
        <AdminModal
          title={succeeded ? "Contraseña nueva lista" : "Blanquear contraseña"}
          description={
            succeeded
              ? undefined
              : `Se genera una contraseña temporal para @${username} y la anterior deja de funcionar.`
          }
          onClose={close}
          closeDisabled={isPending}
        >
          {succeeded ? (
            <div className="space-y-4">
              <TemporaryPasswordBox
                username={result.username ?? username}
                password={result.temporaryPassword as string}
              />
              <div className="flex justify-end">
                <button type="button" onClick={close} className={BTN_PRIMARY}>
                  Listo, ya la copié
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {result && !result.ok ? (
                <p
                  role="alert"
                  className="rounded-xl border border-[#D98282] bg-[#FDF2F2] px-3.5 py-2.5 text-sm font-semibold text-[#7A1C1C]"
                >
                  {result.error}
                </p>
              ) : null}
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={close}
                  disabled={isPending}
                  className="inline-flex min-h-[40px] items-center rounded-xl border border-brand-border bg-white px-4 py-2 text-sm font-bold text-brand-muted hover:bg-brand-cream disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isPending}
                  className={BTN_PRIMARY}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    "Generar contraseña nueva"
                  )}
                </button>
              </div>
            </div>
          )}
        </AdminModal>
      ) : null}
    </>
  );
}
