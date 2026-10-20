export type InstitutionType = "school" | "university" | "college";
export type InstitutionRecord = {
    name: string; type: InstitutionType; address: string | null; city: string | null; state: string | null;
    latitude: number; longitude: number; osmType: string; osmId: string;
};
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const radians = (value: number) => value * Math.PI / 180;
    const a = Math.sin(radians(lat2 - lat1) / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(radians(lng2 - lng1) / 2) ** 2;
    return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}
export function validCoordinates(latitude: number, longitude: number): boolean {
    return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}
export function normalizeElements(input: unknown): InstitutionRecord[] {
    if (!Array.isArray(input)) throw new Error("Invalid Overpass response");
    const records = new Map<string, InstitutionRecord>();
    for (const element of input) {
        if (!element || typeof element !== "object") continue;
        const { tags, type: osmType, id, center } = element;
        if (!["node", "way", "relation"].includes(osmType) || !Number.isSafeInteger(id) || id <= 0 || !tags) continue;
        if (typeof tags.name !== "string" || !tags.name.trim() || !["school", "university", "college"].includes(tags.amenity)) continue;
        const latitude = osmType === "node" ? element.lat : center?.lat;
        const longitude = osmType === "node" ? element.lon : center?.lon;
        if (!validCoordinates(latitude, longitude)) continue;
        const tag = (key: string) => typeof tags[key] === "string" && tags[key].trim() ? tags[key].trim() : null;
        const street = [tag("addr:street"), tag("addr:housenumber")].filter(Boolean).join(", ");
        const address = [street, tag("addr:suburb"), tag("addr:postcode")].filter(Boolean).join(" · ") || null;
        records.set(`${osmType}:${id}`, {
            name: tags.name.trim(), type: tags.amenity, address, city: tag("addr:city"), state: tag("addr:state"),
            latitude, longitude, osmType, osmId: String(id),
        });
    }
    return [...records.values()];
}
// 0.01-degree cell: query its center plus its complete diagonal, then filter at the real origin.
export function nearbyCell(lat: number, lng: number, radius: number) {
    const latitude = Math.min(89.995, Math.max(-89.995, (Math.floor(lat * 100) + 0.5) / 100));
    const longitude = Math.min(179.995, Math.max(-179.995, (Math.floor(lng * 100) + 0.5) / 100));
    return { key: `nearby:v1:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${radius}`, latitude, longitude, radius: radius + 1600 };
}
export function toInstitutionDTO<T extends InstitutionRecord & { id: string }>(record: T) {
    const { id, name, type, address, city, state, latitude, longitude } = record;
    return { id, name, type, address, city, state, latitude, longitude };
}
