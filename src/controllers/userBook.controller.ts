import { Request, Response } from "express";
import UserBookService from "@/services/userBook.service";
import type { UserBookCreateWithUserIdBody, UserBookUpdateWithUserIdBody } from "@/schemas/userBook.schema";
import { UserBookStatus } from "@/generated/prisma/browser";

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
        const userId = req.userId as string;
        const userBooks = await this.service.getAllUserBooks({
            userId: {
                not: userId,
            },
            status: UserBookStatus.ACTIVE,
            isPrivate: false,
        });

        res.status(200).json({
            message: "Anúncios de livros encontrados com sucesso",
            data: userBooks,
        });
    }

    getMyUserBooks = async (req: Request, res: Response) => {
        const userId = req.userId as string;
        const userBooks = await this.service.getAllUserBooks({
            userId,
            status: UserBookStatus.ACTIVE,
            isPrivate: false,
        });

        res.status(200).json({
            message: "Meus anúncios de livros encontrados com sucesso",
            data: userBooks,
        });
    }
}
