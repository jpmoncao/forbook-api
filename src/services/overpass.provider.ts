import { normalizeElements, type InstitutionRecord } from "@/utils/institutions";

export type OverpassOptions = { endpoints?: string[]; totalTimeoutMs?: number; attemptTimeoutMs?: number; maxResponseBytes?: number };
const states = new Map<string, { tail: Promise<unknown>; pending: number; next: number; blockedUntil: number }>();
const mainRequests: number[] = [];
const mainBytes: { at: number; bytes: number }[] = [];
const MAIN_BYTE_BUDGET = 9_000_000;
function isMain(hostname: string) { return hostname === "overpass-api.de" || hostname.endsWith(".overpass-api.de"); }
export function remainingMainBytes(now = Date.now()): number {
    while (mainBytes[0] !== undefined && mainBytes[0].at <= now - DAY) mainBytes.shift();
    return Math.max(0, MAIN_BYTE_BUDGET - mainBytes.reduce((sum, entry) => sum + entry.bytes, 0));
}
export function recordMainBytes(bytes: number, now = Date.now()): void { mainBytes.push({ at: now, bytes }); }
async function readJSON(response: Response, hostname: string, maxBytes: number): Promise<unknown> {
    const budget = isMain(hostname) ? Math.min(maxBytes, remainingMainBytes()) : maxBytes;
    const length = Number(response.headers.get("content-length"));
    if (budget <= 0 || (Number.isFinite(length) && length > budget)) {
        void response.body?.cancel().catch(() => {});
        throw new ProviderError("response_byte_limit");
    }
    if (!response.body) throw new ProviderError("invalid_json");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    const usage = { at: Date.now(), bytes: 0 };
    if (isMain(hostname)) mainBytes.push(usage);
    let received = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            received += value.byteLength;
            const available = isMain(hostname) ? remainingMainBytes() : Infinity;
            if (isMain(hostname)) { usage.bytes += value.byteLength; usage.at = Date.now(); }
            if (received > budget || value.byteLength > available) {
                void reader.cancel().catch(() => {});
                throw new ProviderError("response_byte_limit");
            }
            chunks.push(value);
        }
        try { return JSON.parse(Buffer.concat(chunks, received).toString("utf8")); }
        catch { throw new ProviderError("invalid_json"); }
    } finally { reader.releaseLock(); }
}
const MAIN_DAILY_BUDGET = 90;
const DAY = 86400000;
export function reserveMainRequest(hostname: string, now = Date.now()): boolean {
    if (!isMain(hostname)) return true;
    while (mainRequests[0] !== undefined && mainRequests[0] <= now - DAY) mainRequests.shift();
    if (mainRequests.length >= MAIN_DAILY_BUDGET) return false;
    mainRequests.push(now);
    return true;
}
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
class ProviderError extends Error {
    constructor(readonly reason: string, readonly retryable = true, readonly httpStatus?: number, readonly retryAfterMs = 60000) { super(reason); }
}
function diagnose(endpoint: string, stage: string, error: ProviderError, durationMs: number) {
    console.warn(JSON.stringify({ event: "institution_provider", provider: "overpass", endpoint: new URL(endpoint).hostname, stage, reason: error.reason, ...(error.httpStatus !== undefined && { httpStatus: error.httpStatus }), success: false, durationMs }));
}
function bounded<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new ProviderError("timeout")), Math.max(1, timeoutMs));
        promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
    });
}
function configuredEndpoints(): string[] {
    const primary = process.env.OVERPASS_URL || "https://overpass.private.coffee/api/interpreter";
    // An explicit primary is authoritative: only add alternatives when explicitly configured.
    const fallbacks = process.env.OVERPASS_FALLBACK_URLS !== undefined
        ? process.env.OVERPASS_FALLBACK_URLS.split(",").map(value => value.trim()).filter(Boolean)
        : process.env.OVERPASS_URL ? [] : ["https://overpass-api.de/api/interpreter"];
    return [primary, ...fallbacks];
}
export default class OverpassProvider {
    private readonly endpoints: string[];
    private readonly totalTimeoutMs: number;
    private readonly attemptTimeoutMs: number;
    private readonly maxResponseBytes: number;
    constructor(private readonly fetcher: typeof fetch = fetch, options: OverpassOptions = {}) {
        this.endpoints = [...new Set(options.endpoints || configuredEndpoints())].slice(0, 3).filter(value => {
            try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
        });
        this.totalTimeoutMs = options.totalTimeoutMs ?? 26000;
        this.attemptTimeoutMs = options.attemptTimeoutMs ?? 12000;
        this.maxResponseBytes = options.maxResponseBytes ?? 4 * 1024 * 1024;
    }
    async discover(latitude: number, longitude: number, radius: number): Promise<InstitutionRecord[]> {
        const deadline = Date.now() + this.totalTimeoutMs;
        if (this.endpoints.length === 0) console.warn(JSON.stringify({ event: "institution_provider", provider: "overpass", stage: "configuration", reason: "invalid_configuration", success: false }));
        for (const endpoint of this.endpoints) {
            const start = Date.now();
            if (start >= deadline) break;
            let stage = "queue";
            const endpointURL = new URL(endpoint);
            // Aliases/ports of the public main service share one queue and budget;
            // they are not independent providers for bypassing public limits.
            const key = isMain(endpointURL.hostname) ? "overpass-public-main" : endpointURL.origin;
            let state = states.get(key);
            if (!state) { state = { tail: Promise.resolve(), pending: 0, next: 0, blockedUntil: 0 }; states.set(key, state); }
            try {
                if (state.pending >= 20) throw new ProviderError("queue_full");
                if (state.blockedUntil > Date.now()) throw new ProviderError("cooldown");
                state.pending++;
                const operation = state.tail.catch(() => {}).then(async () => {
                    if (Date.now() >= deadline) throw new ProviderError("deadline");
                    if (state.blockedUntil > Date.now()) throw new ProviderError("cooldown");
                    const delay = Math.max(0, state.next - Date.now());
                    if (Date.now() + delay >= deadline) throw new ProviderError("deadline");
                    if (delay) await sleep(delay);
                    stage = "request";
                    const hostname = new URL(endpoint).hostname;
                    if (isMain(hostname) && remainingMainBytes() <= 0) throw new ProviderError("daily_byte_budget_exhausted");
                    if (!reserveMainRequest(hostname)) throw new ProviderError("daily_budget_exhausted");
                    state.next = Date.now() + 1100;
                    const remaining = Math.min(this.attemptTimeoutMs, deadline - Date.now());
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), Math.max(1, remaining));
                    try {
                        return await bounded((async () => {
                            const query = `[out:json][timeout:12];nwr["amenity"~"^(school|university|college)$"]["name"](around:${radius},${latitude},${longitude});out center tags;`;
                            const response = await this.fetcher(endpoint, { method: "POST", signal: controller.signal,
                                headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", "User-Agent": process.env.OSM_USER_AGENT || "ForBook/1.0 (https://github.com/jpmoncao/forbook-api)" },
                                body: new URLSearchParams({ data: query }).toString(),
                            });
                            if (!response.ok) {
                                const seconds = Number(response.headers.get("retry-after"));
                                throw new ProviderError("http_error", response.status === 429 || response.status >= 500, response.status, Math.max(60000, Math.min(300000, (seconds || 60) * 1000)));
                            }
                            stage = "parse";
                            const payload = await readJSON(response, hostname, this.maxResponseBytes) as { remark?: unknown; elements?: unknown };
                            if (payload?.remark) throw new ProviderError("overpass_remark");
                            if (!payload || !Array.isArray(payload.elements)) throw new ProviderError("invalid_payload");
                            return normalizeElements(payload.elements);
                        })(), remaining);
                    } catch (error) {
                        if (error instanceof ProviderError) throw error;
                        throw new ProviderError(controller.signal.aborted ? "timeout" : "transport_error");
                    } finally { clearTimeout(timer); controller.abort(); }
                }).finally(() => { state.pending--; });
                state.tail = operation;
                const records = await bounded(operation, deadline - Date.now());
                console.info(JSON.stringify({ event: "institution_provider", provider: "overpass", endpoint: new URL(endpoint).hostname, stage: "parse", success: true, durationMs: Date.now() - start }));
                return records;
            } catch (error) {
                const failure = error instanceof ProviderError ? error : new ProviderError("invalid_payload");
                if (["http_error", "timeout", "transport_error", "invalid_json", "invalid_payload", "overpass_remark", "response_byte_limit"].includes(failure.reason)) state.blockedUntil = Date.now() + failure.retryAfterMs;
                diagnose(endpoint, stage, failure, Date.now() - start);
                if (!failure.retryable) break;
            }
        }
        throw new Error("INSTITUTION_PROVIDER_UNAVAILABLE");
    }
}
