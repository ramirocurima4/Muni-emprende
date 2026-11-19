"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Save,
} from "lucide-react";
import { useActionState, useState } from "react";
import {
  updateFairConfigAction,
  type FairConfigActionState,
} from "@/app/actions/admin-gallery";
import { FAIR_META, PRESET_FAIR_LOCATIONS, type FairTypeKey } from "@/lib/fairs";
import type { PublicFairConfig } from "@/lib/expos";
import { formatWhatsappDisplay } from "@/lib/admin-labels";
import {
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  BTN_PRIMARY,
} from "./ui";

const initialState: FairConfigActionState = {};

export function FairConfigEditor({
  configs,
}: {
  configs: Record<FairTypeKey, PublicFairConfig>;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <FairConfigCard config={configs.EXPO_EMPRENDEDORES} />
      <FairConfigCard config={configs.MERCADO_SANROQUENO} />
    </div>
  );
}

function FairConfigCard({ config }: { config: PublicFairConfig }) {
  const meta = FAIR_META[config.fairType];
  const [state, formAction, isPending] = useActionState(
    updateFairConfigAction,
    initialState,
  );
  const [nextDate, setNextDate] = useState(config.nextDate ?? "");
  const [location, setLocation] = useState(config.location);

  const isExpo = config.fairType === "EXPO_EMPRENDEDORES";
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      noValidate
      className="flex flex-col justify-between gap-4 rounded-3xl border border-brand-sky/40 bg-brand-sky-tint/55 p-5"
    >
      <input type="hidden" name="fairType" value={config.fairType} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                isExpo
                  ? "bg-brand-amber-soft text-brand-amber-text"
                  : "bg-brand-green-soft text-brand-green-dark"
              }`}
            >
              {meta.areaLabel}
            </span>
            <h3 className="mt-2 text-lg font-extrabold text-brand-ink">
              {meta.label}
            </h3>
            <p className="text-xs text-brand-muted">{meta.audience}</p>
          </div>
        </div>

        {state.ok === false && state.error ? (
          <div
            role="alert"
            className="rounded-xl border border-[#D98282] bg-[#FDF2F2] px-3 py-2 text-xs font-semibold text-[#7A1C1C]"
          >
            {state.error}
          </div>
        ) : null}

        {state.ok && state.savedAt ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-brand-green/35 bg-brand-green-soft px-3 py-2 text-xs font-bold text-brand-green-dark"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Cartelera de {meta.label} actualizada en la portada.</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`fair-date-${config.fairType}`}
                className={ADMIN_LABEL_CLASS}
              >
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-brand-green" aria-hidden="true" />
                  Próxima fecha
                </span>
              </label>
              {nextDate ? (
                <button
                  type="button"
                  onClick={() => setNextDate("")}
                  className="text-[11px] font-bold text-brand-sky-dark hover:underline"
                >
                  A confirmar
                </button>
              ) : null}
            </div>
            <input
              id={`fair-date-${config.fairType}`}
              name="nextDate"
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className={ADMIN_INPUT_CLASS}
            />
            {fieldErrors.nextDate?.[0] ? (
              <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                {fieldErrors.nextDate[0]}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`fair-schedule-${config.fairType}`}
              className={ADMIN_LABEL_CLASS}
            >
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-brand-green" aria-hidden="true" />
                Horario
              </span>
            </label>
            <input
              id={`fair-schedule-${config.fairType}`}
              name="schedule"
              type="text"
              maxLength={80}
              defaultValue={config.schedule}
              placeholder={meta.defaultSchedule}
              className={ADMIN_INPUT_CLASS}
            />
            {fieldErrors.schedule?.[0] ? (
              <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                {fieldErrors.schedule[0]}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={`fair-location-${config.fairType}`}
              className={ADMIN_LABEL_CLASS}
            >
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-green" aria-hidden="true" />
                Lugar
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_FAIR_LOCATIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLocation(preset)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                    location.trim() === preset
                      ? "bg-brand-green text-white"
                      : "border border-brand-sky/45 bg-white text-brand-sky-dark hover:bg-brand-sky-light"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
          <input
            id={`fair-location-${config.fairType}`}
            name="location"
            type="text"
            maxLength={150}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Plaza Libertad, Balneario Municipal o texto libre"
            className={ADMIN_INPUT_CLASS}
          />
          {fieldErrors.location?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#9B2226]">
              {fieldErrors.location[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={`fair-maps-${config.fairType}`}
            className={ADMIN_LABEL_CLASS}
          >
            Link de Google Maps (opcional)
          </label>
          <input
            id={`fair-maps-${config.fairType}`}
            name="mapsUrl"
            type="url"
            maxLength={500}
            defaultValue={config.mapsUrl ?? ""}
            placeholder="https://maps.app.goo.gl/..."
            className={ADMIN_INPUT_CLASS}
          />
          {fieldErrors.mapsUrl?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#9B2226]">
              {fieldErrors.mapsUrl[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={`fair-whatsapp-${config.fairType}`}
            className={ADMIN_LABEL_CLASS}
          >
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-brand-green" aria-hidden="true" />
              WhatsApp de inscripción *
            </span>
          </label>
          <input
            id={`fair-whatsapp-${config.fairType}`}
            name="whatsappNumber"
            type="tel"
            maxLength={25}
            defaultValue={formatWhatsappDisplay(config.whatsappNumber)}
            placeholder="Ej. 3794 819378"
            className={ADMIN_INPUT_CLASS}
          />
          <p className="mt-1 text-[11px] text-brand-muted">
            Código de área sin 0 y celular sin 15 (se usa en los botones de inscripción de la portada).
          </p>
          {fieldErrors.whatsappNumber?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#9B2226]">
              {fieldErrors.whatsappNumber[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="pt-1">
        <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Guardar {meta.label}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
