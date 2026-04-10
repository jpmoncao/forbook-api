import type { UserBookCreateWithUserIdBody, UserBookUpdateWithUserIdBody } from "@/schemas/userBook.schema";
import { UserBookCreateInput, UserBookFieldRefs, UserBookUpdateInput, UserBookWhereInput, UserFieldRefs } from "@/generated/prisma/models"
import UserBookRepository from "@/repositories/userBook.repository";
import { EUserBookException } from "@/errors/enums/userBook";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { UserBook, UserBookStatus } from "@/generated/prisma/browser";
import UserRepository from "@/repositories/user.repository";
import { EUserException } from "@/errors/enums/user";
import { UserBookWithInclude } from "@/types/UserBook";

export default class UserBookService {
    private readonly repository: UserBookRepository;
    private readonly userRepository: UserRepository;

    constructor() {
        this.repository = new UserBookRepository();
        this.userRepository = new UserRepository();
    }

    createUserBook = async (body: UserBookCreateWithUserIdBody): Promise<UserBookWithInclude> => {
        const user = await this.userRepository.findById(body.userId);
        if (!user) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EUserException.USER_NOT_FOUND,
                "Usuário não encontrado com o ID informado: " + body.userId,
                [{ name: "userId", reason: "O ID do usuário deve ser válido" }]
            );
        }

        const userBookCreateInput: UserBookCreateInput = {
            condition: body.condition,
            price: body.price,
            description: body.description,
            status: body.status,
            isPrivate: false,
            User: {
                connect: {
                    id: body.userId,
                },
            },
            CatalogBook: {
                connectOrCreate: {
                    where: {
                        isbn: body.catalogBook.isbn,
                    },
                    create: {
                        isbn: body.catalogBook.isbn,
                        title: body.catalogBook.title,
                        author: body.catalogBook.author,
                        description: body.catalogBook.description,
                        publisher: body.catalogBook.publisher,
                        year: body.catalogBook.year,
                    },
                },
            },
            MainImage: {
                connect: {
                    id: body.mainImageId,
                },
            },
            ...(body.galleryImages !== undefined && body.galleryImages.length > 0 && {
                GalleryImages: {
                    connect: body.galleryImages.map(imageId => ({ id: imageId })),
                },
            }),
        };

        const userBook = await this.repository.create(userBookCreateInput) as UserBookWithInclude;
        return userBook;
    }

    updateUserBook = async (userBookId: string, body: UserBookUpdateWithUserIdBody): Promise<UserBookWithInclude> => {
        const userBook = await this.repository.findById(userBookId);
        if (!userBook) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EUserBookException.USERBOOK_NOT_FOUND,
                "Livro não encontrado com o ID informado: " + userBookId,
                [{ name: "userBookId", reason: "O ID do livro deve ser válido" }]
            );
        }

        if (userBook.userId !== body.userId) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserBookException.USERBOOK_UNAUTHORIZED,
                "Livro não pertence ao usuário informado: " + body.userId,
                [{ name: "userId", reason: "O ID do usuário deve ser o mesmo do livro" }]
            );
        }

        const userBookUpdateInput: UserBookUpdateInput = {
            ...(body.price !== undefined && {
                price: body.price,
            }),
            ...(body.description !== undefined && {
                description: body.description,
            }),
            ...(body.status !== undefined && {
                status: body.status,
            }),
            ...(body.mainImageId !== undefined && {
                MainImage: {
                    connect: {
                        id: body.mainImageId,
                    },
                },
            }),
            ...(body.galleryImages !== undefined && {
                GalleryImages: {
                    set: body.galleryImages.map(imageId => ({ id: imageId })),
                },
            }),
        };

        const updatedUserBook = await this.repository.update(userBookId, userBookUpdateInput) as UserBookWithInclude;
        return updatedUserBook;
    }

    getUserBookById = async (userBookId: string): Promise<UserBookWithInclude> => {
        const userBook = await this.repository.findById(userBookId) as UserBookWithInclude;
        if (!userBook) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EUserBookException.USERBOOK_NOT_FOUND,
                "Livro não encontrado com o ID informado: " + userBookId,
                [{ name: "userBookId", reason: "O ID do livro deve ser válido" }]
            );
        }
        return userBook;
    }

    getAllUserBooks = async (filter: UserBookWhereInput): Promise<UserBookWithInclude[]> => {
        const userBooks = await this.repository.findAll(filter) as UserBookWithInclude[];
        return userBooks;
    }
}
