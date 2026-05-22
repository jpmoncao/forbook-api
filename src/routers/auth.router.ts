import AuthController from "@/controllers/auth.controller";
import { createDocumentedRouter } from "@/docs/documented-router";
import { z } from "@/docs/zod-openapi";
import { confirmLoginBodySchema, loginBodySchema } from "@/schemas/auth.schema";
import { confirmLoginResponseSchema, loginResponseSchema } from "@/schemas/responses/entities.schema";

const authRoutes = createDocumentedRouter("/auth");
const controller = new AuthController();

authRoutes.post(
    "/login",
    {
        summary: "Iniciar login",
        description: "Autentica com e-mail e senha. Pode retornar tokens ou solicitar verificação por e-mail.",
        body: loginBodySchema,
        responses: {
            200: loginResponseSchema,
        },
    },
    controller.login
);

authRoutes.post(
    "/confirm-login",
    {
        summary: "Confirmar login com código",
        description: "Confirma o login com o código de verificação enviado por e-mail.",
        body: confirmLoginBodySchema,
        responses: {
            200: confirmLoginResponseSchema,
        },
    },
    controller.confirmLogin
);

authRoutes.get(
    "/verify-email",
    {
        summary: "Verificar e-mail",
        description: "Valida o código de verificação de e-mail via link. Retorna página HTML.",
        query: z.object({
            code: z.string().min(1),
        }),
        responses: {
            200: {
                description: "Página HTML com resultado da verificação",
                contentType: "text/html",
            },
            400: {
                description: "Link inválido ou código ausente",
                contentType: "text/html",
            },
        },
    },
    controller.verifyEmailCode
);

export default authRoutes.router;
