import "@/docs/zod-openapi";

import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

export const bearerAuth = registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Token JWT obtido no login ou confirm-login",
});

const PORT = process.env.PORT ?? 3002;

export function generateOpenAPIDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: "3.0.3",
        info: {
            title: "Forbook API",
            version: "1.0.0",
            description: "Documentação da API Forbook — marketplace de livros usados.",
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: "Servidor local",
            },
        ],
        security: [],
    });
}
