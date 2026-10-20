import type { RequestHandler } from "express";
import { z } from "@/docs/zod-openapi";
import { createDocumentedRouter } from "@/docs/documented-router";
import { geocodeBodySchema, geocodeCandidateSchema, institutionListQuerySchema, institutionParamsSchema, institutionSchema, nearbyQuerySchema, parseInput } from "@/schemas/institution.schema";
import InstitutionService, { INSTITUTION_ATTRIBUTION } from "@/services/institution.service";

const routes = createDocumentedRouter("/institutions");
const service = new InstitutionService();
const envelope = (data: z.ZodType) => z.object({ message: z.string(), data, meta: z.object({ attribution: z.string(), partial: z.boolean().optional(), page: z.number().optional(), limit: z.number().optional(), total: z.number().optional(), totalPages: z.number().optional() }).optional() });
const calls = new Map<string, { count: number; reset: number }>();
const throttle: RequestHandler = (req, res, next) => {
    const now = Date.now();
    // Opportunistically remove expired windows; do not retain user identifiers indefinitely.
    for (const [key, value] of calls) if (value.reset <= now) calls.delete(key);
    const key = req.userId as string;
    const window = calls.get(key) || { count: 0, reset: now + 60000 };
    calls.set(key, window);
    if (++window.count > 30) { res.setHeader("Retry-After", "60"); res.status(429).json({ title: "RATE_LIMIT_EXCEEDED", detail: "Aguarde um minuto antes de buscar novamente" }); return; }
    next();
};
routes.get("/", { summary: "Buscar instituições no catálogo", auth: true, query: institutionListQuerySchema, responses: { 200: envelope(z.array(institutionSchema)) } }, throttle, async (req, res) => {
    const result = await service.list(parseInput(institutionListQuerySchema, req.query));
    res.json({ message: "Instituições encontradas", ...result });
});
routes.get("/nearby", { summary: "Buscar instituições próximas", auth: true, query: nearbyQuerySchema, responses: { 200: envelope(z.array(institutionSchema.extend({ distanceMeters: z.number() }))) } }, throttle, async (req, res) => {
    const query = parseInput(nearbyQuerySchema, req.query);
    res.json({ message: "Instituições próximas encontradas", ...await service.nearby(query.lat, query.lng, query.radius) });
});
routes.post("/geocode", { summary: "Geocodificar CEP ou endereço enviado explicitamente", auth: true, body: geocodeBodySchema, responses: { 200: envelope(z.array(geocodeCandidateSchema)) } }, throttle, async (req, res) => {
    res.json({ message: "Localizações encontradas", data: await service.geocode(req.body.query), meta: { attribution: INSTITUTION_ATTRIBUTION } });
});
routes.get("/:id", { summary: "Obter instituição", auth: true, params: institutionParamsSchema, responses: { 200: envelope(institutionSchema) } }, async (req, res) => {
    const { id } = parseInput(institutionParamsSchema, req.params);
    res.json({ message: "Instituição encontrada", data: await service.get(id), meta: { attribution: INSTITUTION_ATTRIBUTION } });
});
export default routes.router;
