import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Jwt from "@/utils/jwt";
import { EStatusCode } from "@/errors/enums/status-code";
import { EAuthException } from "@/errors/enums/auth";
import { CustomError } from "@/errors/custom-error";

export function validateToken(req: Request, res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        throw new CustomError(EAuthException.AUTH_INVALID_TOKEN, EStatusCode.UNAUTHORIZED);
    }

    const token = auth.slice("Bearer ".length).trim();
    if (!token) {
        throw new CustomError(EAuthException.AUTH_INVALID_TOKEN, EStatusCode.UNAUTHORIZED);
    }

    try {
        const { userId } = Jwt.verifyAccessToken(token);
        req.userId = userId;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new CustomError(EAuthException.AUTH_EXPIRED_TOKEN, EStatusCode.UNAUTHORIZED);
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new CustomError(EAuthException.AUTH_INVALID_TOKEN, EStatusCode.UNAUTHORIZED);
        }
        
        throw new CustomError(EAuthException.AUTH_INVALID_TOKEN, EStatusCode.INTERNAL_SERVER_ERROR);
    }
}
