import { z } from "@/docs/zod-openapi";
import type { UserBookWhereInput } from "@/generated/prisma/models";
import { parseInput } from "@/schemas/institution.schema";
const filterSchema = z.object({ bookId: z.string().uuid().optional(), term: z.string().trim().max(200).optional() }).strict();
export const userBookBrowseQuerySchema = z.object({
    institutionId: z.string().uuid().optional(),
    term: z.string().trim().max(200).optional(),
    filter: z.string().max(1000).optional(),
    sort: z.string().max(1000).optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
}).strict();
export function buildPublicBookQuery(input: unknown, viewerUserId: string) {
    const query = parseInput(userBookBrowseQuerySchema, input);
    let legacy: unknown = {};
    if (query.filter) {
        try { legacy = JSON.parse(query.filter); } catch { legacy = null; }
    }
    const filter = parseInput(filterSchema, legacy);
    const term = query.term ?? filter.term;
    const and: UserBookWhereInput[] = [
        { userId: { not: viewerUserId }, status: "ACTIVE", isPrivate: false },
    ];
    if (filter.bookId) and.push({ bookId: filter.bookId });
    if (query.institutionId) and.push({ User: { institutionId: query.institutionId } });
    if (term) and.push({ OR: ["title", "author", "publisher", "isbn"].map(field => ({ CatalogBook: { [field]: { contains: term, mode: "insensitive" } } })) });
    return { page: query.page, limit: query.limit, sort: {}, filter: { AND: and } };
}
