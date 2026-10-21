import test from "node:test";
import assert from "node:assert/strict";
import { reserveMainRequest, remainingMainBytes, recordMainBytes } from "../src/services/overpass.provider";
import InstitutionService from "../src/services/institution.service";

const elements = [{ type: "node", id: 81, lat: -23.55, lon: -46.63, tags: { name: "Escola real fixture", amenity: "school" } }];
let counter = 0;
function setup(fetcher: typeof fetch, options: Record<string, unknown> = {}) {
    const records: any[] = [], cache = new Map<string, any>();
    const db: any = {
        institutionLookupCache: { findUnique: async ({ where }: any) => cache.get(where.key) || null, upsert: async ({ create }: any) => cache.set(create.key, create), deleteMany: async () => ({ count: 0 }) },
        institution: { upsert: async ({ create }: any) => { const row = { id: "saved", ...create }; records.push(row); return row; }, findMany: async () => records },
        $transaction: async (operations: any) => Promise.all(operations),
    };
    const id = ++counter;
    const endpoints = [`https://first-${id}.example.test/interpreter`, `https://second-${id}.example.test/interpreter`];
    const service = new InstitutionService(db, fetcher, { endpoints, totalTimeoutMs: 500, attemptTimeoutMs: 200, ...options });
    return { service, db, records, cache, endpoints };
}
test("first transport failure then valid secondary normalizes and persists with partial=false", async () => {
    const calls: string[] = [];
    const { service, records } = setup((async (url: string) => { calls.push(url); if (calls.length === 1) throw new Error("sensitive URL and coordinates"); return Response.json({ elements }); }) as typeof fetch);
    const result = await service.nearby(-23.55, -46.63, 3000);
    assert.equal(calls.length, 2); assert.equal(records.length, 1); assert.equal(result.data[0]?.name, "Escola real fixture"); assert.equal(result.meta.partial, false);
});
test("all providers fail: returns only real persisted catalog with partial=true", async () => {
    const { service, records } = setup((async () => { throw new Error("offline"); }) as typeof fetch);
    records.push({ id: "prior", name: "Persistida", type: "school", address: null, city: null, state: null, latitude: -23.55, longitude: -46.63 });
    const result = await service.nearby(-23.55, -46.63, 3000);
    assert.equal(result.meta.partial, true); assert.deepEqual(result.data.map(item => item.id), ["prior"]);
});
test("HTTP200 remark, nonJSON and invalid shape each use secondary; valid empty does not", async () => {
    for (const bad of [() => Response.json({ remark: "timeout", elements: [] }), () => new Response("upstream HTML"), () => Response.json({ unrelated: [] })]) {
        let calls = 0;
        const { service } = setup((async () => ++calls === 1 ? bad() : Response.json({ elements })) as typeof fetch);
        assert.equal((await service.nearby(-23.55, -46.63, 3000)).meta.partial, false); assert.equal(calls, 2);
    }
    let calls = 0;
    const { service } = setup((async () => { calls++; return Response.json({ elements: [] }); }) as typeof fetch);
    assert.equal((await service.nearby(0, 0, 3000)).meta.partial, false);
    assert.equal((await service.nearby(0, 0, 3000)).meta.partial, false);
    assert.equal(calls, 1);
});
test("endpoint cooldown is isolated: primary429 does not block secondary or subsequent healthy requests", async () => {
    const calls: string[] = [];
    const fixture = setup((async (url: string) => { calls.push(url); return url.includes("first-") ? new Response("", { status: 429 }) : Response.json({ elements: [] }); }) as typeof fetch, { totalTimeoutMs: 2000 });
    assert.equal((await fixture.service.nearby(1, 1, 3000)).meta.partial, false);
    assert.equal((await fixture.service.nearby(2, 2, 3000)).meta.partial, false);
    assert.equal(calls.filter(url => url.includes("first-")).length, 1); assert.equal(calls.filter(url => url.includes("second-")).length, 2);
});
test("storage failure does not try another provider and emits safe diagnostic stage", async () => {
    let calls = 0;
    const { service, db } = setup((async () => { calls++; return Response.json({ elements }); }) as typeof fetch);
    db.$transaction = async () => { throw new Error("password=secret lat=-23.55 raw SQL"); };
    const messages: string[] = [], warn = console.warn;
    console.warn = (message: string) => { messages.push(message); };
    try {
        await assert.rejects(service.nearby(-23.55, -46.63, 3000), (error: any) => error.statusCode === 500 && error.title === "INSTITUTION_STORAGE_UNAVAILABLE");
        assert.equal(calls, 1);
        assert.ok(messages.some(message => JSON.parse(message).stage === "catalog_write"));
        assert.ok(messages.every(message => !/secret|password|23\.55|raw SQL/.test(message)));
    } finally { console.warn = warn; }
});
test("timeout leaves time for secondary and total deadline bounds providers ignoring abort", async () => {
    let calls = 0;
    const { service } = setup((async () => { if (++calls === 1) return new Promise(() => {}); return Response.json({ elements: [] }); }) as typeof fetch, { attemptTimeoutMs: 1000, totalTimeoutMs: 15000 });
    const start = Date.now();
    assert.equal((await service.nearby(5, 5, 3000)).meta.partial, false);
    assert.equal(calls, 2); assert.ok(Date.now() - start < 30000);
});

test("main public endpoint shares a strict90-request rolling24h budget across calls", () => {
    const start = Date.now() + 86400001;
    for (let i = 0; i < 90; i++) assert.equal(reserveMainRequest("overpass-api.de", start + i), true);
    assert.equal(reserveMainRequest("overpass-api.de", start + 100), false);
    assert.equal(reserveMainRequest("another.overpass-api.de", start + 101), false);
    assert.equal(reserveMainRequest("other.example.test", start + 101), true);
    assert.equal(reserveMainRequest("overpass-api.de", start + 86400000), true);
});

test("streamed response cap tries alternative; all oversized responses return503 without false empty", async () => {
    let calls = 0;
    const successful = setup((async () => ++calls === 1 ? new Response("x".repeat(101)) : Response.json({ elements: [] })) as typeof fetch, { maxResponseBytes: 100, totalTimeoutMs: 15000 });
    assert.equal((await successful.service.nearby(10, 10, 3000)).meta.partial, false); assert.equal(calls, 2);
    const failing = setup((async () => new Response("x".repeat(101))) as typeof fetch, { maxResponseBytes: 100, totalTimeoutMs: 15000 });
    await assert.rejects(failing.service.nearby(11, 11, 3000), (error: any) => error.statusCode === 503);
});
test("main received-byte ledger counts malformed/partial payloads and rolls after24h", () => {
    const start = Date.now() + 86400001;
    assert.equal(remainingMainBytes(start), 9_000_000);
    recordMainBytes(4_000_000, start); recordMainBytes(4_999_999, start + 1);
    assert.equal(remainingMainBytes(start + 2), 1);
    recordMainBytes(1, start + 3); assert.equal(remainingMainBytes(start + 4), 0);
    assert.equal(remainingMainBytes(start + 86400000), 4_000_000);
});
