import prisma from "@/config/prisma";
import { UserBook, UserBookStatus } from "@/generated/prisma/client";
import { UserBookCreateInput, UserBookUpdateInput, UserBookWhereInput } from "@/generated/prisma/models";
import { UserBookWithInclude } from "@/types/UserBook";

export default class UserBookRepository {
    private readonly userBookInclude = {
        User: {
            include: {
                Address: {
                    omit: {
                        createdAt: true,
                        updatedAt: true,
                        userId: true,
                    }
                },
                ProfileImage: {
                    omit: {
                        createdAt: true,
                        updatedAt: true,
                        userBookId: true,
                    }
                },
            },
            omit: {
                createdAt: true,
                updatedAt: true,
                password: true,
                cpf: true,
            }
        },
        CatalogBook: true,
        MainImage: {
            omit: {
                createdAt: true,
                updatedAt: true,
                userBookId: true,
            }
        },
        GalleryImages: {
            omit: {
                createdAt: true,
                updatedAt: true,
                userBookId: true,
            }
        },
    };

    findAll = async (filter: UserBookWhereInput): Promise<UserBookWithInclude[]> => {
        const userBooks = await prisma.userBook.findMany({
            where: filter,
            include: this.userBookInclude,
        });
        return userBooks;
    }

    findById = async (id: string): Promise<UserBookWithInclude | null> => {
        const userBook = await prisma.userBook.findFirst({
            where: { id },
            include: this.userBookInclude,
        });
        return userBook;
    }

    create = async (userBookCreateInput: UserBookCreateInput): Promise<UserBookWithInclude> => {
        const userBook = await prisma.userBook.create({
            data: userBookCreateInput,
            include: this.userBookInclude,
        });
        return userBook;
    }

    update = async (userBookId: string, userBookUpdateInput: UserBookUpdateInput): Promise<UserBookWithInclude> => {
        const userBook = await prisma.userBook.update({
            where: { id: userBookId },
            data: userBookUpdateInput,
            include: this.userBookInclude,
        });
        return userBook;
    }
}