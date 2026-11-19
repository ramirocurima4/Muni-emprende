/**
 * Etiquetas en castellano claro para todo lo que se muestra en /admin (cero jerga técnica).
 */

export type Tone = "green" | "amber" | "red" | "sky" | "neutral";

export const TONE_CLASSES: Record<Tone, string> = {
  green: "border-brand-green/30 bg-brand-green-soft text-brand-green-dark",
  amber: "border-brand-amber/50 bg-brand-amber-soft text-brand-amber-text",
  red: "border-[#D98282] bg-[#FDF2F2] text-[#7A1C1C]",
  sky: "border-brand-sky/40 bg-brand-sky-light text-brand-sky-dark",
  neutral: "border-brand-border bg-brand-cream text-brand-muted",
};

export const ENTREPRENEUR_STATUS_LABELS: Record<
  string,
  { label: string; tone: Tone }
> = {
  PENDING: { label: "Por habilitar", tone: "amber" },
  APPROVED: { label: "Activo", tone: "green" },
  REJECTED: { label: "Con correcciones", tone: "red" },
  SUSPENDED: { label: "Suspendido", tone: "red" },
};

export const PRODUCT_STATUS_LABELS: Record<
  string,
  { label: string; tone: Tone }
> = {
  PENDING: { label: "En revisión", tone: "amber" },
  APPROVED: { label: "Publicado", tone: "green" },
  PAUSED: { label: "Agotado hoy", tone: "sky" },
  REJECTED: { label: "Pidió corrección", tone: "red" },
  SUSPENDED: { label: "Pausado por la Muni", tone: "red" },
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administración",
  MODERATOR: "Moderación (reservado)",
  USER_NEW: "Con revisión previa",
  USER_TRUSTED: "Publicación directa",
  ENTREPRENEUR: "Con revisión previa",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  USER: "Usuario",
  ENTREPRENEUR: "Emprendimiento",
  PRODUCT: "Producto",
  CATEGORY: "Rubro",
  EXPO_PHOTO: "Foto de Expo",
  FAIR_CONFIG: "Cartelera de Feria",
  FAIR_ALBUM: "Crónica de Feria",
  SYSTEM_CONFIG: "Configuración Institucional",
};

export const AUDIT_ACTION_LABELS: Record<string, { label: string; tone: Tone }> =
  {
    REGISTER_PENDING: { label: "Se registró un emprendimiento", tone: "amber" },
    SEED_APPROVE: { label: "Alta inicial del sistema", tone: "neutral" },
    APPROVE_ENTREPRENEUR: { label: "Habilitó un emprendimiento", tone: "green" },
    REJECT_ENTREPRENEUR: {
      label: "Pidió corrección de un emprendimiento",
      tone: "red",
    },
    SUSPEND_ENTREPRENEUR: { label: "Suspendió un emprendimiento", tone: "red" },
    REACTIVATE_ENTREPRENEUR: {
      label: "Reactivó un emprendimiento",
      tone: "green",
    },
    SET_ENTREPRENEUR_TRUST: {
      label: "Cambió el permiso de publicación",
      tone: "sky",
    },
    UPDATE_ENTREPRENEUR_PROFILE: {
      label: "Actualizó los datos del emprendimiento",
      tone: "neutral",
    },
    CREATE_PRODUCT_PENDING: { label: "Envió un producto a revisión", tone: "amber" },
    CREATE_PRODUCT_AUTO_APPROVED: {
      label: "Publicó un producto directo",
      tone: "green",
    },
    UPDATE_PRODUCT_PENDING: {
      label: "Editó un producto (vuelve a revisión)",
      tone: "amber",
    },
    UPDATE_PRODUCT_AUTO_APPROVED: {
      label: "Editó un producto publicado",
      tone: "neutral",
    },
    DELETE_PRODUCT: { label: "Eliminó un producto", tone: "red" },
    PAUSE_PRODUCT: { label: "Marcó un producto como agotado", tone: "sky" },
    RESUME_PRODUCT: { label: "Marcó un producto como disponible", tone: "sky" },
    BUMP_PRODUCT_TODAY: {
      label: "Activó tanda para hoy (subió arriba)",
      tone: "green",
    },
    APPROVE_PRODUCT: { label: "Aprobó un producto", tone: "green" },
    REJECT_PRODUCT: { label: "Pidió corrección de un producto", tone: "red" },
    SUSPEND_PRODUCT: { label: "Pausó un producto", tone: "red" },
    REACTIVATE_PRODUCT: { label: "Reactivó un producto", tone: "green" },
    CREATE_USER: { label: "Creó un usuario", tone: "sky" },
    RESET_PASSWORD: { label: "Blanqueó una contraseña", tone: "amber" },
    SET_USER_ACTIVE: { label: "Cambió el acceso de un usuario", tone: "sky" },
    CREATE_EXPO_PHOTO: { label: "Subió una foto de Expo", tone: "green" },
    SET_EXPO_PHOTO_PUBLISHED: {
      label: "Mostró u ocultó una foto de Expo",
      tone: "sky",
    },
    DELETE_EXPO_PHOTO: { label: "Eliminó una foto de Expo", tone: "red" },
    UPDATE_FAIR_CONFIG: {
      label: "Actualizó la cartelera de feria",
      tone: "sky",
    },
    CREATE_FAIR_ALBUM: {
      label: "Publicó una crónica de feria",
      tone: "green",
    },
    SET_FAIR_ALBUM_PUBLISHED: {
      label: "Mostró u ocultó una crónica de feria",
      tone: "sky",
    },
    DELETE_FAIR_ALBUM: {
      label: "Eliminó una crónica de feria",
      tone: "red",
    },
    UPDATE_SYSTEM_CONFIG: {
      label: "Actualizó la configuración institucional",
      tone: "sky",
    },
  };

export function describeAuditAction(action: string): {
  label: string;
  tone: Tone;
} {
  return AUDIT_ACTION_LABELS[action] ?? { label: action, tone: "neutral" };
}

/** Mapeo inverso para el buscador de actividad: texto → acciones cuyo rótulo lo contiene. */
export function findAuditActionsByText(text: string): string[] {
  const needle = normalizeForSearch(text);
  return Object.entries(AUDIT_ACTION_LABELS)
    .filter(([, value]) => normalizeForSearch(value.label).includes(needle))
    .map(([key]) => key);
}

export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const AR_DATE_TIME = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

const AR_DATE = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

const AR_DATE_LONG_UTC = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDateTime = (date: Date) => AR_DATE_TIME.format(date);
export const formatDate = (date: Date) => AR_DATE.format(date);

/** Fechas tipo `DATE` (sin hora) se formatean en UTC para que no se corran de día. */
export const formatEventDateLong = (date: Date) => AR_DATE_LONG_UTC.format(date);

/** `5493777554433` → `3777 554433` (código de área + número). */
export function formatWhatsappDisplay(normalized: string): string {
  const national = normalized.replace(/^549/, "");
  if (national.length < 10) return normalized;
  return `${national.slice(0, national.length - 6)} ${national.slice(-6)}`;
}
