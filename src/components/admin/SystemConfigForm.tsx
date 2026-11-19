"use client";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Save,
  ShieldAlert,
  Sprout,
  Store,
} from "lucide-react";
import { useActionState, useState } from "react";
import {
  updateSystemConfigAction,
  type SystemConfigActionState,
} from "@/app/actions/admin-config";
import { formatWhatsappDisplay } from "@/lib/admin-labels";
import { PRESET_FAIR_LOCATIONS } from "@/lib/fairs";
import type { PublicSystemConfig } from "@/lib/system-config";
import {
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  BTN_PRIMARY,
  Panel,
  SectionTitle,
} from "./ui";

const initialState: SystemConfigActionState = {};

export function SystemConfigForm({ config }: { config: PublicSystemConfig }) {
  const [state, formAction, isPending] = useActionState(
    updateSystemConfigAction,
    initialState,
  );

  const expo = config.fairs.EXPO_EMPRENDEDORES;
  const mercado = config.fairs.MERCADO_SANROQUENO;

  const [expoNextDate, setExpoNextDate] = useState(expo.nextDate ?? "");
  const [expoLocation, setExpoLocation] = useState(expo.location);
  const [mercadoNextDate, setMercadoNextDate] = useState(
    mercado.nextDate ?? "",
  );
  const [mercadoLocation, setMercadoLocation] = useState(mercado.location);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state.ok === false && state.error ? (
        <div
          role="alert"
          className="rounded-2xl border border-[#D98282] bg-[#FDF2F2] px-4 py-3 text-sm font-semibold text-[#7A1C1C]"
        >
          {state.error}
        </div>
      ) : null}

      {state.ok && state.savedAt ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-2xl border border-brand-green/40 bg-brand-green-soft px-4 py-3 text-sm font-bold text-brand-green-dark"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            Configuración institucional actualizada en vivo en la portada, el
            pie de página y el acceso de usuarios.
          </span>
        </div>
      ) : null}

      {/* 1. Áreas Municipales y Números Oficiales de WhatsApp */}
      <Panel>
        <SectionTitle
          title="1. Números Oficiales de WhatsApp por Área"
          description="Actualizá los teléfonos de contacto directo sin tocar código. Se normalizan automáticamente al formato de WhatsApp Argentina."
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Dirección de Empleo */}
          <div className="space-y-3 rounded-2xl border border-brand-sky/40 bg-brand-sky-tint/55 p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-amber-soft px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-amber-text">
                <Store className="h-3.5 w-3.5" aria-hidden="true" />
                Dirección de Empleo
              </span>
            </div>
            <div>
              <label htmlFor="employment-whatsapp" className={ADMIN_LABEL_CLASS}>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle
                    className="h-4 w-4 text-brand-green"
                    aria-hidden="true"
                  />
                  WhatsApp oficial de Empleo y Expo Emprendedores *
                </span>
              </label>
              <input
                id="employment-whatsapp"
                name="employmentWhatsapp"
                type="tel"
                maxLength={25}
                defaultValue={formatWhatsappDisplay(config.employmentWhatsapp)}
                placeholder="Ej. 3794 819378"
                className={ADMIN_INPUT_CLASS}
              />
              <p className="mt-1.5 text-xs leading-relaxed text-brand-muted">
                Alimenta dinámicamente: <strong>(1)</strong> la tarjeta de
                inscripción a la Expo Emprendedores en la portada,{" "}
                <strong>(2)</strong> el botón de consultas del footer y{" "}
                <strong>(3)</strong> el enlace <em>“¿Olvidaste tu clave?”</em> en{" "}
                <code>/login</code>.
              </p>
              {fieldErrors.employmentWhatsapp?.[0] ? (
                <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                  {fieldErrors.employmentWhatsapp[0]}
                </p>
              ) : null}
            </div>
          </div>

          {/* Área de Producción / Mercado Sanroqueño */}
          <div className="space-y-3 rounded-2xl border border-brand-sky/40 bg-brand-sky-tint/55 p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green-soft px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-green-dark">
                <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
                Área de Producción / Mercado Sanroqueño
              </span>
            </div>
            <div>
              <label htmlFor="production-whatsapp" className={ADMIN_LABEL_CLASS}>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle
                    className="h-4 w-4 text-brand-green"
                    aria-hidden="true"
                  />
                  WhatsApp oficial de Producción / Mercado Sanroqueño *
                </span>
              </label>
              <input
                id="production-whatsapp"
                name="productionWhatsapp"
                type="tel"
                maxLength={25}
                defaultValue={formatWhatsappDisplay(config.productionWhatsapp)}
                placeholder="Ej. 3794 819378"
                className={ADMIN_INPUT_CLASS}
              />
              <p className="mt-1.5 text-xs leading-relaxed text-brand-muted">
                Alimenta dinámicamente el botón de inscripción en la portada para
                productores locales de frutas, verduras frescas, huevos caseros
                y granja.
              </p>
              {fieldErrors.productionWhatsapp?.[0] ? (
                <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                  {fieldErrors.productionWhatsapp[0]}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Panel>

      {/* 2. Cartelera de Próximas Ferias */}
      <Panel>
        <SectionTitle
          title="2. Cartelera de Próximas Ferias"
          description="Configurá la fecha, horario, lugar y enlace de ubicación en Google Maps que ven los vecinos en la portada."
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Expo Emprendedores */}
          <div className="space-y-4 rounded-2xl border border-brand-sky/40 bg-brand-sky-tint/55 p-4">
            <div>
              <span className="inline-flex rounded-full bg-brand-amber-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-amber-text">
                Dirección de Empleo
              </span>
              <h3 className="mt-1.5 text-base font-extrabold text-brand-ink">
                Expo Emprendedores
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="cfg-expo-date" className={ADMIN_LABEL_CLASS}>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays
                        className="h-3.5 w-3.5 text-brand-green"
                        aria-hidden="true"
                      />
                      Próxima fecha
                    </span>
                  </label>
                  {expoNextDate ? (
                    <button
                      type="button"
                      onClick={() => setExpoNextDate("")}
                      className="text-[11px] font-bold text-brand-sky-dark hover:underline"
                    >
                      A confirmar
                    </button>
                  ) : null}
                </div>
                <input
                  id="cfg-expo-date"
                  name="expoNextDate"
                  type="date"
                  value={expoNextDate}
                  onChange={(e) => setExpoNextDate(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                />
                {fieldErrors.expoNextDate?.[0] ? (
                  <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                    {fieldErrors.expoNextDate[0]}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="cfg-expo-schedule" className={ADMIN_LABEL_CLASS}>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock
                      className="h-3.5 w-3.5 text-brand-green"
                      aria-hidden="true"
                    />
                    Horario *
                  </span>
                </label>
                <input
                  id="cfg-expo-schedule"
                  name="expoSchedule"
                  type="text"
                  maxLength={80}
                  defaultValue={expo.schedule}
                  placeholder="17:00 a 21:00 hs"
                  className={ADMIN_INPUT_CLASS}
                />
                {fieldErrors.expoSchedule?.[0] ? (
                  <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                    {fieldErrors.expoSchedule[0]}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="cfg-expo-location" className={ADMIN_LABEL_CLASS}>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin
                      className="h-3.5 w-3.5 text-brand-green"
                      aria-hidden="true"
                    />
                    Lugar *
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_FAIR_LOCATIONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExpoLocation(preset)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                        expoLocation.trim() === preset
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
                id="cfg-expo-location"
                name="expoLocation"
                type="text"
                maxLength={150}
                value={expoLocation}
                onChange={(e) => setExpoLocation(e.target.value)}
                placeholder="Plaza Libertad, Balneario Municipal o texto libre"
                className={ADMIN_INPUT_CLASS}
              />
              {fieldErrors.expoLocation?.[0] ? (
                <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                  {fieldErrors.expoLocation[0]}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="cfg-expo-maps" className={ADMIN_LABEL_CLASS}>
                Link de Google Maps (opcional)
              </label>
              <input
                id="cfg-expo-maps"
                name="expoMapsUrl"
                type="url"
                maxLength={500}
                defaultValue={expo.mapsUrl ?? ""}
                placeholder="https://maps.app.goo.gl/..."
                className={ADMIN_INPUT_CLASS}
              />
              {fieldErrors.expoMapsUrl?.[0] ? (
                <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                  {fieldErrors.expoMapsUrl[0]}
                </p>
              ) : null}
            </div>
          </div>

          {/* Mercado Sanroqueño */}
          <div className="space-y-4 rounded-2xl border border-brand-sky/40 bg-brand-sky-tint/55 p-4">
            <div>
              <span className="inline-flex rounded-full bg-brand-green-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-green-dark">
                Dirección de Producción
              </span>
              <h3 className="mt-1.5 text-base font-extrabold text-brand-ink">
                Mercado Sanroqueño
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="cfg-mercado-date" className={ADMIN_LABEL_CLASS}>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays
                        className="h-3.5 w-3.5 text-brand-green"
                        aria-hidden="true"
                      />
                      Próxima fecha
                    </span>
                  </label>
                  {mercadoNextDate ? (
                    <button
                      type="button"
                      onClick={() => setMercadoNextDate("")}
                      className="text-[11px] font-bold text-brand-sky-dark hover:underline"
                    >
                      A confirmar
                    </button>
                  ) : null}
                </div>
                <input
                  id="cfg-mercado-date"
                  name="mercadoNextDate"
                  type="date"
                  value={mercadoNextDate}
                  onChange={(e) => setMercadoNextDate(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                />
                {fieldErrors.mercadoNextDate?.[0] ? (
                  <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                    {fieldErrors.mercadoNextDate[0]}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="cfg-mercado-schedule"
                  className={ADMIN_LABEL_CLASS}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Clock
                      className="h-3.5 w-3.5 text-brand-green"
                      aria-hidden="true"
                    />
                    Horario *
                  </span>
                </label>
                <input
                  id="cfg-mercado-schedule"
                  name="mercadoSchedule"
                  type="text"
                  maxLength={80}
                  defaultValue={mercado.schedule}
                  placeholder="08:00 a 13:00 hs"
                  className={ADMIN_INPUT_CLASS}
                />
                {fieldErrors.mercadoSchedule?.[0] ? (
                  <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                    {fieldErrors.mercadoSchedule[0]}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="cfg-mercado-location"
                  className={ADMIN_LABEL_CLASS}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin
                      className="h-3.5 w-3.5 text-brand-green"
                      aria-hidden="true"
                    />
                    Lugar *
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_FAIR_LOCATIONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMercadoLocation(preset)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                        mercadoLocation.trim() === preset
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
                id="cfg-mercado-location"
                name="mercadoLocation"
                type="text"
                maxLength={150}
                value={mercadoLocation}
                onChange={(e) => setMercadoLocation(e.target.value)}
                placeholder="Plaza Libertad, Balneario Municipal o texto libre"
                className={ADMIN_INPUT_CLASS}
              />
              {fieldErrors.mercadoLocation?.[0] ? (
                <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                  {fieldErrors.mercadoLocation[0]}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="cfg-mercado-maps" className={ADMIN_LABEL_CLASS}>
                Link de Google Maps (opcional)
              </label>
              <input
                id="cfg-mercado-maps"
                name="mercadoMapsUrl"
                type="url"
                maxLength={500}
                defaultValue={mercado.mapsUrl ?? ""}
                placeholder="https://maps.app.goo.gl/..."
                className={ADMIN_INPUT_CLASS}
              />
              {fieldErrors.mercadoMapsUrl?.[0] ? (
                <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                  {fieldErrors.mercadoMapsUrl[0]}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Panel>

      {/* 3. Datos Institucionales y Aviso Legal */}
      <Panel>
        <SectionTitle
          title="3. Datos Institucionales y Aviso Legal"
          description="Autoridad municipal exhibida en el banner institucional y texto legal del pie de página."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cfg-authority-title" className={ADMIN_LABEL_CLASS}>
              <span className="inline-flex items-center gap-1.5">
                <Building2
                  className="h-4 w-4 text-brand-green"
                  aria-hidden="true"
                />
                Cargo / Título institucional *
              </span>
            </label>
            <input
              id="cfg-authority-title"
              name="authorityTitle"
              type="text"
              maxLength={120}
              defaultValue={config.authorityTitle}
              placeholder="Intendente de San Roque"
              className={ADMIN_INPUT_CLASS}
            />
            {fieldErrors.authorityTitle?.[0] ? (
              <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                {fieldErrors.authorityTitle[0]}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="cfg-authority-name" className={ADMIN_LABEL_CLASS}>
              Nombre de la autoridad municipal *
            </label>
            <input
              id="cfg-authority-name"
              name="authorityName"
              type="text"
              maxLength={120}
              defaultValue={config.authorityName}
              placeholder="Cr. Raúl Pelozo"
              className={ADMIN_INPUT_CLASS}
            />
            {fieldErrors.authorityName?.[0] ? (
              <p className="mt-1 text-xs font-semibold text-[#9B2226]">
                {fieldErrors.authorityName[0]}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="cfg-legal-disclaimer" className={ADMIN_LABEL_CLASS}>
            <span className="inline-flex items-center gap-1.5">
              <ShieldAlert
                className="h-4 w-4 text-brand-green"
                aria-hidden="true"
              />
              Mensaje de aviso oficial / descargo legal *
            </span>
          </label>
          <textarea
            id="cfg-legal-disclaimer"
            name="legalDisclaimer"
            rows={3}
            maxLength={600}
            defaultValue={config.legalDisclaimer}
            className={ADMIN_INPUT_CLASS}
          />
          {fieldErrors.legalDisclaimer?.[0] ? (
            <p className="mt-1 text-xs font-semibold text-[#9B2226]">
              {fieldErrors.legalDisclaimer[0]}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Guardando configuración...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                <span>Guardar Configuración Institucional</span>
              </>
            )}
          </button>
        </div>
      </Panel>
    </form>
  );
}
