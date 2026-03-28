import { z } from "zod";

export const loginBodySchema = z
    .object({
        email: z.email("Email inválido"),
        password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    })
    .strict();

export const confirmLoginBodySchema = z
    .object({
        email: z.email(),
        code: z
            .string("Código deve ser um texto")
            .length(6, "Código deve ter 6 caracteres")
            .regex(/^[a-zA-Z0-9]{6}$/, "Código deve ser alfanumérico (6 caracteres)"),
    })
    .strict();

export type LoginBody = z.infer<typeof loginBodySchema>;
export type ConfirmLoginBody = z.infer<typeof confirmLoginBodySchema>;
