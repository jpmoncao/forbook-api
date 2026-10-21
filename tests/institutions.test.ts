import test from "node:test";
import assert from "node:assert/strict";
import { distanceMeters, nearbyCell, normalizeElements } from "../src/utils/institutions";
import { nearbyQuerySchema, parseInput } from "../src/schemas/institution.schema";
import { userUpdateBodySchema } from "../src/schemas/user.schema";
import { buildPublicBookQuery } from "../src/utils/user-book-browse";
import RealInstitutionService from "../src/services/institution.service";
let testEndpoint = 0;
class InstitutionService extends RealInstitutionService {
    constructor(db: any, fetcher: typeof fetch) { super(db, fetcher, { endpoints: [`https://isolated-${++testEndpoint}.example.test/interpreter`] }); }
}

const fixture = [
    { type: "node", id: 1, lat: -23.55, lon: -46.63, tags: { name: "Escola A", amenity: "school", "addr:city": "São Paulo" } },
    { type: "way", id: 1, center: { lat: -23.551, lon: -46.63 }, tags: { name: "Escola A", amenity: "university" } },
    { type: "relation", id: 2, center: { lat: -23.552, lon: -46.63 }, tags: { name: "Campus B", amenity: "college" } },
    { type: "node", id: 3, lat: 120, lon: 1, tags: { name: "Invalid", amenity: "school" } },
    { type: "node", id: 4, lat: 1, lon: 1, tags: { amenity: "school" } },
];
test("OSM identity preserves different campi/types and omits invalid records", () => {
    const normalized = normalizeElements([...fixture, fixture[0]]);
    assert.equal(normalized.length, 3);
    assert.equal(normalized[0]?.city, "São Paulo");
    assert.deepEqual(normalized.map(x => `${x.osmType}:${x.osmId}`), ["node:1", "way:1", "relation:2"]);
});
test("Haversine, antipodes and complete query cell coverage", () => {
    assert.equal(distanceMeters(0, 0, 0, 0), 0);
    assert.ok(Math.abs(distanceMeters(0, 0, 0, 1) - 111195) < 1);
    assert.ok(Number.isFinite(distanceMeters(90, 0, -90, 180)));
    const cell = nearbyCell(-23.55001, -46.63001, 5000);
    assert.ok(cell.radius >= 5000 + distanceMeters(-23.55001, -46.63001, cell.latitude, cell.longitude));
});
test("runtime queries reject invalid coordinates/radius and update preserves omit/null/UUID", () => {
    assert.equal(parseInput(nearbyQuerySchema, { lat: "0", lng: "0" }).radius, 5000);
    for (const query of [{ lat: "", lng: "0" }, { lat: "91", lng: "0" }, { lat: "0", lng: "0", radius: "4" }]) assert.throws(() => parseInput(nearbyQuerySchema, query));
    assert.deepEqual(userUpdateBodySchema.parse({}), {});
    assert.deepEqual(userUpdateBodySchema.parse({ institutionId: null }), { institutionId: null });
    assert.equal(userUpdateBodySchema.safeParse({ institutionId: "absent" }).success, false);
});
test("public listing combines term and campus with immutable visibility constraints", () => {
    const institutionId = "c5b64c36-52f3-4a42-9d1b-330518e70c34";
    const query = buildPublicBookQuery({ institutionId, filter: JSON.stringify({ term: "livro" }), page: "2", limit: "20" }, "viewer");
    assert.deepEqual(query.filter.AND?.[0], { userId: { not: "viewer" }, status: "ACTIVE", isPrivate: false });
    assert.deepEqual(query.filter.AND?.[1], { User: { institutionId } });
    assert.ok(query.filter.AND?.[2]?.OR?.length === 4);
    assert.equal(query.page, 2);
    assert.throws(() => buildPublicBookQuery({ institutionId: "bad" }, "viewer"));
    assert.throws(() => buildPublicBookQuery({ filter: '{"isPrivate":true}' }, "viewer"));
    assert.throws(() => buildPublicBookQuery({ filter: "{" }, "viewer"));
});
function fakeDatabase() {
    const records: any[] = [];
    const cache = new Map<string, any>();
    const db = {
        institutionLookupCache: {
            findUnique: async ({ where }: any) => cache.get(where.key) || null,
            upsert: async ({ create }: any) => { cache.set(create.key, create); return create; },
            deleteMany: async () => ({ count: 0 }),
        },
        institution: {
            upsert: async ({ create }: any) => { const row = { id: String(records.length), ...create }; records.push(row); return row; },
            findMany: async () => records,
        },
        $transaction: async (promises: any) => Promise.all(promises),
    };
    return { db: db as any, records, cache };
}
test("nearby deduplicates concurrent lookups, caches empty results and re-filters actual distance", async () => {
    const { db, records, cache } = fakeDatabase();
    let calls = 0;
    const fetcher = (async () => { calls++; return new Response(JSON.stringify({ elements: fixture }), { status: 200 }); }) as typeof fetch;
    const service = new InstitutionService(db, fetcher);
    const [first, second] = await Promise.all([service.nearby(-23.55, -46.63, 5000), service.nearby(-23.55, -46.63, 5000)]);
    assert.equal(calls, 1); assert.equal(first.meta.partial, false); assert.equal(first.data.length, 3); assert.equal(second.data.length, 3);
    records.push({ ...records[0], id: "far", latitude: 45 });
    const next = await service.nearby(-23.55001, -46.63001, 5000);
    // May use an adjacent cell, which must trigger its own lookup.
    assert.ok(next.data.every(item => item.distanceMeters <= 5000));
    const emptyDb = fakeDatabase();
    const emptyService = new InstitutionService(emptyDb.db, (async () => new Response('{"elements":[]}')) as typeof fetch);
    const empty = await emptyService.nearby(30, 30, 3000);
    assert.equal(empty.data.length, 0); assert.equal(empty.meta.partial, false); assert.equal(emptyDb.cache.size, 1);
    assert.ok(cache.size >= 1);
});
test("provider failure and HTTP200 partial response keep catalog and mark incomplete", async () => {
    const { db, records } = fakeDatabase();
    records.push({ id: "saved", ...normalizeElements(fixture)[0] });
    for (const payload of [null, { elements: [], remark: "runtime error: timeout" }]) {
        const service = new InstitutionService(db, (async () => { if (!payload) throw new Error("timeout"); return new Response(JSON.stringify(payload)); }) as typeof fetch);
        const result = await service.nearby(-23.55, -46.63, 3000);
        assert.equal(result.meta.partial, true); assert.equal(result.data.length, 1);
    }
});
test("explicit geocode normalizes cache key and does not persist address query", async () => {
    const { db, cache } = fakeDatabase();
    let calls = 0;
    const service = new InstitutionService(db, (async () => { calls++; return new Response(JSON.stringify([{ osm_type: "way", osm_id: 12, display_name: "São Paulo", lat: "-23.55", lon: "-46.63" }])); }) as typeof fetch);
    const result = await service.geocode("São Paulo");
    assert.deepEqual(result, [{ id: "way:12", label: "São Paulo", latitude: -23.55, longitude: -46.63 }]);
    assert.deepEqual(await service.geocode("  SÃO   PAULO  "), result);
    assert.equal(calls, 1); assert.ok([...cache.keys()][0]?.startsWith("geocode:v1:")); assert.equal([...cache.keys()][0]?.includes("paulo"), false);
});
test("HTTP 429 activates backoff and prevents repeated upstream calls", async () => {
    const { db } = fakeDatabase(); let calls = 0;
    const service = new InstitutionService(db, (async () => { calls++; return new Response("", { status: 429, headers: { "Retry-After": "60" } }); }) as typeof fetch);
    await assert.rejects(service.nearby(40, 40, 3000), (error: any) => error.statusCode === 503 && error.title === "INSTITUTION_DISCOVERY_UNAVAILABLE");
    await assert.rejects(service.nearby(41, 41, 3000), (error: any) => error.statusCode === 503);
    assert.equal(calls, 1);
});
