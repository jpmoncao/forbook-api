import { Request, Response } from "express";
import AuthService from "@/services/auth.service";
import type { ConfirmLoginBody, LoginBody } from "@/schemas/auth.schema";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { EGenericException } from "@/errors/enums/generic";

export default class AuthController {
    private readonly service: AuthService;

    constructor() {
        this.service = new AuthService();
    }

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body as LoginBody;

            await this.service.login({ email, password });

            res.status(200).json({
                message: "Código verificado enviado com sucesso",
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

    confirmLogin = async (req: Request, res: Response) => {
        try {
            const { email, code } = req.body as ConfirmLoginBody;

            const tokens = await this.service.confirmLogin({ email, code });

            res.status(200).json({
                message: "Login confirmado com sucesso",
                data: tokens,
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
