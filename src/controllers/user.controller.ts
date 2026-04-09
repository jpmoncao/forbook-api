import { Request, Response } from "express";
import UserService from "@/services/user.service";
import type { UserCreateBody, UserUpdateBody } from "@/schemas/user.schema";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { EUserException } from "@/errors/enums/user";

export default class UserController {
    private readonly service: UserService;

    constructor() {
        this.service = new UserService();
    }

    createUser = async (req: Request, res: Response) => {
        const userCreateDTO = req.body as UserCreateBody;

        const user = await this.service.createUser(userCreateDTO);

        res.status(201).json({
            message: "Usuário criado com sucesso",
            data: user
        });
    }

    getUser = async (req: Request, res: Response) => {
        const userId = req.userId;
        if (!userId) {
            throw new CustomError(EUserException.USER_UNAUTHORIZED, EStatusCode.UNAUTHORIZED);
        }

        const user = await this.service.getMe(userId);

        res.status(200).json({
            message: "Usuário obtido com sucesso",
            data: user,
        });
    }

    updateUser = async (req: Request, res: Response) => {
        const userId = req.userId;
        if (!userId) {
            throw new CustomError(EUserException.USER_UNAUTHORIZED, EStatusCode.UNAUTHORIZED);
        }

        const userUpdateDTO = req.body as UserUpdateBody;

        const user = await this.service.updateUser(userId, userUpdateDTO);

        res.status(200).json({
            message: "Usuário atualizado com sucesso",
            data: user,
        });
    }
}
