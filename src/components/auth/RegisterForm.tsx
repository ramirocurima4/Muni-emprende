"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  type AuthActionState,
  registerEntrepreneurAction,
} from "@/app/actions/auth";
import { registerEntrepreneurSchema } from "@/lib/validations/auth";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

const initialState: AuthActionState = {};

const LABEL_CLASS =
  "block text-xs font-bold uppercase tracking-wide text-brand-ink";
const INPUT_CLASS =
  "mt-1.5 w-full rounded-2xl border border-brand-border bg-brand-cream px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted/75 focus:border-brand-green focus:bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-green/25";

export function RegisterForm() {
  const [serverState, formAction, isPending] = useActionState(
    registerEntrepreneurAction,
    initialState,
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>(
    {},
  );
  const [clientBannerError, setClientBannerError] = useState<string | null>(
    null,
  );
  const [whatsappInput, setWhatsappInput] = useState(
    serverState.values?.whatsappNumber ?? "",
  );

  const fieldErrors =
    Object.keys(clientErrors).length > 0
      ? clientErrors
      : (serverState.fieldErrors ?? {});
  const bannerError = clientBannerError ?? serverState.error;

  const normalizedPhone = normalizeWhatsappNumber(whatsappInput);
  const isPhoneValidPreview = /^549\d{10,11}$/.test(normalizedPhone);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const rawInput = {
      ownerName: String(formData.get("ownerName") ?? ""),
      businessName: String(formData.get("businessName") ?? ""),
      username: String(formData.get("username") ?? ""),
      email: String(formData.get("email") ?? ""),
      whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
      neighborhood: String(formData.get("neighborhood") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    const parsed = registerEntrepreneurSchema.safeParse(rawInput);
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(parsed.error.flatten().fieldErrors);
      setClientBannerError(
        "Por favor revisá los campos marcados antes de continuar.",
      );
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
      {/* Aviso de auditoría previa */}
      <div className="rounded-2xl border border-brand-green/20 bg-brand-green-soft/65 px-4 py-3 text-xs leading-relaxed text-brand-green-dark">
        <strong className="font-bold">Revisión municipal:</strong> Al
        registrarte, tu perfil ingresará en estado{" "}
        <strong>Pendiente de aprobación</strong> hasta que el equipo de
        Modernización y Empleo verifique tus datos.
      </div>

      {bannerError ? (
        <div
          role="alert"
          className="rounded-2xl border border-[#D98282] bg-[#FDF2F2] px-4 py-3 text-xs font-medium text-[#7A1C1C] sm:text-sm"
        >
          {bannerError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ownerName" className={LABEL_CLASS}>
            Nombre y apellido *
          </label>
          <input
            id="ownerName"
            name="ownerName"
            type="text"
            autoComplete="name"
            required
            defaultValue={serverState.values?.ownerName ?? ""}
            placeholder="Ej. María Elena Gómez"
            className={INPUT_CLASS}
          />
          {fieldErrors.ownerName?.[0] ? (
            <p className="mt-1 text-xs font-medium text-[#9B2226]">
              {fieldErrors.ownerName[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="businessName" className={LABEL_CLASS}>
            Nombre del emprendimiento *
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            required
            defaultValue={serverState.values?.businessName ?? ""}
            placeholder="Ej. Sabores de San Roque"
            className={INPUT_CLASS}
          />
          {fieldErrors.businessName?.[0] ? (
            <p className="mt-1 text-xs font-medium text-[#9B2226]">
              {fieldErrors.businessName[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="username" className={LABEL_CLASS}>
            Nombre de Usuario (para iniciar sesión) *
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
          <p className="mt-1 text-[11px] text-brand-muted">
            Sin espacios; es tu identificador único para ingresar.
          </p>
          {fieldErrors.username?.[0] ? (
            <p className="mt-1 text-xs font-medium text-[#9B2226]">
              {fieldErrors.username[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className={LABEL_CLASS}>
            Correo electrónico{" "}
            <span className="font-normal normal-case text-brand-muted">
              (opcional)
            </span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={serverState.values?.email ?? ""}
            placeholder="Ej. maria@correo.com (opcional)"
            className={INPUT_CLASS}
          />
          {fieldErrors.email?.[0] ? (
            <p className="mt-1 text-xs font-medium text-[#9B2226]">
              {fieldErrors.email[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="whatsappNumber" className={LABEL_CLASS}>
            WhatsApp de ventas (Obligatorio) *
          </label>
          <input
            id="whatsappNumber"
            name="whatsappNumber"
            type="tel"
            inputMode="tel"
            required
            value={whatsappInput}
            onChange={(e) => setWhatsappInput(e.target.value)}
            placeholder="Ej. 3777 554433"
            className={INPUT_CLASS}
          />
          <p className="mt-1 text-[11px] text-brand-muted">
            Obligatorio para recibir consultas. Sin 0 ni 15.{" "}
            {isPhoneValidPreview ? (
              <a
                href={`https://wa.me/${normalizedPhone}?text=${encodeURIComponent("Hola! Estoy probando mi enlace de WhatsApp para MuniEmprende San Roque.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-brand-green underline"
              >
                Probar mi link (+{normalizedPhone}) ↗
              </a>
            ) : null}
          </p>
          {fieldErrors.whatsappNumber?.[0] ? (
            <p className="mt-1 text-xs font-medium text-[#9B2226]">
              {fieldErrors.whatsappNumber[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="neighborhood" className={LABEL_CLASS}>
            Barrio / Zona en San Roque{" "}
            <span className="font-normal normal-case text-brand-muted">
              (opcional)
            </span>
          </label>
          <input
            id="neighborhood"
            name="neighborhood"
            type="text"
            defaultValue={serverState.values?.neighborhood ?? ""}
            placeholder="Ej. Barrio Centro"
            className={INPUT_CLASS}
          />
          {fieldErrors.neighborhood?.[0] ? (
            <p className="mt-1 text-xs font-medium text-[#9B2226]">
              {fieldErrors.neighborhood[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="bio" className={LABEL_CLASS}>
          Descripción breve de lo que elaborás u ofrecés{" "}
          <span className="font-normal normal-case text-brand-muted">
            (opcional)
          </span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={serverState.values?.bio ?? ""}
          placeholder="Contale a los vecinos qué productos hacés, si trabajás a pedido, horarios..."
          className={INPUT_CLASS}
        />
        {fieldErrors.bio?.[0] ? (
          <p className="mt-1 text-xs font-medium text-[#9B2226]">
            {fieldErrors.bio[0]}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className={LABEL_CLASS}>
            Contraseña (mín. 8 caracteres) *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
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

        <div>
          <label htmlFor="confirmPassword" className={LABEL_CLASS}>
            Repetir contraseña *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            className={INPUT_CLASS}
          />
          {fieldErrors.confirmPassword?.[0] ? (
            <p className="mt-1 text-xs font-medium text-[#9B2226]">
              {fieldErrors.confirmPassword[0]}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-brand-green px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green-hover active:bg-brand-green-dark disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
      >
        {isPending
          ? "Creando tu cuenta..."
          : "Registrar mi emprendimiento"}
      </button>

      <p className="pt-1 text-center text-xs text-brand-muted">
        ¿Ya tenés cuenta registrada?{" "}
        <Link
          href="/login"
          className="font-bold text-brand-green underline underline-offset-2 hover:text-brand-green-dark"
        >
          Ingresá acá
        </Link>
      </p>
    </form>
  );
}
