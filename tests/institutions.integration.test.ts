// Run only against a disposable migrated database via TEST_DATABASE_URL.
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

test("migrated PostgreSQL: profile lifecycle, catalog upsert and community visibility", { skip: !process.env.TEST_DATABASE_URL }, async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.NODE_ENV = "production";
    process.env.SENDGRID_API_KEY = "SG.disposable-integration-test.key";
    process.env.JWT_SECRET = "disposable-integration-test-secret";
    const { default: prisma } = await import("../src/config/prisma");
    const { default: UserService } = await import("../src/services/user.service");
    const { default: UserBookService } = await import("../src/services/userBook.service");
    const { default: InstitutionService } = await import("../src/services/institution.service");
    const { buildPublicBookQuery } = await import("../src/utils/user-book-browse");
    const prefix = randomUUID();
    const institutions: string[] = [], users: string[] = [], books: string[] = [], images: string[] = [];
    try {
        for (const osmId of [`${prefix}a`, `${prefix}b`]) {
            const row = await prisma.institution.create({ data: { name: `${prefix} Campus`, type: "university", latitude: -23.55, longitude: -46.63, osmType: "node", osmId } });
            institutions.push(row.id);
        }
        for (let i = 0; i < 3; i++) {
            const user = await prisma.user.create({ data: { email: `${prefix}${i}@example.com`, name: "Aluno", password: "unused", cpf: `${prefix}${i}`, phoneNumber: `${prefix}${i}`, birthDate: new Date("2000-01-01"), institutionId: i === 2 ? institutions[1] : institutions[0] } });
            users.push(user.id);
        }
        const original = await prisma.institution.findUniqueOrThrow({ where: { id: institutions[0] } });
        const refreshed = await prisma.institution.upsert({ where: { osmType_osmId: { osmType: original.osmType, osmId: original.osmId } }, create: { ...original, id: randomUUID() }, update: { name: original.name } });
        assert.equal(refreshed.id, original.id);
        const service = new UserService();
        assert.equal((await service.getMe(users[0]!)).Institution?.id, institutions[0]);
        assert.equal((await service.updateUser(users[0]!, { name: "Outro nome" })).Institution?.id, institutions[0]);
        assert.equal((await service.updateUser(users[0]!, { institutionId: institutions[1] })).Institution?.id, institutions[1]);
        assert.equal((await service.updateUser(users[0]!, { institutionId: null })).Institution, null);
        await assert.rejects(service.updateUser(users[0]!, { institutionId: randomUUID() }), (error: any) => error.statusCode === 404);
        const catalog = await prisma.catalogBook.create({ data: { isbn: prefix, title: "Livro do campus", author: "Autora", publisher: "Editora", year: 2026, description: "Teste" } });
        books.push(catalog.id);
        const createAd = async (userId: string, status: "ACTIVE" | "INACTIVE", isPrivate: boolean) => {
            const image = await prisma.image.create({ data: { url: "https://example.com/test.png" } }); images.push(image.id);
            return prisma.userBook.create({ data: { condition: "GOOD", price: 0, description: "Troca", userId, bookId: catalog.id, status, isPrivate, mainImageId: image.id } });
        };
        await createAd(users[0]!, "ACTIVE", false);
        const visible = await createAd(users[1]!, "ACTIVE", false);
        await createAd(users[1]!, "INACTIVE", false);
        await createAd(users[1]!, "ACTIVE", true);
        await createAd(users[2]!, "ACTIVE", false);
        const bookService = new UserBookService();
        const query = buildPublicBookQuery({ institutionId: institutions[0], filter: '{"term":"livro"}', limit: "1" }, users[0]!);
        const result = await bookService.getAllUserBooks(query, users[0]!);
        assert.equal(result.meta.total, 1); assert.deepEqual(result.data.map(row => row.id), [visible.id]);
        const page2 = await bookService.getAllUserBooks({ ...query, page: 2 }, users[0]!);
        assert.equal(page2.data.length, 0); assert.equal(page2.meta.total, 1);
        await service.updateUser(users[1]!, { institutionId: institutions[1] });
        assert.equal((await bookService.getAllUserBooks(query, users[0]!)).meta.total, 0);
        const institutionService = new InstitutionService();
        const listed = await institutionService.list({ q: prefix, page: 1, limit: 1 });
        assert.equal(listed.meta.total, 2); assert.equal(listed.data.length, 1); assert.equal(listed.meta.totalPages, 2);
        await prisma.institution.delete({ where: { id: institutions[1] } });
        assert.equal((await service.getMe(users[1]!)).institutionId, null);
        assert.equal((await service.getMe(users[1]!)).Institution, null);

        // Route-level authentication, validation and OpenAPI rendering without app bootstrap.
        const { default: express } = await import("express");
        const { default: router } = await import("../src/routers/institution.router");
        const { default: Jwt } = await import("../src/utils/jwt");
        const { errorHandler } = await import("../src/middlewares/error-handler");
        const app = express(); app.use(express.json()); app.use("/institutions", router); app.use(errorHandler);
        const server = app.listen(0, "127.0.0.1");
        await new Promise<void>(resolve => server.once("listening", resolve));
        const address = server.address() as { port: number };
        const base = `http://127.0.0.1:${address.port}/institutions`;
        const headers = { Authorization: `Bearer ${Jwt.generateAccessToken(users[0]!)}` };
        try {
            assert.equal((await fetch(base)).status, 401);
            assert.equal((await fetch(`${base}/nearby?lat=invalid&lng=0`, { headers })).status, 400);
            assert.equal((await fetch(`${base}/${randomUUID()}`, { headers })).status, 404);
            const response = await fetch(`${base}?q=${prefix}`, { headers });
            assert.equal(response.status, 200); assert.equal((await response.json() as any).data.length, 1);
            assert.equal((await fetch(`${base}/geocode`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: '{"query":""}' })).status, 422);
            const { generateOpenAPIDocument } = await import("../src/docs/openapi");
            const document = generateOpenAPIDocument();
            assert.ok(document.paths?.["/institutions/nearby"]?.get);
        } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
    } finally {
        await prisma.userBook.deleteMany({ where: { userId: { in: users } } });
        await prisma.user.deleteMany({ where: { id: { in: users } } });
        await prisma.catalogBook.deleteMany({ where: { id: { in: books } } });
        await prisma.image.deleteMany({ where: { id: { in: images } } });
        await prisma.institution.deleteMany({ where: { id: { in: institutions } } });
        await prisma.$disconnect();
    }
});
