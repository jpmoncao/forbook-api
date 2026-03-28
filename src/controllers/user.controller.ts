import { Request, Response } from "express";
import { IUserCreateDTO } from "@/interfaces/user";
import UserService from "../services/user.service";
import { CustomError } from "../errors/custom-error";
import { EStatusCode } from "../errors/enums/status-code";
import { EGenericException } from "../errors/enums/generic";

export default class UserController {
    private readonly service: UserService;

    constructor() {
        this.service = new UserService();
    }

    createUser = async (req: Request, res: Response) => {
        try {
            const userCreateDTO = req.body as IUserCreateDTO;

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
}