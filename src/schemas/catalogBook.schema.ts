import { z } from "zod";

export const catalogBookCreateBodySchema = z.
    object({
        isbn: z.string("ISBN deve ser um texto")
            .trim()
            .min(13, "Deve conter no mínimo 13 dígitos")
            .max(13, "Deve conter no máximo 13 digitos"),
        title: z.string("Titúlo deve ser um texto")
            .trim()
            .min(2, "Deve conter no mínimo 2 caracteres"),
        author: z.string("Autor deve ser um texto")
            .trim()
            .min(1, "Deve conter no mínimo 1 caracter")
            .max(255, "Deve conter no máximo 255 caracteres"),
        description: z.string("Descrição deve ser um texto")
            .trim()
            .min(1, "Deve conter no mínimo 1 caracter")
            .max(255, "Deve conter no máximo 255 caracteres"),
        year: z.number("Ano deve ser um número")
            .min(1900, "Deve conter no mínimo 1900")
            .max(new Date().getFullYear(), "Deve conter no máximo o ano atual"),
        publisher: z.string("Editora deve ser um texto")
            .trim()
            .min(1, "Deve conter no mínimo 1 caracter")
            .max(255, "Deve conter no máximo 255 caracteres")
    })
    .strict();

export const catalogBookUpdateBodySchema = z.
    object({
        description: z.string("Descrição deve ser um texto")
            .trim()
            .min(1, "Deve conter no mínimo 1 caracter")
            .max(255, "Deve conter no máximo 255 caracteres").optional()
    })
    .strict();

export type CatalogBookCreateBody = z.infer<typeof catalogBookCreateBodySchema>;
export type CatalogBookUpdateBody = z.infer<typeof catalogBookUpdateBodySchema>;
