import { Request, Response } from "express";
import UserBookService from "@/services/userBook.service";
import type { UserBookCreateWithUserIdBody, UserBookUpdateWithUserIdBody } from "@/schemas/userBook.schema";
import { UserBookStatus } from "@/generated/prisma/browser";
import parseQueryParams from "@/utils/query-param";

export default class UserBookController {
    private readonly service: UserBookService;

    constructor() {
        this.service = new UserBookService();
    }

    createUserBook = async (req: Request, res: Response) => {
        const userId = req.userId as string;

        req.body.userId = userId;
        const userBookCreateDTO = req.body as UserBookCreateWithUserIdBody;

        const userBook = await this.service.createUserBook(userBookCreateDTO);

        res.status(201).json({
            message: "Anúncio de livro criado com sucesso",
            data: userBook
        });
    }

    updateUserBook = async (req: Request, res: Response) => {
        const userBookId = req.params.id as string;
        const userId = req.userId as string;

        req.body.userId = userId;
        const userBookUpdateDTO = req.body as UserBookUpdateWithUserIdBody;

        const userBook = await this.service.updateUserBook(userBookId, userBookUpdateDTO);

        res.status(200).json({
            message: "Anúncio de livro atualizado com sucesso",
            data: userBook,
        });
    }

    getUserBookById = async (req: Request, res: Response) => {
        const userBookId = req.params.id as string;

        const userBook = await this.service.getUserBookById(userBookId);

        res.status(200).json({
            message: "Anúncio de livro encontrado com sucesso",
            data: userBook,
        });
    }

    getAllUserBooks = async (req: Request, res: Response) => {
        const queryParams = parseQueryParams(req.query);

        const userId = req.userId as string;
        const { term, filter } = queryParams.filter;
        queryParams.filter = {
            ...(term !== undefined && {
                OR: [
                    {
                        CatalogBook: {
                            title: {
                                contains: queryParams.filter.term,
                                mode: "insensitive"
                            },
                        },
                    },
                    {
                        CatalogBook: {
                            author: {
                                contains: queryParams.filter.term,
                                mode: "insensitive"
                            },
                        },
                    },
                    {
                        CatalogBook: {
                            publisher: {
                                contains: queryParams.filter.term,
                                mode: "insensitive"
                            },
                        },
                    },
                    {
                        CatalogBook: {
                            isbn: {
                                contains: queryParams.filter.term,
                            },
                        },
                    },
                ]
            }),
            ...filter,
            userId: {
                not: userId,
            },
            status: UserBookStatus.ACTIVE,
            isPrivate: false,
        }

        const { data: userBooks, meta } = await this.service.getAllUserBooks(queryParams);

        res.status(200).json({
            message: "Anúncios de livros encontrados com sucesso",
            data: userBooks,
            meta,
        });
    }

    getMyUserBooks = async (req: Request, res: Response) => {
        const queryParams = parseQueryParams(req.query);

        const userId = req.userId as string;
        queryParams.filter = {
            ...queryParams.filter,
            userId: userId,
            status: UserBookStatus.ACTIVE,
            isPrivate: false,
        }

        const { data: userBooks, meta } = await this.service.getAllUserBooks(queryParams);

        res.status(200).json({
            message: "Meus anúncios de livros encontrados com sucesso",
            data: userBooks,
            meta,
        });
    }
}
