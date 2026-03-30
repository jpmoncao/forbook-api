import { Request, Response } from "express";
import UserService from "../services/user.service";
import type { UserCreateBody } from "@/schemas/user.schema";
import { CustomError } from "../errors/custom-error";
import { EStatusCode } from "../errors/enums/status-code";
import { EGenericException } from "../errors/enums/generic";
import { EUserException } from "@/errors/enums/user";

export default class UserController {
    private readonly service: UserService;

    constructor() {
        this.service = new UserService();
    }

    createUser = async (req: Request, res: Response) => {
        try {
            const userCreateDTO = req.body as UserCreateBody;

            const user = await this.service.createUser(userCreateDTO);

            res.status(201).json({
                message: "Usuário criado com sucesso",
                data: user
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

    getUser = async (req: Request, res: Response) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new CustomError(EUserException.USER_UNAUTHORIZED, EStatusCode.UNAUTHORIZED);
            }

            const user = await this.service.getMe(userId);

            res.status(200).json({
                message: "Usuário obtido com sucesso",
                data: user,
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
}