import { Request, Response } from "express";
import UserBookService from "@/services/userBook.service";
import type { UserBookCreateWithUserIdBody, UserBookUpdateWithUserIdBody } from "@/schemas/userBook.schema";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { EGenericException } from "@/errors/enums/generic";
import { UserBookStatus } from "@/generated/prisma/browser";

export default class UserBookController {
    private readonly service: UserBookService;

    constructor() {
        this.service = new UserBookService();
    }

    createUserBook = async (req: Request, res: Response) => {
        try {
            const userId = req.userId as string;

            req.body.userId = userId;
            const userBookCreateDTO = req.body as UserBookCreateWithUserIdBody;

            const userBook = await this.service.createUserBook(userBookCreateDTO);

            res.status(201).json({
                message: "Anúncio de livro criado com sucesso",
                data: userBook
            });
        } catch (error) {
            console.error(error);

            if (error instanceof CustomError) {
                res.status(error.statusCode).json({ message: error.message });
                return;
            }

            res.status(EStatusCode.INTERNAL_SERVER_ERROR).json({ message: EGenericException.INTERNAL_SERVER_ERROR });
        }
    }

    updateUserBook = async (req: Request, res: Response) => {
        try {
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
        catch (error) {
            console.error(error);

            if (error instanceof CustomError) {
                res.status(error.statusCode).json({ message: error.message });
                return;
            }

            res.status(EStatusCode.INTERNAL_SERVER_ERROR).json({ message: EGenericException.INTERNAL_SERVER_ERROR });
        }
    }

    getUserBookById = async (req: Request, res: Response) => {
        try {
            const userBookId = req.params.id as string;

            const userBook = await this.service.getUserBookById(userBookId);

            res.status(200).json({
                message: "Anúncio de livro encontrado com sucesso",
                data: userBook,
            });
        }
        catch (error) {
            console.error(error);

            if (error instanceof CustomError) {
                res.status(error.statusCode).json({ message: error.message });
                return;
            }

            res.status(EStatusCode.INTERNAL_SERVER_ERROR).json({ message: EGenericException.INTERNAL_SERVER_ERROR });
        }
    }

    getAllUserBooks = async (req: Request, res: Response) => {
        try {
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
        catch (error) {
            console.error(error);

            if (error instanceof CustomError) {
                res.status(error.statusCode).json({ message: error.message });
                return;
            }

            res.status(EStatusCode.INTERNAL_SERVER_ERROR).json({ message: EGenericException.INTERNAL_SERVER_ERROR });
        }
    }

    getMyUserBooks = async (req: Request, res: Response) => {
        try {
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
        catch (error) {
            console.error(error);

            if (error instanceof CustomError) {
                res.status(error.statusCode).json({ message: error.message });
                return;
            }

            res.status(EStatusCode.INTERNAL_SERVER_ERROR).json({ message: EGenericException.INTERNAL_SERVER_ERROR });
        }
    }
}