import { z } from "zod";

const cepRegex = /^\d{5}-?\d{3}$/;
const ufRegex = /^[A-Z]{2}$/;

export const addressCreateSchema = z
    .object({
        street: z.string("Rua deve ser um texto").trim().min(1, "Rua é obrigatória"),
        number: z.string("Número deve ser um texto").trim().min(1, "Número é obrigatório"),
        complement: z.string("Complemento deve ser um texto").nullable(),
        neighborhood: z.string("Bairro deve ser um texto").trim().min(1, "Bairro é obrigatório"),
        city: z.string("Cidade deve ser um texto").trim().min(1, "Cidade é obrigatória"),
        state: z
            .string("Estado deve ser um texto")
            .trim()
            .transform((s) => s.toUpperCase())
            .pipe(z.string().regex(ufRegex, "Estado deve ser a sigla com 2 letras (ex: SP)")),
        zipCode: z
            .string("CEP deve ser um texto")
            .trim()
            .regex(cepRegex, "CEP inválido (use 00000-000 ou 00000000)"),
    })
    .strict();

export type AddressCreateBody = z.infer<typeof addressCreateSchema>;
