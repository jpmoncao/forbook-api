import { UserBookCondition, UserBookStatus } from "@/generated/prisma/enums";
import { catalogBookCreateBodySchema } from "@/schemas/catalogBook.schema";
import { z } from "zod";

export const userBookCreateBodySchema = z
    .object({
        condition: z.enum(UserBookCondition, "Condição deve ser um valor válido: NEW, LIKE_NEW, GOOD, ACCEPTABLE, POOR"),
        price: z.number("Preço deve ser um número").min(0, "Preço deve ser maior que 0"),
        description: z.string("Descrição deve ser um texto").trim().min(1, "Descrição tem que ter no mínimo 1 caractere").max(1000, "Descrição tem que ter no máximo 1000 caracteres"),
        status: z.enum(UserBookStatus, "Status deve ser um valor válido: ACTIVE, INACTIVE"),
        catalogBook: catalogBookCreateBodySchema.strict(),
        mainImageId: z.string("ID da imagem principal deve ser um texto").trim().uuid("ID da imagem principal deve ser um UUID válido"),
        galleryImages: z.array(z.string("ID da imagem deve ser um texto").trim().uuid("ID da imagem deve ser um UUID válido")).max(5, "Máximo de 5 imagens na galeria").optional(),
    })
    .strict();

export const userBookCreateWithUserIdBodySchema = userBookCreateBodySchema.extend({
    userId: z.string("ID do usuário deve ser um texto").trim().uuid("ID do usuário deve ser um UUID válido"),
}).strict();

export const userBookUpdateBodySchema = z
    .object({
        price: z.number("Preço deve ser um número").min(0, "Preço deve ser maior que 0").optional(),
        description: z.string("Descrição deve ser um texto").trim().min(1, "Descrição tem que ter no mínimo 1 caractere").max(1000, "Descrição tem que ter no máximo 1000 caracteres").optional(),
        status: z.enum(UserBookStatus, "Status deve ser um valor válido: ACTIVE, INACTIVE").optional(),
        mainImageId: z.string("ID da imagem principal deve ser um texto").trim().uuid("ID da imagem principal deve ser um UUID válido").optional(),
        galleryImages: z.array(z.string("ID da imagem deve ser um texto").trim().uuid("ID da imagem deve ser um UUID válido")).max(5, "Máximo de 5 imagens na galeria").optional(),
    })
    .strict();

export const userBookUpdateWithUserIdBodySchema = userBookUpdateBodySchema.extend({
    userId: z.string("ID do usuário deve ser um texto").trim().uuid("ID do usuário deve ser um UUID válido"),
}).strict();

export type UserBookCreateBody = z.infer<typeof userBookCreateBodySchema>;
export type UserBookCreateWithUserIdBody = z.infer<typeof userBookCreateWithUserIdBodySchema>;
export type UserBookUpdateBody = z.infer<typeof userBookUpdateBodySchema>;
export type UserBookUpdateWithUserIdBody = z.infer<typeof userBookUpdateWithUserIdBodySchema>;
