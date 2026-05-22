import { RequestHandler, Router } from "express";
import { ResponseConfig, RouteConfig } from "@asteasolutions/zod-to-openapi";
import { ZodObject, ZodTypeAny } from "zod";

import { z } from "@/docs/zod-openapi";
import { bearerAuth, registry } from "@/docs/openapi";
import { validateBody } from "@/middlewares/validate-body";
import { validateToken } from "@/middlewares/validate-token";
import { errorResponseSchema, validationErrorResponseSchema } from "@/schemas/responses/common.schema";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type ResponseDefinition =
    | ZodTypeAny
    | {
          description?: string;
          schema?: ZodTypeAny;
          contentType?: "application/json" | "text/html";
          empty?: boolean;
      };

export type DocumentedRouteMeta = {
    summary: string;
    description?: string;
    tags?: string[];
    auth?: boolean;
    body?: ZodTypeAny;
    params?: ZodObject;
    query?: ZodObject;
    multipart?: { fieldName: string };
    responses: Partial<Record<number, ResponseDefinition>>;
};

export class DocumentedRouterBuilder {
    readonly router: Router;

    constructor(private readonly basePath: string) {
        this.router = Router();
    }

    get(path: string, meta: DocumentedRouteMeta, ...handlers: RequestHandler[]): this {
        registerRoute(this.router, this.basePath, "get", path, meta, handlers);
        return this;
    }

    post(path: string, meta: DocumentedRouteMeta, ...handlers: RequestHandler[]): this {
        registerRoute(this.router, this.basePath, "post", path, meta, handlers);
        return this;
    }

    put(path: string, meta: DocumentedRouteMeta, ...handlers: RequestHandler[]): this {
        registerRoute(this.router, this.basePath, "put", path, meta, handlers);
        return this;
    }

    patch(path: string, meta: DocumentedRouteMeta, ...handlers: RequestHandler[]): this {
        registerRoute(this.router, this.basePath, "patch", path, meta, handlers);
        return this;
    }

    delete(path: string, meta: DocumentedRouteMeta, ...handlers: RequestHandler[]): this {
        registerRoute(this.router, this.basePath, "delete", path, meta, handlers);
        return this;
    }
}

export function createDocumentedRouter(basePath: string): DocumentedRouterBuilder {
    return new DocumentedRouterBuilder(basePath);
}

function toOpenApiPath(expressPath: string): string {
    return expressPath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function inferParamsFromPath(path: string): ZodObject | undefined {
    const paramNames = [...path.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => match[1]);
    if (paramNames.length === 0) {
        return undefined;
    }

    const shape: Record<string, z.ZodString> = {};
    for (const name of paramNames) {
        shape[name] = z.string();
    }

    return z.object(shape);
}

function tagFromBasePath(basePath: string): string {
    const segment = basePath.replace(/^\//, "").split("/")[0] ?? "General";
    return segment
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
}

function buildSuccessResponses(responses: DocumentedRouteMeta["responses"]): RouteConfig["responses"] {
    const result: RouteConfig["responses"] = {};

    for (const [statusCode, definition] of Object.entries(responses)) {
        if (!definition) {
            continue;
        }

        if ("parse" in definition && typeof definition.parse === "function" && !("empty" in (definition as object))) {
            result[statusCode] = {
                description: "Resposta de sucesso",
                content: {
                    "application/json": {
                        schema: definition as ZodTypeAny,
                    },
                },
            };
            continue;
        }

        const meta = definition as Exclude<ResponseDefinition, ZodTypeAny>;

        if (meta.empty) {
            result[statusCode] = {
                description: meta.description ?? "Operação concluída com sucesso",
                content: {
                    "application/json": {
                        schema: z.object({ message: z.string() }),
                    },
                },
            };
            continue;
        }

        const contentType = meta.contentType ?? "application/json";
        const response: ResponseConfig = {
            description: meta.description ?? "Resposta de sucesso",
        };

        if (meta.schema) {
            response.content = {
                [contentType]: {
                    schema: meta.schema,
                },
            };
        }

        result[statusCode] = response;
    }

    return result;
}

function buildCommonErrorResponses(meta: DocumentedRouteMeta): RouteConfig["responses"] {
    const errors: RouteConfig["responses"] = {};

    if (meta.auth) {
        errors["401"] = {
            description: "Token inválido, expirado ou ausente",
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
        };
        errors["403"] = {
            description: "Sem permissão para acessar o recurso",
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
        };
    }

    if (meta.body) {
        errors["422"] = {
            description: "Corpo da requisição inválido",
            content: {
                "application/json": {
                    schema: validationErrorResponseSchema,
                },
            },
        };
    }

    errors["400"] = {
        description: "Requisição inválida",
        content: {
            "application/json": {
                schema: errorResponseSchema,
            },
        },
    };

    errors["404"] = {
        description: "Recurso não encontrado",
        content: {
            "application/json": {
                schema: errorResponseSchema,
            },
        },
    };

    errors["409"] = {
        description: "Conflito de estado ou recurso duplicado",
        content: {
            "application/json": {
                schema: errorResponseSchema,
            },
        },
    };

    errors["500"] = {
        description: "Erro interno do servidor",
        content: {
            "application/json": {
                schema: errorResponseSchema,
            },
        },
    };

    return errors;
}

function registerDocumentedRoute(
    basePath: string,
    method: HttpMethod,
    path: string,
    meta: DocumentedRouteMeta
): void {
    const fullExpressPath = `${basePath}${path === "/" ? "" : path}`;
    const openApiPath = toOpenApiPath(fullExpressPath);
    const params = meta.params ?? inferParamsFromPath(path);

    const request: RouteConfig["request"] = {};

    if (params) {
        request.params = params;
    }

    if (meta.query) {
        request.query = meta.query;
    }

    if (meta.multipart) {
        request.body = {
            required: true,
            content: {
                "multipart/form-data": {
                    schema: z.object({
                        [meta.multipart.fieldName]: z.string().openapi({
                            type: "string",
                            format: "binary",
                        }),
                    }),
                },
            },
        };
    } else if (meta.body) {
        request.body = {
            required: true,
            content: {
                "application/json": {
                    schema: meta.body,
                },
            },
        };
    }

    registry.registerPath({
        method,
        path: openApiPath,
        summary: meta.summary,
        description: meta.description,
        tags: meta.tags ?? [tagFromBasePath(basePath)],
        security: meta.auth ? [{ [bearerAuth.name]: [] }] : undefined,
        request,
        responses: {
            ...buildSuccessResponses(meta.responses),
            ...buildCommonErrorResponses(meta),
        },
    });
}

function buildMiddlewares(meta: DocumentedRouteMeta, handlers: RequestHandler[]): RequestHandler[] {
    const middlewares: RequestHandler[] = [];

    if (meta.auth) {
        middlewares.push(validateToken);
    }

    if (meta.body) {
        middlewares.push(validateBody(meta.body));
    }

    return [...middlewares, ...handlers];
}

function registerRoute(
    router: Router,
    basePath: string,
    method: HttpMethod,
    path: string,
    meta: DocumentedRouteMeta,
    handlers: RequestHandler[]
): Router {
    registerDocumentedRoute(basePath, method, path, meta);
    return router[method](path, ...buildMiddlewares(meta, handlers));
}

export function registerSystemPath(
    method: HttpMethod,
    path: string,
    meta: Omit<DocumentedRouteMeta, "responses"> & { responses: DocumentedRouteMeta["responses"] }
): void {
    registerDocumentedRoute("", method, path, meta);
}
