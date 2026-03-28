import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
    throw new Error("O token de acesso não foi configurado. Verifique o arquivo .env.");
}

export default class Jwt {
    static generateAccessToken(userId: string): string {
        return jwt.sign({ userId }, process.env.JWT_SECRET ?? "", { expiresIn: '2h' });
    }

    static generateRefreshToken(userId: string): string {
        return jwt.sign({ userId }, process.env.JWT_SECRET ?? "", { expiresIn: '15d' });
    }
}