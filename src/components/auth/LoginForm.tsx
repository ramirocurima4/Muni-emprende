"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type AuthActionState, loginAction } from "@/app/actions/auth";
import { loginSchema } from "@/lib/validations/auth";

const initialState: AuthActionState = {};

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
      className="space-y-4 rounded-3xl border border-[#E6E1D6] bg-[#FDFCFA] p-5 shadow-2xs sm:p-7"
    >
      {bannerError ? (
        <div
          role="alert"
          className="rounded-2xl border border-[#D98282] bg-[#FDF2F2] px-4 py-3 text-xs sm:text-sm font-medium text-[#7A1C1C]"
        >
          {bannerError}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="username"
          className="block text-xs font-bold uppercase tracking-wide text-[#2C302E]"
        >
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
          defaultValue={serverState.values?.username ?? ""}
          placeholder="Ej. sabores.sanroque"
          className="mt-1.5 w-full rounded-2xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#2C302E] placeholder:text-[#5A615D]/75 focus:border-[#3F5E47] focus:bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3F5E47]/25"
        />
        {fieldErrors.username?.[0] ? (
          <p className="mt-1 text-xs font-medium text-[#9B2226]">
            {fieldErrors.username[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-bold uppercase tracking-wide text-[#2C302E]"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="mt-1.5 w-full rounded-2xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#2C302E] placeholder:text-[#5A615D]/75 focus:border-[#3F5E47] focus:bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3F5E47]/25"
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
        className="w-full rounded-2xl bg-[#3F5E47] px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#324C39] active:bg-[#273B2C] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3F5E47] focus-visible:ring-offset-2"
      >
        {isPending ? "Ingresando..." : "Ingresar a mi cuenta"}
      </button>

      <p className="pt-1 text-center text-xs text-[#5A615D]">
        ¿Sos emprendedor local y todavía no tenés cuenta?{" "}
        <Link
          href="/registro"
          className="font-bold text-[#3F5E47] underline underline-offset-2 hover:text-[#273B2C]"
        >
          Registrate acá
        </Link>
      </p>
    </form>
  );
}
