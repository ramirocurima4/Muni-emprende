import { z } from "zod";

export const approveEntitySchema = z.object({
  id: z.string().uuid("ID de registro inválido."),
});

export const rejectEntitySchema = z.object({
  id: z.string().uuid("ID de registro inválido."),
  rejectionReason: z
    .string()
    .trim()
    .min(
      5,
      "Debés ingresar un motivo de rechazo claro (mínimo 5 caracteres).",
    )
    .max(500, "El motivo de rechazo no puede superar los 500 caracteres."),
});

export type ApproveEntityInput = z.infer<typeof approveEntitySchema>;
export type RejectEntityInput = z.infer<typeof rejectEntitySchema>;
