import { Request, Response } from "express";
import AuthService from "@/services/auth.service";
import type { ConfirmLoginBody, LoginBody } from "@/schemas/auth.schema";

export default class AuthController {
    private readonly service: AuthService;

    constructor() {
        this.service = new AuthService();
    }

    login = async (req: Request, res: Response) => {
        const { email, password } = req.body as LoginBody;

        await this.service.login({ email, password });

        res.status(200).json({
            message: "Código verificado enviado com sucesso",
        });
    }

    confirmLogin = async (req: Request, res: Response) => {
        const { email, code } = req.body as ConfirmLoginBody;

        const tokens = await this.service.confirmLogin({ email, code });

        res.status(200).json({
            message: "Login confirmado com sucesso",
            data: tokens,
        });
    }
}   
