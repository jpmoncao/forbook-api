import prisma from "@/config/prisma";
import type { PrismaClient } from "@/generated/prisma/client";

export type PrismaModelKey = {
    [K in keyof PrismaClient]: K extends `$${string}` | symbol
    ? never
    : "findMany" extends keyof PrismaClient[K]
    ? K
    : never;
}[keyof PrismaClient];

type PrismaModelClient = Pick<PrismaClient, PrismaModelKey>;

export default abstract class AbstractRepository<
    M extends PrismaModelKey,
    TEntity = unknown,
    TCreateData = unknown,
    TUpdateData = unknown,
> {
    constructor(protected readonly client: PrismaClient = prisma) { }

    protected abstract readonly modelKey: M;

    // biome-ignore lint/suspicious/noExplicitAny: database não é indexável com M genérico
    protected get database(): any {
        return (this.client as PrismaModelClient)[this.modelKey];
    }

    async getAll(args?: unknown): Promise<TEntity[]> {
        return this.database.findMany(args);
    }

    async getById(id: string): Promise<TEntity | null> {
        return this.database.findUnique({ where: { id } });
    }

    async create(data: TCreateData): Promise<TEntity> {
        return this.database.create({ data });
    }

    async update(id: string, data: TUpdateData): Promise<TEntity> {
        return this.database.update({ where: { id }, data });
    }

    async delete(id: string): Promise<TEntity> {
        return this.database.delete({ where: { id } });
    }
}
