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
const BASE_INPUT_CLASS =
  "mt-1.5 w-full rounded-2xl border px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted/75 focus:outline-none focus:ring-2";
const VALID_INPUT_CLASS = `${BASE_INPUT_CLASS} border-brand-border bg-brand-cream focus:border-brand-green focus:bg-brand-surface focus:ring-brand-green/25`;
const ERROR_INPUT_CLASS = `${BASE_INPUT_CLASS} border-[#B91C1C] bg-[#FDF2F2]/50 focus:border-[#991B1B] focus:bg-brand-surface focus:ring-[#B91C1C]/20`;

const FIELD_LABELS: Record<string, string> = {
  ownerName: "Nombre y apellido",
  businessName: "Nombre del emprendimiento",
  username: "Nombre de usuario",
  email: "Correo electrónico",
  whatsappNumber: "WhatsApp de ventas",
  neighborhood: "Barrio o zona",
  bio: "Descripción breve",
  password: "Contraseña",
  confirmPassword: "Repetir contraseña",
};

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

  // Campos controlados para evitar que React 19 limpie el formulario si el servidor devuelve un error
  const [ownerName, setOwnerName] = useState(
    serverState.values?.ownerName ?? "",
  );
  const [businessName, setBusinessName] = useState(
    serverState.values?.businessName ?? "",
  );
  const [username, setUsername] = useState(serverState.values?.username ?? "");
  const [email, setEmail] = useState(serverState.values?.email ?? "");
  const [whatsappInput, setWhatsappInput] = useState(
    serverState.values?.whatsappNumber ?? "",
  );
  const [neighborhood, setNeighborhood] = useState(
    serverState.values?.neighborhood ?? "",
  );
  const [bio, setBio] = useState(serverState.values?.bio ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hasClientErrors = Object.keys(clientErrors).length > 0;
  const fieldErrors = hasClientErrors
    ? clientErrors
    : (serverState.fieldErrors ?? {});
  const bannerError = clientBannerError ?? serverState.error;

  const errorEntries = Object.entries(fieldErrors).filter(
    ([, msgs]) => Array.isArray(msgs) && msgs.length > 0,
  );

  const normalizedPhone = normalizeWhatsappNumber(whatsappInput);
  const isPhoneValidPreview = /^549\d{10,11}$/.test(normalizedPhone);

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
    const rawInput = {
      ownerName,
      businessName,
      username,
      email,
      whatsappNumber: whatsappInput,
      neighborhood,
      bio,
      password,
      confirmPassword,
    };

    const parsed = registerEntrepreneurSchema.safeParse(rawInput);
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
      setClientBannerError(
        flattened.formErrors[0] ??
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
      {/* Aviso de revisión municipal */}
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
          <p className="font-bold">{bannerError}</p>
          {errorEntries.length > 0 ? (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs">
              {errorEntries.map(([key, msgs]) => (
                <li key={key}>
                  <strong>{FIELD_LABELS[key] ?? key}:</strong> {msgs[0]}
                </li>
              ))}
            </ul>
          ) : null}
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
            value={ownerName}
            onChange={(e) => {
              setOwnerName(e.target.value);
              clearFieldError("ownerName");
            }}
            aria-invalid={Boolean(fieldErrors.ownerName?.[0])}
            placeholder="Ej. María Elena Gómez"
            className={
              fieldErrors.ownerName?.[0] ? ERROR_INPUT_CLASS : VALID_INPUT_CLASS
            }
          />
          {fieldErrors.ownerName?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
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
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              clearFieldError("businessName");
            }}
            aria-invalid={Boolean(fieldErrors.businessName?.[0])}
            placeholder="Ej. Sabores de San Roque"
            className={
              fieldErrors.businessName?.[0]
                ? ERROR_INPUT_CLASS
                : VALID_INPUT_CLASS
            }
          />
          {fieldErrors.businessName?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
              {fieldErrors.businessName[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="username" className={LABEL_CLASS}>
            Nombre de usuario *
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
            placeholder="ej. sabores.sanroque"
            className={
              fieldErrors.username?.[0] ? ERROR_INPUT_CLASS : VALID_INPUT_CLASS
            }
          />
          <p className="mt-1 text-[11px] text-brand-muted">
            Con este usuario vas a iniciar sesión. Sin espacios.
          </p>
          {fieldErrors.username?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            aria-invalid={Boolean(fieldErrors.email?.[0])}
            placeholder="Ej. maria@correo.com (opcional)"
            className={
              fieldErrors.email?.[0] ? ERROR_INPUT_CLASS : VALID_INPUT_CLASS
            }
          />
          {fieldErrors.email?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
              {fieldErrors.email[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="whatsappNumber" className={LABEL_CLASS}>
            WhatsApp de ventas *
          </label>
          <input
            id="whatsappNumber"
            name="whatsappNumber"
            type="tel"
            inputMode="tel"
            required
            value={whatsappInput}
            onChange={(e) => {
              setWhatsappInput(e.target.value);
              clearFieldError("whatsappNumber");
            }}
            aria-invalid={Boolean(fieldErrors.whatsappNumber?.[0])}
            placeholder="Ej. 3777 554433"
            className={
              fieldErrors.whatsappNumber?.[0]
                ? ERROR_INPUT_CLASS
                : VALID_INPUT_CLASS
            }
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
            <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
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
            value={neighborhood}
            onChange={(e) => {
              setNeighborhood(e.target.value);
              clearFieldError("neighborhood");
            }}
            aria-invalid={Boolean(fieldErrors.neighborhood?.[0])}
            placeholder="Ej. Barrio Centro"
            className={
              fieldErrors.neighborhood?.[0]
                ? ERROR_INPUT_CLASS
                : VALID_INPUT_CLASS
            }
          />
          {fieldErrors.neighborhood?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
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
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            clearFieldError("bio");
          }}
          aria-invalid={Boolean(fieldErrors.bio?.[0])}
          placeholder="Contale a los vecinos qué productos hacés, si trabajás a pedido, horarios..."
          className={
            fieldErrors.bio?.[0] ? ERROR_INPUT_CLASS : VALID_INPUT_CLASS
          }
        />
        {fieldErrors.bio?.[0] ? (
          <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
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
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearFieldError("confirmPassword");
            }}
            aria-invalid={Boolean(fieldErrors.confirmPassword?.[0])}
            placeholder="••••••••"
            className={
              fieldErrors.confirmPassword?.[0]
                ? ERROR_INPUT_CLASS
                : VALID_INPUT_CLASS
            }
          />
          {fieldErrors.confirmPassword?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
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
