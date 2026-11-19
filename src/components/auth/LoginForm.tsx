"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type AuthActionState, loginAction } from "@/app/actions/auth";
import { loginSchema } from "@/lib/validations/auth";
import { buildInstitutionalWhatsappUrl } from "@/lib/whatsapp";

const initialState: AuthActionState = {};
const EMPLOYMENT_WHATSAPP_RAW = "3794819378";

const LABEL_CLASS =
  "block text-xs font-bold uppercase tracking-wide text-brand-ink";
const BASE_INPUT_CLASS =
  "mt-1.5 w-full rounded-2xl border px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted/75 focus:outline-none focus:ring-2";
const VALID_INPUT_CLASS = `${BASE_INPUT_CLASS} border-brand-border bg-brand-cream focus:border-brand-green focus:bg-brand-surface focus:ring-brand-green/25`;
const ERROR_INPUT_CLASS = `${BASE_INPUT_CLASS} border-[#B91C1C] bg-[#FDF2F2]/50 focus:border-[#991B1B] focus:bg-brand-surface focus:ring-[#B91C1C]/20`;

export function LoginForm({
  employmentWhatsapp = EMPLOYMENT_WHATSAPP_RAW,
}: {
  employmentWhatsapp?: string;
}) {
  const [serverState, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>(
    {},
  );
  const [clientBannerError, setClientBannerError] = useState<string | null>(
    null,
  );

  const [username, setUsername] = useState(serverState.values?.username ?? "");
  const [password, setPassword] = useState("");

  const fieldErrors =
    Object.keys(clientErrors).length > 0
      ? clientErrors
      : (serverState.fieldErrors ?? {});
  const bannerError = clientBannerError ?? serverState.error;

  const helpWhatsappUrl = buildInstitutionalWhatsappUrl(
    employmentWhatsapp,
    "Hola! Olvidé mi clave de MuniEmprende San Roque y necesito ayuda para recuperarla.",
  );

  function clearFieldError(field: string) {
    if (clientErrors[field]) {
      setClientErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (Object.keys(next).length === 0) {
          setClientBannerError(null);
        }
        return next;
      });
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      event.preventDefault();
      const flattened = parsed.error.flatten();
      const nextFieldErrors: Record<string, string[]> = {};
      for (const [key, msgs] of Object.entries(flattened.fieldErrors)) {
        if (Array.isArray(msgs) && msgs.length > 0) {
          nextFieldErrors[key] = msgs;
        }
      }
      setClientErrors(nextFieldErrors);
      setClientBannerError("Por favor revisá los datos ingresados.");
      return;
    }

    setClientErrors({});
    setClientBannerError(null);
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-[28px] border border-brand-border bg-brand-surface p-5 shadow-xl shadow-black/[0.04] sm:p-7"
    >
      {bannerError ? (
        <div
          role="alert"
          className="rounded-2xl border border-[#D98282] bg-[#FDF2F2] px-4 py-3 text-xs font-bold text-[#7A1C1C] sm:text-sm"
        >
          {bannerError}
        </div>
      ) : null}

      <div>
        <label htmlFor="username" className={LABEL_CLASS}>
          Nombre de usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            clearFieldError("username");
          }}
          aria-invalid={Boolean(fieldErrors.username?.[0])}
          placeholder="Ej. sabores.sanroque"
          className={
            fieldErrors.username?.[0] ? ERROR_INPUT_CLASS : VALID_INPUT_CLASS
          }
        />
        {fieldErrors.username?.[0] ? (
          <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
            {fieldErrors.username[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className={LABEL_CLASS}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError("password");
          }}
          aria-invalid={Boolean(fieldErrors.password?.[0])}
          placeholder="••••••••"
          className={
            fieldErrors.password?.[0] ? ERROR_INPUT_CLASS : VALID_INPUT_CLASS
          }
        />
        {fieldErrors.password?.[0] ? (
          <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
            {fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-brand-green px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green-hover active:bg-brand-green-dark disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
      >
        {isPending ? "Ingresando..." : "Ingresar a mi cuenta"}
      </button>

      <div className="space-y-2 pt-1 text-center text-xs text-brand-muted">
        <p>
          <a
            href={helpWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-sky-dark underline underline-offset-2 hover:text-brand-green-dark"
          >
            ¿Olvidaste tu clave? Pedí ayuda por WhatsApp a Empleo
          </a>
        </p>

        <p>
          ¿Sos emprendedor local y todavía no tenés cuenta?{" "}
          <Link
            href="/registro"
            className="font-bold text-brand-green underline underline-offset-2 hover:text-brand-green-dark"
          >
            Registrate acá
          </Link>
        </p>
      </div>
    </form>
  );
}
