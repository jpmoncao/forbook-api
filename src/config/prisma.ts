import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL não está definida. Crie um ficheiro .env com DATABASE_URL=... antes de iniciar a API.",
    );
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 10_000,
    }),
});

/**
 * Garante ligação à base antes de aceitar pedidos HTTP.
 * Chama no bootstrap (ex.: antes de app.listen).
 */
export async function connectPrisma(): Promise<void> {
    await prisma.$connect();
}

export async function disconnectPrisma(): Promise<void> {
    await prisma.$disconnect();
}

export default prisma;
