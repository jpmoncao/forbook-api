import CatalogBookController from "@/controllers/catalogBook.controller";
import { createDocumentedRouter } from "@/docs/documented-router";
import { catalogBookCreateBodySchema, catalogBookUpdateBodySchema } from "@/schemas/catalogBook.schema";
import { catalogBookResponseEnvelopeSchema } from "@/schemas/responses/entities.schema";

const catalogBookRoutes = createDocumentedRouter("/catalog-books");
const controller = new CatalogBookController();

catalogBookRoutes.get(
    "/:isbn",
    {
        summary: "Obter livro do catálogo por ISBN",
        auth: true,
        responses: {
            200: catalogBookResponseEnvelopeSchema,
        },
    },
    controller.getCatalogBook
);

catalogBookRoutes.post(
    "/",
    {
        summary: "Criar livro no catálogo",
        auth: true,
        body: catalogBookCreateBodySchema,
        responses: {
            201: catalogBookResponseEnvelopeSchema,
        },
    },
    controller.createCatalogBook
);

catalogBookRoutes.put(
    "/:isbn",
    {
        summary: "Atualizar livro do catálogo",
        auth: true,
        body: catalogBookUpdateBodySchema,
        responses: {
            200: catalogBookResponseEnvelopeSchema,
        },
    },
    controller.updateCatalogBook
);

export default catalogBookRoutes.router;
