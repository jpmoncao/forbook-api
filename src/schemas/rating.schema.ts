import { z } from "zod";

export const ratingCreateBodySchema = z
    .object({
        value: z
            .number("Nota deve ser um número")
            .int("Nota deve ser um número inteiro")
            .min(1, "Nota deve ser no mínimo 1")
            .max(5, "Nota deve ser no máximo 5"),
        comment: z
            .string("Comentário deve ser um texto")
            .trim()
            .min(1, "Comentário deve ter no mínimo 1 caractere")
            .max(2000, "Comentário deve ter no máximo 2000 caracteres"),
        ratedToId: z.string("ID do usuário avaliado deve ser um texto").trim().uuid("ID do usuário avaliado deve ser um UUID válido"),
    })
    .strict();

export const ratingCreateWithRatedByBodySchema = ratingCreateBodySchema.extend({
    ratedById: z.string("ID de quem avalia deve ser um texto").trim().uuid("ID de quem avalia deve ser um UUID válido"),
}).strict();

export const ratingUpdateBodySchema = z
    .object({
        value: z
            .number("Nota deve ser um número")
            .int("Nota deve ser um número inteiro")
            .min(1, "Nota deve ser no mínimo 1")
            .max(5, "Nota deve ser no máximo 5")
            .optional(),
        comment: z
            .string("Comentário deve ser um texto")
            .trim()
            .min(1, "Comentário deve ter no mínimo 1 caractere")
            .max(2000, "Comentário deve ter no máximo 2000 caracteres")
            .optional(),
    })
    .strict();

export type RatingCreateBody = z.infer<typeof ratingCreateBodySchema>;
export type RatingCreateWithRatedByBody = z.infer<typeof ratingCreateWithRatedByBodySchema>;
export type RatingUpdateBody = z.infer<typeof ratingUpdateBodySchema>;
