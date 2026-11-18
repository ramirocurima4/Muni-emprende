import { z } from "zod";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Ingresá un nombre de usuario de al menos 3 caracteres.")
  .max(60, "El nombre de usuario no puede superar los 60 caracteres.")
  .transform((v) => v.toLowerCase())
  .refine((v) => /^[a-z0-9._-]+$/.test(v), {
    message:
      "Usá solo letras, números, puntos, guiones o guión bajo (sin espacios).",
  });

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Ingresá tu nombre de usuario.")
    .max(60, "El nombre de usuario es demasiado largo.")
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(100, "La contraseña es demasiado larga."),
});

export const registerEntrepreneurSchema = z
  .object({
    ownerName: z
      .string()
      .trim()
      .min(3, "Ingresá tu nombre y apellido (mínimo 3 caracteres).")
      .max(120, "El nombre es demasiado largo."),
    businessName: z
      .string()
      .trim()
      .min(2, "Ingresá el nombre de tu emprendimiento.")
      .max(120, "El nombre del emprendimiento es demasiado largo."),
    username: usernameSchema,
    email: z
      .string()
      .trim()
      .max(255, "El correo electrónico es demasiado largo.")
      .optional()
      .transform((val) => (val && val.length > 0 ? val.toLowerCase() : undefined))
      .refine(
        (val) => val === undefined || z.string().email().safeParse(val).success,
        {
          message:
            "Si ingresás un correo electrónico, verificá que sea válido.",
        },
      ),
    whatsappNumber: z
      .string()
      .trim()
      .min(8, "El WhatsApp es obligatorio. Ingresá tu número con característica.")
      .max(25, "El número de WhatsApp es demasiado largo.")
      .refine(
        (val) => {
          const normalized = normalizeWhatsappNumber(val);
          return /^549\d{10,11}$/.test(normalized);
        },
        {
          message:
            "Ingresá un número argentino válido con código de área (ej. 3777 554433).",
        },
      ),
    neighborhood: z
      .string()
      .trim()
      .max(120, "El barrio o zona no puede superar los 120 caracteres.")
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    bio: z
      .string()
      .trim()
      .max(600, "La descripción breve no puede superar los 600 caracteres.")
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(100, "La contraseña es demasiado larga."),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterEntrepreneurInput = z.infer<
  typeof registerEntrepreneurSchema
>;
