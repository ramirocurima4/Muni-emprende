import { z } from "zod";
import { usernameSchema } from "@/lib/validations/auth";
import { optionalText, whatsappNumberSchema } from "@/lib/validations/shared";

const uuid = (message: string) => z.string().uuid(message);

/** Roles que se pueden crear desde el panel. ENTREPRENEUR (legado) queda fuera a propósito. */
export const CREATABLE_ROLES = [
  "ADMIN",
  "MODERATOR",
  "USER_NEW",
  "USER_TRUSTED",
] as const;
export type CreatableRole = (typeof CREATABLE_ROLES)[number];

export const setEntrepreneurTrustSchema = z.object({
  entrepreneurId: uuid("Emprendimiento inválido."),
  trusted: z.boolean(),
});

export const setEntrepreneurStatusSchema = z
  .object({
    entrepreneurId: uuid("Emprendimiento inválido."),
    action: z.enum(["suspend", "reactivate"]),
    reason: z.string().trim().max(500, "El motivo es demasiado largo.").optional(),
  })
  .refine(
    (data) =>
      data.action === "reactivate" || (data.reason?.length ?? 0) >= 5,
    {
      message: "Escribí un motivo breve para la suspensión (mínimo 5 letras).",
      path: ["reason"],
    },
  );

export const resetPasswordSchema = z.object({
  userId: uuid("Usuario inválido."),
});

export const setUserActiveSchema = z.object({
  userId: uuid("Usuario inválido."),
  active: z.boolean(),
});

export const createUserSchema = z
  .object({
    username: usernameSchema,
    role: z.enum(CREATABLE_ROLES, { message: "Elegí el tipo de usuario." }),
    ownerName: optionalText(150, "El nombre es demasiado largo."),
    businessName: optionalText(150, "El nombre del emprendimiento es demasiado largo."),
    whatsappNumber: z.string().trim().optional(),
    neighborhood: optionalText(120, "El barrio o zona es demasiado largo."),
  })
  .superRefine((data, ctx) => {
    const needsBusiness = data.role === "USER_NEW" || data.role === "USER_TRUSTED";
    if (!needsBusiness) return;

    if (!data.ownerName || data.ownerName.length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["ownerName"],
        message: "Ingresá el nombre y apellido de la persona (mínimo 3 letras).",
      });
    }
    if (!data.businessName || data.businessName.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["businessName"],
        message: "Ingresá el nombre del emprendimiento.",
      });
    }
    const phone = whatsappNumberSchema.safeParse(data.whatsappNumber ?? "");
    if (!phone.success) {
      ctx.addIssue({
        code: "custom",
        path: ["whatsappNumber"],
        message: phone.error.issues[0]?.message ?? "WhatsApp inválido.",
      });
    }
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

const MAX_EXPO_FUTURE_DAYS = 366;

export const createExpoPhotoSchema = z.object({
  caption: z
    .string()
    .trim()
    .min(3, "Escribí una descripción corta (mínimo 3 letras).")
    .max(200, "La descripción no puede superar las 200 letras."),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí la fecha de la Expo.")
    .refine((val) => !Number.isNaN(Date.parse(`${val}T00:00:00.000Z`)), {
      message: "La fecha no es válida.",
    })
    .refine(
      (val) => {
        const ms = Date.parse(`${val}T00:00:00.000Z`);
        const limit = Date.now() + MAX_EXPO_FUTURE_DAYS * 24 * 60 * 60 * 1000;
        return ms >= Date.parse("2020-01-01T00:00:00.000Z") && ms <= limit;
      },
      { message: "La fecha está fuera de rango." },
    ),
});

export const expoPhotoIdSchema = z.object({
  id: uuid("Foto inválida."),
});

export const setExpoPhotoPublishedSchema = z.object({
  id: uuid("Foto inválida."),
  published: z.boolean(),
});

const LIKE_MAX = 100;

export const entrepreneursFilterSchema = z.object({
  q: z
    .string()
    .trim()
    .max(LIKE_MAX)
    .optional()
    .catch(undefined)
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  estado: z
    .enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"])
    .optional()
    .catch(undefined),
  permiso: z.enum(["NEW", "TRUSTED"]).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).max(500).catch(1),
});

export const auditFilterSchema = z.object({
  tipo: z
    .enum(["USER", "ENTREPRENEUR", "PRODUCT", "CATEGORY", "EXPO_PHOTO"])
    .optional()
    .catch(undefined),
  q: z
    .string()
    .trim()
    .max(LIKE_MAX)
    .optional()
    .catch(undefined)
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  pagina: z.coerce.number().int().min(1).max(500).catch(1),
});

export type EntrepreneursFilter = z.infer<typeof entrepreneursFilterSchema>;
export type AuditFilter = z.infer<typeof auditFilterSchema>;
