import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Jwt from "@/utils/jwt";
import { EStatusCode } from "@/errors/enums/status-code";
import { EAuthException } from "@/errors/enums/auth";
import { CustomError } from "@/errors/custom-error";

export function validateToken(req: Request, res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        throw new CustomError(
            EStatusCode.UNAUTHORIZED,
            EAuthException.AUTH_INVALID_TOKEN,
            "O header espera um bearer token",
            [{ name: "authorization", reason: "O token de autentificação deve ser um bearer token" }]
        );
    }

    const token = auth.slice("Bearer ".length).trim();
    if (!token) {
        throw new CustomError(
            EStatusCode.UNAUTHORIZED,
            EAuthException.AUTH_INVALID_TOKEN,
            "O token de autentificação informado não possui um formato válido",
            [{ name: "authorization", reason: "O token de autentificação é obrigatório" }]
        );
    }

    try {
        const { userId } = Jwt.verifyAccessToken(token);
        req.userId = userId;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EAuthException.AUTH_EXPIRED_TOKEN,
                "O token de autentificação expirou, por favor, renovie o token",
                [{ name: "authorization", reason: "O token de autentificação deve ser renovado" }]
            );
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EAuthException.AUTH_INVALID_TOKEN,
                "O token de autentificação informado não é válido",
                [{ name: "authorization", reason: "O token de autentificação deve ser válido" }]
            );
        }

        throw new CustomError(
            EStatusCode.INTERNAL_SERVER_ERROR,
            EAuthException.AUTH_INVALID_TOKEN,
            "Ocorreu um erro ao validar o token de autentificação"
        );
    }
}
