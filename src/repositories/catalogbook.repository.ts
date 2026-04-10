import type { CatalogBook } from "@/generated/prisma/client";
import type { CatalogBookCreateInput, CatalogBookUpdateInput } from "@/generated/prisma/models";
import AbstractRepository from "@/shared/repository";

export default class CatalogBookRepository extends AbstractRepository<
    "catalogBook",
    CatalogBook,
    CatalogBookCreateInput,
    CatalogBookUpdateInput
> {
    protected readonly modelKey = "catalogBook" as const;

    override async update(isbn: string, catalogBookUpdateInput: CatalogBookUpdateInput): Promise<CatalogBook> {
        return this.database.update({
            where: { isbn },
            data: catalogBookUpdateInput,
        });
    }

    findByIsbn = async (isbn: string): Promise<CatalogBook | null> => {
        return this.database.findUnique({
            where: { isbn },
        });
    };

    findByTitle = async (title: string): Promise<CatalogBook[]> => {
        return this.database.findMany({
            where: { title },
        });
    };

    findByAuthor = async (author: string): Promise<CatalogBook[]> => {
        return this.database.findMany({
            where: { author },
        });
    };
}
