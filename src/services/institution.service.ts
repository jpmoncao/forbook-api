import { createHash } from "node:crypto";
import prisma from "@/config/prisma";
import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import OverpassProvider, { type OverpassOptions } from "@/services/overpass.provider";
import { distanceMeters, nearbyCell, toInstitutionDTO, validCoordinates } from "@/utils/institutions";

export const INSTITUTION_ATTRIBUTION = "© OpenStreetMap contributors (https://www.openstreetmap.org/copyright)";
let nextCacheCleanup = 0;
const TTL = 24 * 60 * 60 * 1000;
const inflight = new Map<string, Promise<unknown>>();
const queues = new Map<string, { tail: Promise<unknown>; next: number; pending: number; blockedUntil: number }>();
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// All callers share a queue per provider. Deploy one API replica with public Nominatim,
// or configure a shared proxy/self-hosted provider to enforce an installation-wide limit.
async function queued<T>(provider: string, run: () => Promise<T>): Promise<T> {
    let state = queues.get(provider);
    if (!state) { state = { tail: Promise.resolve(), next: 0, pending: 0, blockedUntil: 0 }; queues.set(provider, state); }
    if (state.pending >= 20 || state.blockedUntil > Date.now()) throw new Error("Provider busy");
    state.pending++;
    const result = state.tail.catch(() => {}).then(async () => {
        if (state.blockedUntil > Date.now()) throw new Error("Provider cooldown");
        await wait(Math.max(0, state.next - Date.now()));
        state.next = Date.now() + 1100;
        return run();
    }).finally(() => { state.pending--; });
    state.tail = result;
    return result;
}
async function coalesce<T>(key: string, run: () => Promise<T>): Promise<T> {
    const existing = inflight.get(key); if (existing) return existing as Promise<T>;
    const pending = run().finally(() => inflight.delete(key));
    inflight.set(key, pending); return pending;
}
export default class InstitutionService {
    private readonly overpass: OverpassProvider;
    constructor(private readonly db: PrismaClient = prisma, private readonly fetcher: typeof fetch = fetch, options: OverpassOptions = {}) {
        this.overpass = new OverpassProvider(fetcher, options);
    }

    private async request(url: string, options: RequestInit, provider: string): Promise<unknown> {
        return queued(provider, async () => {
            const started = Date.now();
            try {
                const response = await this.fetcher(url, {
                    ...options, signal: AbortSignal.timeout(25000),
                    headers: { ...options.headers, "User-Agent": process.env.OSM_USER_AGENT || "ForBook/1.0 (https://github.com/jpmoncao/forbook-api)", Accept: "application/json" },
                });
                if (!response.ok) {
                    if ([429, 503, 504].includes(response.status)) {
                        const retrySeconds = Number(response.headers.get("retry-after"));
                        queues.get(provider)!.blockedUntil = Date.now() + Math.max(60000, Math.min(300000, (retrySeconds || 60) * 1000));
                    }
                    throw new Error(`Provider HTTP ${response.status}`);
                }
                const payload = await response.json();
                console.info(JSON.stringify({ event: "institution_provider", provider, success: true, durationMs: Date.now() - started }));
                return payload;
            } catch {
                // Never log input URLs, coordinates, address queries or external error bodies.
                console.warn(JSON.stringify({ event: "institution_provider", provider, success: false, durationMs: Date.now() - started }));
                throw new Error("Provider unavailable");
            }
        });
    }
    private async cached(key: string) {
        const entry = await this.db.institutionLookupCache.findUnique({ where: { key } });
        return entry && entry.expiresAt.getTime() > Date.now() ? entry.payload : null;
    }
    private async cache(key: string, payload: Prisma.InputJsonValue) {
        if (Date.now() >= nextCacheCleanup) {
            nextCacheCleanup = Date.now() + 60 * 60 * 1000;
            await this.db.institutionLookupCache.deleteMany({ where: { expiresAt: { lte: new Date() } } });
        }
        const data = { payload, expiresAt: new Date(Date.now() + TTL) };
        await this.db.institutionLookupCache.upsert({ where: { key }, create: { key, ...data }, update: data });
    }
    async list(query: { q?: string; city?: string; page: number; limit: number }) {
        const where: Prisma.InstitutionWhereInput = {
            ...(query.q && { name: { contains: query.q, mode: "insensitive" } }),
            ...(query.city && { city: { contains: query.city, mode: "insensitive" } }),
        };
        const [rows, total] = await Promise.all([
            this.db.institution.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (query.page - 1) * query.limit, take: query.limit }),
            this.db.institution.count({ where }),
        ]);
        return { data: rows.map(row => toInstitutionDTO({ ...row, type: row.type as "school" | "university" | "college" })), meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit), attribution: INSTITUTION_ATTRIBUTION } };
    }
    async get(id: string) {
        const row = await this.db.institution.findUnique({ where: { id } });
        if (!row) throw new CustomError(EStatusCode.NOT_FOUND, "INSTITUTION_NOT_FOUND", "Instituição não encontrada");
        return toInstitutionDTO({ ...row, type: row.type as "school" | "university" | "college" });
    }
    async nearby(lat: number, lng: number, radius: number) {
        const cell = nearbyCell(lat, lng, radius);
        let partial = false;
        try {
            await coalesce(cell.key, async () => {
                let stage = "cache_read";
                try {
                    if (await this.cached(cell.key) !== null) {
                        console.info(JSON.stringify({ event: "institution_cache", provider: "overpass", hit: true }));
                        return;
                    }
                    console.info(JSON.stringify({ event: "institution_cache", provider: "overpass", hit: false }));
                    stage = "provider";
                    const records = await this.overpass.discover(cell.latitude, cell.longitude, cell.radius);
                    stage = "catalog_write";
                    await this.db.$transaction(records.map(record => this.db.institution.upsert({
                        where: { osmType_osmId: { osmType: record.osmType, osmId: record.osmId } }, create: record, update: record,
                    })));
                    stage = "cache_write";
                    await this.cache(cell.key, { complete: true });
                } catch {
                    if (stage !== "provider") console.warn(JSON.stringify({ event: "institution_storage", stage, reason: "storage_failure", success: false }));
                    throw new Error(stage === "provider" ? "provider_failure" : "storage_failure");
                }
            });
        } catch (error) {
            if (error instanceof Error && error.message === "storage_failure") {
                throw new CustomError(EStatusCode.INTERNAL_SERVER_ERROR, "INSTITUTION_STORAGE_UNAVAILABLE", "Não foi possível consultar ou salvar as instituições. Tente novamente em instantes.");
            }
            partial = true;
        }
        const latitudeDelta = radius / 110000;
        let rows;
        try {
            rows = await this.db.institution.findMany({ where: { latitude: { gte: Math.max(-90, lat - latitudeDelta), lte: Math.min(90, lat + latitudeDelta) } } });
        } catch {
            console.warn(JSON.stringify({ event: "institution_storage", stage: "catalog_read", reason: "storage_failure", success: false }));
            throw new CustomError(EStatusCode.INTERNAL_SERVER_ERROR, "INSTITUTION_STORAGE_UNAVAILABLE", "Não foi possível consultar as instituições. Tente novamente em instantes.");
        }
        const data = rows.map(row => ({ ...toInstitutionDTO({ ...row, type: row.type as "school" | "university" | "college" }), distanceMeters: distanceMeters(lat, lng, row.latitude, row.longitude) }))
            .filter(row => row.distanceMeters <= radius).sort((a, b) => a.distanceMeters - b.distanceMeters || a.name.localeCompare(b.name));
        if (partial && data.length === 0) throw new CustomError(EStatusCode.SERVICE_UNAVAILABLE, "INSTITUTION_DISCOVERY_UNAVAILABLE", "A busca de instituições está temporariamente indisponível. Tente novamente em instantes.");
        return { data, meta: { partial, attribution: INSTITUTION_ATTRIBUTION } };
    }
    async geocode(query: string) {
        const normalized = query.normalize("NFKC").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
        const key = `geocode:v1:${createHash("sha256").update(normalized).digest("hex")}`;
        return coalesce(key, async () => {
            const cached = await this.cached(key);
            if (cached !== null) return cached;
            try {
                const url = new URL(process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org/search");
                url.search = new URLSearchParams({ q: query, format: "jsonv2", limit: "5", "accept-language": "pt-BR" }).toString();
                const result = await this.request(url.toString(), {}, "nominatim");
                if (!Array.isArray(result)) throw new Error("Invalid geocoding response");
                const data = result.flatMap(row => {
                    const latitude = Number(row?.lat), longitude = Number(row?.lon);
                    if (!row || row.lat == null || row.lon == null || row.lat === "" || row.lon === "" || typeof row.display_name !== "string" || !row.display_name || !row.osm_type || !row.osm_id || !validCoordinates(latitude, longitude)) return [];
                    return [{ id: `${row.osm_type}:${row.osm_id}`, label: row.display_name, latitude, longitude }];
                });
                await this.cache(key, data);
                return data;
            } catch {
                throw new CustomError(EStatusCode.BAD_REQUEST, "GEOCODER_UNAVAILABLE", "A busca de endereço está indisponível. Tente novamente ou use sua localização.");
            }
        });
    }
}
