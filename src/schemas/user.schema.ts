import { z } from "zod";

const cepRegex = /^\d{5}-?\d{3}$/;
const ufRegex = /^[A-Z]{2}$/;

const addressCreateSchema = z
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

export const userCreateBodySchema = z
    .object({
        email: z.email("Email inválido"),
        password: z.string("Senha deve ser um texto").min(8, "Senha deve ter no mínimo 8 caracteres"),
        name: z.string("Nome deve ser um texto").trim().min(2, "Nome deve ter no mínimo 2 caracteres"),
        phoneNumber: z
            .string("Telefone deve ser um texto")
            .trim()
            .min(10, "Telefone inválido")
            .max(20, "Telefone inválido"),
        cpf: z
            .string("CPF deve ser um texto")
            .trim()
            .regex(/^\d{11}$/, "CPF deve conter 11 dígitos (apenas números)"),
        birthDate: z.coerce.date("Data de nascimento deve ser uma data válida"),
        address: addressCreateSchema,
    })
    .strict();

export const userUpdateBodySchema = z
    .object({
        name: z.string("Nome deve ser um texto").trim().min(2, "Nome deve ter no mínimo 2 caracteres").optional(),
        profileImageId: z.string("ID da imagem de perfil deve ser um texto").trim().uuid("ID da imagem de perfil deve ser um UUID válido").optional(),
    })
    .strict();

export type UserCreateBody = z.infer<typeof userCreateBodySchema>;
export type UserUpdateBody = z.infer<typeof userUpdateBodySchema>;
