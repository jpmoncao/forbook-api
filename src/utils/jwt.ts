import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
    throw new Error("O token de acesso não foi configurado. Verifique o arquivo .env.");
}

const secret = process.env.JWT_SECRET ?? "";

export default class Jwt {
    static generateAccessToken(userId: string): string {
        return jwt.sign({ userId }, secret, { expiresIn: "15d" });
    }

    static generateRefreshToken(userId: string): string {
        return jwt.sign({ userId }, secret, { expiresIn: "15d" });
    }

    static verifyAccessToken(token: string): { userId: string } {
        const decoded = jwt.verify(token, secret);

        if (typeof decoded === "string" || decoded === null || typeof decoded !== "object" || Array.isArray(decoded)) {
            throw new jwt.JsonWebTokenError("Token inválido");
        }

        const userId = (decoded as Record<string, unknown>).userId;
        if (typeof userId !== "string" || userId.length === 0) {
            throw new jwt.JsonWebTokenError("Payload do token inválido");
        }

        return { userId };
    }
}