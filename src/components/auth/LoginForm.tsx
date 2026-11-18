"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type AuthActionState, loginAction } from "@/app/actions/auth";
import { loginSchema } from "@/lib/validations/auth";

const initialState: AuthActionState = {};

const LABEL_CLASS =
  "block text-xs font-bold uppercase tracking-wide text-brand-ink";
const INPUT_CLASS =
  "mt-1.5 w-full rounded-2xl border border-brand-border bg-brand-cream px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted/75 focus:border-brand-green focus:bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-green/25";

export function LoginForm() {
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

  const fieldErrors =
    Object.keys(clientErrors).length > 0
      ? clientErrors
      : (serverState.fieldErrors ?? {});
  const bannerError = clientBannerError ?? serverState.error;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const rawInput = {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const parsed = loginSchema.safeParse(rawInput);
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(parsed.error.flatten().fieldErrors);
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
          className="rounded-2xl border border-[#D98282] bg-[#FDF2F2] px-4 py-3 text-xs font-medium text-[#7A1C1C] sm:text-sm"
        >
          {bannerError}
        </div>
      ) : null}

      <div>
        <label htmlFor="username" className={LABEL_CLASS}>
          Nombre de Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={serverState.values?.username ?? ""}
          placeholder="Ej. sabores.sanroque"
          className={INPUT_CLASS}
        />
        {fieldErrors.username?.[0] ? (
          <p className="mt-1 text-xs font-medium text-[#9B2226]">
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
          placeholder="••••••••"
          className={INPUT_CLASS}
        />
        {fieldErrors.password?.[0] ? (
          <p className="mt-1 text-xs font-medium text-[#9B2226]">
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

      <p className="pt-1 text-center text-xs text-brand-muted">
        ¿Sos emprendedor local y todavía no tenés cuenta?{" "}
        <Link
          href="/registro"
          className="font-bold text-brand-green underline underline-offset-2 hover:text-brand-green-dark"
        >
          Registrate acá
        </Link>
      </p>
    </form>
  );
}
