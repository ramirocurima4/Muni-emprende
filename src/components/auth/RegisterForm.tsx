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
      setClientBannerError("Por favor revisá los campos marcados antes de continuar.");
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
      {/* Aviso de auditoría previa */}
      <div className="rounded-2xl border border-[#C6D5CA] bg-[#DDE6DF]/60 px-3.5 py-3 text-xs leading-relaxed text-[#273B2C]">
        <strong className="font-bold">Revisión municipal:</strong> Al
        registrarte, tu perfil ingresará en estado{" "}
        <strong>Pendiente de aprobación</strong> hasta que el equipo de
        Modernización y Empleo verifique tus datos.
      </div>

      {bannerError ? (
        <div
          role="alert"
          className="rounded-2xl border border-[#D98282] bg-[#FDF2F2] px-4 py-3 text-xs sm:text-sm font-medium text-[#7A1C1C]"
        >
          {bannerError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="ownerName"
            className="block text-xs font-bold uppercase tracking-wide text-[#2C302E]"
          >
            Tu nombre y apellido *
          </label>
          <input
            id="ownerName"
            name="ownerName"
            type="text"
            autoComplete="name"
            required
            defaultValue={serverState.values?.ownerName ?? ""}
            placeholder="Ej. María Elena Gómez"
            className="mt-1.5 w-full rounded-2xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#2C302E] placeholder:text-[#5A615D]/75 focus:border-[#3F5E47] focus:bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3F5E47]/25"
          />
          {fieldErrors.ownerName?.[0] ? (
            <p className="mt-1 text-xs font-medium text-[#9B2226]">
              {fieldErrors.ownerName[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="businessName"
            className="block text-xs font-bold uppercase tracking-wide text-[#2C302E]"
          >
            Nombre del emprendimiento *
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            required
            defaultValue={serverState.values?.businessName ?? ""}
            placeholder="Ej. Sabores de San Roque"
            className="mt-1.5 w-full rounded-2xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#2C302E] placeholder:text-[#5A615D]/75 focus:border-[#3F5E47] focus:bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3F5E47]/25"
          />
          {fieldErrors.businessName?.[0] ? (
            <p className="mt-1 text-xs font-medium text-[#9B2226]">
              {fieldErrors.businessName[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-bold uppercase tracking-wide text-[#2C302E]"
        >
          Correo electrónico *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={serverState.values?.email ?? ""}
          placeholder="tu.emprendimiento@ejemplo.com"
          className="mt-1.5 w-full rounded-2xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#2C302E] placeholder:text-[#5A615D]/75 focus:border-[#3F5E47] focus:bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3F5E47]/25"
        />
        {fieldErrors.email?.[0] ? (
          <p className="mt-1 text-xs font-medium text-[#9B2226]">
            {fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="whatsappNumber"
            className="block text-xs font-bold uppercase tracking-wide text-[#2C302E]"
          >
            WhatsApp de ventas *
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
            className="mt-1.5 w-full rounded-2xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#2C302E] placeholder:text-[#5A615D]/75 focus:border-[#3F5E47] focus:bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3F5E47]/25"
          />
          <p className="mt-1 text-[11px] text-[#5A615D]">
            Sin 0 ni 15.{" "}
            {isPhoneValidPreview ? (
              <a
                href={`https://wa.me/${normalizedPhone}?text=${encodeURIComponent("Hola! Estoy probando mi enlace de WhatsApp para MuniEmprende San Roque.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#3F5E47] underline"
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
          <label
            htmlFor="neighborhood"
            className="block text-xs font-bold uppercase tracking-wide text-[#2C302E]"
          >
            Barrio / Zona en San Roque
          </label>
          <input
            id="neighborhood"
            name="neighborhood"
            type="text"
            defaultValue={serverState.values?.neighborhood ?? ""}
            placeholder="Ej. Barrio Centro"
            className="mt-1.5 w-full rounded-2xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#2C302E] placeholder:text-[#5A615D]/75 focus:border-[#3F5E47] focus:bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3F5E47]/25"
          />
          {fieldErrors.neighborhood?.[0] ? (
            <p className="mt-1 text-xs font-medium text-[#9B2226]">
              {fieldErrors.neighborhood[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor="bio"
          className="block text-xs font-bold uppercase tracking-wide text-[#2C302E]"
        >
          Descripción breve de lo que elaborás u ofrecés
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={serverState.values?.bio ?? ""}
          placeholder="Contale a los vecinos qué productos hacés, si trabajás a pedido, horarios..."
          className="mt-1.5 w-full rounded-2xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#2C302E] placeholder:text-[#5A615D]/75 focus:border-[#3F5E47] focus:bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3F5E47]/25"
        />
        {fieldErrors.bio?.[0] ? (
          <p className="mt-1 text-xs font-medium text-[#9B2226]">
            {fieldErrors.bio[0]}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wide text-[#2C302E]"
          >
            Contraseña (mín. 8 caracteres) *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
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

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold uppercase tracking-wide text-[#2C302E]"
          >
            Repetir contraseña *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-2xl border border-[#E6E1D6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#2C302E] placeholder:text-[#5A615D]/75 focus:border-[#3F5E47] focus:bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3F5E47]/25"
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
        className="w-full rounded-2xl bg-[#3F5E47] px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#324C39] active:bg-[#273B2C] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3F5E47] focus-visible:ring-offset-2"
      >
        {isPending
          ? "Creando tu cuenta..."
          : "Registrar mi emprendimiento"}
      </button>

      <p className="pt-1 text-center text-xs text-[#5A615D]">
        ¿Ya tenés cuenta registrada?{" "}
        <Link
          href="/login"
          className="font-bold text-[#3F5E47] underline underline-offset-2 hover:text-[#273B2C]"
        >
          Ingresá acá
        </Link>
      </p>
    </form>
  );
}
