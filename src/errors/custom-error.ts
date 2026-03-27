import { EStatusCode } from "./enums/status-code";

export class CustomError extends Error {
    public readonly statusCode: EStatusCode;

    constructor(message: string, statusCode: EStatusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}