import UserController from "../controllers/user.controller";
import { createDocumentedRouter } from "@/docs/documented-router";
import { addressCreateSchema, addressUpdateBodySchema } from "@/schemas/address.schema";
import { userCreateBodySchema, userUpdateBodySchema } from "@/schemas/user.schema";
import {
    addressResponseEnvelopeSchema,
    createUserResponseSchema,
    deleteMessageResponseSchema,
    userResponseEnvelopeSchema,
    usersListResponseSchema,
    wishlistResponseSchema,
} from "@/schemas/responses/entities.schema";

const userRoutes = createDocumentedRouter("/users");
const controller = new UserController();

userRoutes.get(
    "/me",
    {
        summary: "Obter usuário autenticado",
        auth: true,
        responses: {
            200: userResponseEnvelopeSchema,
        },
    },
    controller.getUserMe
);

userRoutes.get(
    "/:id/wishlist",
    {
        summary: "Listar lista de desejos",
        auth: true,
        responses: {
            200: wishlistResponseSchema,
        },
    },
    controller.getUserWishlist
);

userRoutes.get(
    "/:id",
    {
        summary: "Obter usuário por ID",
        auth: true,
        responses: {
            200: userResponseEnvelopeSchema,
        },
    },
    controller.getUserById
);

userRoutes.get(
    "/",
    {
        summary: "Listar usuários",
        auth: true,
        responses: {
            200: usersListResponseSchema,
        },
    },
    controller.getAllUsers
);

userRoutes.post(
    "/:id/wishlist/:bookId",
    {
        summary: "Adicionar livro à lista de desejos",
        auth: true,
        responses: {
            200: wishlistResponseSchema,
        },
    },
    controller.addBookToWishlist
);

userRoutes.post(
    "/:id/address",
    {
        summary: "Criar endereço",
        auth: true,
        body: addressCreateSchema,
        responses: {
            200: addressResponseEnvelopeSchema,
        },
    },
    controller.createAddress
);

userRoutes.patch(
    "/:id/address/:addressId/default",
    {
        summary: "Definir endereço padrão",
        auth: true,
        responses: {
            200: addressResponseEnvelopeSchema,
        },
    },
    controller.setDefaultAddress
);

userRoutes.put(
    "/:id/address/:addressId",
    {
        summary: "Atualizar endereço",
        auth: true,
        body: addressUpdateBodySchema,
        responses: {
            200: addressResponseEnvelopeSchema,
        },
    },
    controller.updateAddress
);

userRoutes.delete(
    "/:id/address/:addressId",
    {
        summary: "Remover endereço",
        auth: true,
        responses: {
            200: deleteMessageResponseSchema,
        },
    },
    controller.deleteAddress
);

userRoutes.post(
    "/",
    {
        summary: "Criar usuário",
        body: userCreateBodySchema,
        responses: {
            201: createUserResponseSchema,
        },
    },
    controller.createUser
);

userRoutes.put(
    "/me",
    {
        summary: "Atualizar usuário autenticado",
        auth: true,
        body: userUpdateBodySchema,
        responses: {
            200: userResponseEnvelopeSchema,
        },
    },
    controller.updateUser
);

userRoutes.delete(
    "/:id/wishlist/:bookId",
    {
        summary: "Remover livro da lista de desejos",
        auth: true,
        responses: {
            200: wishlistResponseSchema,
        },
    },
    controller.removeBookFromWishlist
);

export default userRoutes.router;
