import { z } from "@/docs/zod-openapi";

export const invalidParamSchema = z
    .object({
        name: z.string(),
        reason: z.string(),
    })
    .openapi("InvalidParam");

export const errorResponseSchema = z
    .object({
        title: z.string(),
        status: z.number(),
        detail: z.string().optional(),
        instance: z.string().optional(),
        invalid_params: z.array(invalidParamSchema).optional(),
    })
    .openapi("ErrorResponse");

export const validationErrorResponseSchema = z
    .object({
        message: z.string(),
        errors: z.record(z.string(), z.array(z.string()).optional()),
    })
    .openapi("ValidationErrorResponse");

export const messageResponseSchema = z
    .object({
        message: z.string(),
    })
    .openapi("MessageResponse");

export const paginationMetaSchema = z
    .object({
        page: z.number(),
        pageSize: z.number(),
        total: z.number(),
        totalPages: z.number(),
    })
    .openapi("PaginationMeta");

export function apiJsonResponseSchema<T extends z.ZodTypeAny>(name: string, dataSchema: T) {
    return z
        .object({
            message: z.string(),
            data: dataSchema,
        })
        .openapi(name);
}

export function apiJsonListResponseSchema<T extends z.ZodTypeAny>(name: string, itemSchema: T) {
    return z
        .object({
            message: z.string(),
            data: z.array(itemSchema),
            meta: paginationMetaSchema,
        })
        .openapi(name);
}
