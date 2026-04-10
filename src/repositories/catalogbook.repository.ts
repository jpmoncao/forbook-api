import prisma from "@/config/prisma";
import { CatalogBook } from "@/generated/prisma/client";
import { CatalogBookCreateInput, CatalogBookUpdateInput } from "@/generated/prisma/models";

export default class CatalogBookRepository {
    create = async (catalogBookCreateInput: CatalogBookCreateInput): Promise<CatalogBook> => {
        const catalogBook = await prisma.catalogBook.create({
            data: catalogBookCreateInput
        });
        return catalogBook;
    }

    update = async (isbn: string, catalogBookUpdateInput: CatalogBookUpdateInput): Promise<CatalogBook> => {
        return prisma.catalogBook.update({
            where: { isbn },
            data: catalogBookUpdateInput,
        });
    }

    findById = async (id: string): Promise<CatalogBook | null> => {
        const catalogBook = await prisma.catalogBook.findUnique({
            where: { id },
        })
        return catalogBook;
    }

    findByIsbn = async (isbn: string): Promise<CatalogBook | null> => {
        const catalogBook = await prisma.catalogBook.findUnique({
            where: { isbn },
        });
    };

    findByTitle = async (title: string): Promise<CatalogBook[]> => {
        const catalogBook = await prisma.catalogBook.findMany({
            where: { title },
        });
    };

    findByAuthor = async (author: string): Promise<CatalogBook[]> => {
        const catalogBook = await prisma.catalogBook.findMany({
            where: { author }
        });
        return catalogBook
    }


}
