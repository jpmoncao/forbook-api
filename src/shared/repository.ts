import prisma from "@/config/prisma";
import type { PrismaClient } from "@/generated/prisma/client";
import { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_PAGE } from "@/utils/query-param";

export type RepositoryPagination = {
    page?: number;
    limit?: number;
};

export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export function resolvePaginationValues(pagination?: RepositoryPagination): { page: number; limit: number } {
    const page =
        Number.isFinite(pagination?.page) && pagination!.page! >= 1
            ? pagination!.page!
            : DEFAULT_QUERY_PAGE;
    const limit =
        Number.isFinite(pagination?.limit) && pagination!.limit! >= 1
            ? pagination!.limit!
            : DEFAULT_QUERY_LIMIT;
    return { page, limit };
}

export function buildPaginationMeta(total: number, pagination?: RepositoryPagination): PaginationMeta {
    const { page, limit } = resolvePaginationValues(pagination);
    return {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    };
}

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

    async getAll(args?: unknown, pagination?: RepositoryPagination): Promise<TEntity[]> {
        const prismaArgs =
            args !== null && args !== undefined && typeof args === "object" && !Array.isArray(args)
                ? { ...(args as Record<string, unknown>) }
                : {};

        if (prismaArgs.skip === undefined && prismaArgs.take === undefined) {
            const { page, limit } = resolvePaginationValues(pagination);
            prismaArgs.skip = (page - 1) * limit;
            prismaArgs.take = limit;
        }

        return this.database.findMany(prismaArgs);
    }

    async countWhere(where: unknown): Promise<number> {
        return this.database.count({ where });
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
