import UserBookController from "@/controllers/userBook.controller";
import { createDocumentedRouter } from "@/docs/documented-router";
import { userBookCreateBodySchema, userBookUpdateBodySchema } from "@/schemas/userBook.schema";
import {
    createUserBookResponseSchema,
    userBookResponseEnvelopeSchema,
    userBooksListResponseSchema,
} from "@/schemas/responses/entities.schema";

const userBookRoutes = createDocumentedRouter("/user-books");
const controller = new UserBookController();

userBookRoutes.get(
    "/",
    {
        summary: "Listar anúncios de livros",
        auth: true,
        responses: {
            200: userBooksListResponseSchema,
        },
    },
    controller.getAllUserBooks
);

userBookRoutes.get(
    "/my",
    {
        summary: "Listar meus anúncios de livros",
        auth: true,
        responses: {
            200: userBooksListResponseSchema,
        },
    },
    controller.getMyUserBooks
);

userBookRoutes.get(
    "/:id",
    {
        summary: "Obter anúncio de livro por ID",
        auth: true,
        responses: {
            200: userBookResponseEnvelopeSchema,
        },
    },
    controller.getUserBookById
);

userBookRoutes.post(
    "/",
    {
        summary: "Criar anúncio de livro",
        auth: true,
        body: userBookCreateBodySchema,
        responses: {
            201: createUserBookResponseSchema,
        },
    },
    controller.createUserBook
);

userBookRoutes.put(
    "/:id",
    {
        summary: "Atualizar anúncio de livro",
        auth: true,
        body: userBookUpdateBodySchema,
        responses: {
            200: userBookResponseEnvelopeSchema,
        },
    },
    controller.updateUserBook
);

export default userBookRoutes.router;
