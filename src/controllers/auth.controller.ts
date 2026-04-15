import { Request, Response } from "express";
import AuthService from "@/services/auth.service";
import type { ConfirmLoginBody, LoginBody } from "@/schemas/auth.schema";
import { isUserTokens } from "@/types/User";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { buildVerifyEmailResultPage } from "@/utils/verify-email-result-page";

function queryParamAsString(value: unknown): string | undefined {
    if (typeof value === "string" && value.trim() !== "") {
        return value;
    }
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim() !== "") {
        return value[0];
    }
    return undefined;
}

export default class AuthController {
    private readonly service: AuthService;

    constructor() {
        this.service = new AuthService();
    }

    login = async (req: Request, res: Response) => {
        const { email, password } = req.body as LoginBody;

        const response = await this.service.login({ email, password });

        const message = isUserTokens(response)
            ? "Login confirmado com sucesso"
            : "Verifique seu e-mail, enviamos um código de verificação para você";

        res.status(200).json({
            message,
            data: response
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

    verifyEmailCode = async (req: Request, res: Response) => {
        const code = queryParamAsString(req.query.code);
        if (!code) {
            const html = buildVerifyEmailResultPage({
                success: false,
                heading: "Link inválido",
                message: "Não foi possível encontrar o código de verificação neste link. Abra o link completo enviado por e-mail ou solicite um novo código.",
            });
            return res.status(EStatusCode.BAD_REQUEST).type("html").send(html);
        }

        try {
            await this.service.verifyEmailCode(code);
        } catch (err) {
            if (err instanceof CustomError) {
                const html = buildVerifyEmailResultPage({
                    success: false,
                    heading: "Não foi possível verificar o e-mail",
                    message: err.detail ?? err.title,
                });
                return res.status(err.statusCode).type("html").send(html);
            }
            throw err;
        }

        const html = buildVerifyEmailResultPage({
            success: true,
            heading: "E-mail verificado",
            message: "Seu endereço de e-mail foi confirmado com sucesso. Você já pode fechar esta página e voltar ao aplicativo.",
        });
        return res.status(200).type("html").send(html);
    };
}
