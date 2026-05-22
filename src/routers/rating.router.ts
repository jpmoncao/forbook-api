import RatingController from "@/controllers/rating.controller";
import { createDocumentedRouter } from "@/docs/documented-router";
import { ratingCreateBodySchema, ratingUpdateBodySchema } from "@/schemas/rating.schema";
import {
    createRatingResponseSchema,
    deleteMessageResponseSchema,
    ratingResponseEnvelopeSchema,
    ratingsListResponseSchema,
} from "@/schemas/responses/entities.schema";

const ratingRoutes = createDocumentedRouter("/ratings");
const controller = new RatingController();

ratingRoutes.get(
    "/:userId/user",
    {
        summary: "Listar avaliações de um usuário",
        auth: true,
        responses: {
            200: ratingsListResponseSchema,
        },
    },
    controller.getRatingsByUserId
);

ratingRoutes.get(
    "/:id",
    {
        summary: "Obter avaliação por ID",
        auth: true,
        responses: {
            200: ratingResponseEnvelopeSchema,
        },
    },
    controller.getRatingById
);

ratingRoutes.post(
    "/",
    {
        summary: "Criar avaliação",
        auth: true,
        body: ratingCreateBodySchema,
        responses: {
            201: createRatingResponseSchema,
        },
    },
    controller.createRating
);

ratingRoutes.put(
    "/:id",
    {
        summary: "Atualizar avaliação",
        auth: true,
        body: ratingUpdateBodySchema,
        responses: {
            200: ratingResponseEnvelopeSchema,
        },
    },
    controller.updateRating
);

ratingRoutes.delete(
    "/:id",
    {
        summary: "Remover avaliação",
        auth: true,
        responses: {
            200: deleteMessageResponseSchema,
        },
    },
    controller.deleteRating
);

export default ratingRoutes.router;
