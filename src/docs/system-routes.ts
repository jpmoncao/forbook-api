import { registerSystemPath } from "@/docs/documented-router";
import { healthResponseSchema } from "@/schemas/responses/entities.schema";

registerSystemPath("get", "/health", {
    summary: "Health check",
    description: "Verifica se a API está em execução",
    tags: ["System"],
    responses: {
        200: healthResponseSchema,
    },
});
