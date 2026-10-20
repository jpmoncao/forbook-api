import { z } from "@/docs/zod-openapi";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";

export const institutionSchema = z.object({
    id: z.string().uuid(), name: z.string(), type: z.enum(["school", "university", "college"]),
    address: z.string().nullable(), city: z.string().nullable(), state: z.string().nullable(),
    latitude: z.number(), longitude: z.number(),
}).openapi("Institution");
const coordinate = (min: number, max: number) => z.preprocess(
    value => typeof value === "string" && value.trim() !== "" ? Number(value) : value,
    z.number().finite().min(min).max(max),
);
export const nearbyQuerySchema = z.object({
    lat: coordinate(-90, 90), lng: coordinate(-180, 180),
    radius: z.coerce.number().pipe(z.union([z.literal(3000), z.literal(5000), z.literal(10000)])).default(5000),
}).strict();
export const institutionListQuerySchema = z.object({
    q: z.string().trim().max(150).optional(), city: z.string().trim().max(150).optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict();
export const institutionParamsSchema = z.object({ id: z.string().uuid() });
export const geocodeBodySchema = z.object({ query: z.string().trim().min(3).max(200) }).strict();
export const geocodeCandidateSchema = z.object({
    id: z.string(), label: z.string(), latitude: z.number(), longitude: z.number(),
});
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
    const parsed = schema.safeParse(input);
    if (!parsed.success) throw new CustomError(EStatusCode.BAD_REQUEST, "INVALID_PARAMETERS", "Parâmetros inválidos",
        parsed.error.issues.map(issue => ({ name: issue.path.join("."), reason: issue.message })));
    return parsed.data;
}
