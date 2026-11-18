"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import {
  createUserAction,
  type CreateUserActionState,
} from "@/app/actions/admin-users";
import { TemporaryPasswordBox } from "./CopyButton";
import {
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "./ui";

const initialState: CreateUserActionState = {};

const ROLE_OPTIONS = [
  {
    value: "ADMIN",
    title: "Administración",
    help: "Personal de la Dirección de Empleo o Prensa. Accede a este panel.",
  },
  {
    value: "USER_NEW",
    title: "Emprendedor con revisión previa",
    help: "Sus productos pasan por revisión de la Muni antes de publicarse.",
  },
  {
    value: "USER_TRUSTED",
    title: "Emprendedor con publicación directa",
    help: "Sus productos se publican sin revisión previa.",
  },
  {
    value: "MODERATOR",
    title: "Moderación (reservado)",
    help: "Por ahora no habilita ninguna pantalla; queda para el futuro.",
  },
] as const;

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.[0] ? (
    <p className="mt-1 text-xs font-semibold text-[#9B2226]">{messages[0]}</p>
  ) : null;
}

export function CreateUserPanel() {
  const [state, formAction, isPending] = useActionState(createUserAction, initialState);
  const [role, setRole] = useState<string>(state.values?.role ?? "ADMIN");
  const [dismissedState, setDismissedState] = useState<CreateUserActionState | null>(null);

  const needsBusiness = role === "USER_NEW" || role === "USER_TRUSTED";
  const showResult = Boolean(state.ok && state.created && dismissedState !== state);
  const fieldErrors = state.fieldErrors ?? {};

  if (showResult && state.created) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-brand-green/30 bg-brand-green-soft px-4 py-3 text-sm font-bold text-brand-green-dark">
          ¡Listo! Creamos el usuario ({state.created.roleLabel}).
        </div>
        <TemporaryPasswordBox
          username={state.created.username}
          password={state.created.temporaryPassword}
        />
        <button
          type="button"
          onClick={() => setDismissedState(state)}
          className={BTN_SECONDARY}
        >
          Crear otro usuario
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.error ? (
        <div
          role="alert"
          className="rounded-xl border border-[#D98282] bg-[#FDF2F2] px-3.5 py-2.5 text-sm font-semibold text-[#7A1C1C]"
        >
          {state.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="create-username" className={ADMIN_LABEL_CLASS}>
          Nombre de usuario *
        </label>
        <input
          id="create-username"
          name="username"
          type="text"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={state.values?.username ?? ""}
          placeholder="Ej. maria.prensa"
          className={ADMIN_INPUT_CLASS}
        />
        <p className="mt-1 text-xs text-brand-muted">
          Solo letras, números, puntos y guiones, sin espacios. Con este nombre ingresa a
          la plataforma.
        </p>
        <FieldError messages={fieldErrors.username} />
      </div>

      <fieldset>
        <legend className={ADMIN_LABEL_CLASS}>Tipo de usuario *</legend>
        <div className="mt-2 space-y-2">
          {ROLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 transition-colors ${
                role === option.value
                  ? "border-brand-green bg-brand-green-soft/70"
                  : "border-brand-sky/30 bg-brand-cream hover:border-brand-sky"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="mt-1 h-4 w-4 accent-[#3D7A1E]"
              />
              <span>
                <span className="block text-sm font-extrabold text-brand-ink">
                  {option.title}
                </span>
                <span className="block text-xs text-brand-muted">{option.help}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError messages={fieldErrors.role} />
      </fieldset>

      {needsBusiness ? (
        <div className="space-y-4 rounded-2xl border border-brand-sky/30 bg-brand-sky-tint/60 p-4">
          <p className="text-sm font-bold text-brand-sky-dark">
            Datos del emprendimiento (queda habilitado desde el primer momento)
          </p>
          <div>
            <label htmlFor="create-owner" className={ADMIN_LABEL_CLASS}>
              Nombre y apellido *
            </label>
            <input
              id="create-owner"
              name="ownerName"
              type="text"
              defaultValue={state.values?.ownerName ?? ""}
              className={ADMIN_INPUT_CLASS}
            />
            <FieldError messages={fieldErrors.ownerName} />
          </div>
          <div>
            <label htmlFor="create-business" className={ADMIN_LABEL_CLASS}>
              Nombre del emprendimiento *
            </label>
            <input
              id="create-business"
              name="businessName"
              type="text"
              defaultValue={state.values?.businessName ?? ""}
              className={ADMIN_INPUT_CLASS}
            />
            <FieldError messages={fieldErrors.businessName} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="create-whatsapp" className={ADMIN_LABEL_CLASS}>
                WhatsApp de ventas *
              </label>
              <input
                id="create-whatsapp"
                name="whatsappNumber"
                type="tel"
                inputMode="tel"
                defaultValue={state.values?.whatsappNumber ?? ""}
                placeholder="3777 554433"
                className={ADMIN_INPUT_CLASS}
              />
              <FieldError messages={fieldErrors.whatsappNumber} />
            </div>
            <div>
              <label htmlFor="create-neighborhood" className={ADMIN_LABEL_CLASS}>
                Barrio o zona
              </label>
              <input
                id="create-neighborhood"
                name="neighborhood"
                type="text"
                defaultValue={state.values?.neighborhood ?? ""}
                className={ADMIN_INPUT_CLASS}
              />
              <FieldError messages={fieldErrors.neighborhood} />
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-brand-muted">
        La contraseña la genera el sistema y se muestra una sola vez al crear el usuario.
      </p>

      <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Creando...</span>
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span>Crear usuario y generar contraseña</span>
          </>
        )}
      </button>
    </form>
  );
}
