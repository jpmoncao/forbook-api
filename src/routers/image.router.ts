import ImageController from "@/controllers/image.controller";
import { createDocumentedRouter } from "@/docs/documented-router";
import { multerMiddleware } from "@/middlewares/multer";
import { imageUploadResponseSchema } from "@/schemas/responses/entities.schema";

const imageRoutes = createDocumentedRouter("/images");
const controller = new ImageController();

imageRoutes.post(
    "/upload",
    {
        summary: "Enviar imagem",
        description: "Faz upload de uma imagem para uso em perfil ou anúncios.",
        auth: true,
        multipart: { fieldName: "image" },
        responses: {
            201: imageUploadResponseSchema,
        },
    },
    multerMiddleware.single("image"),
    controller.uploadImage
);

export default imageRoutes.router;
