import { EStatusCode } from "./enums/status-code";

export class CustomError extends Error {
    public readonly statusCode: EStatusCode;
    public readonly title: string;
    public readonly detail?: string;
    public readonly invalid_params?: { name: string, reason: string }[];

    constructor(statusCode: EStatusCode, title: string, detail?: string, invalid_params?: { name: string, reason: string }[]) {
        super(title);
        this.title = title;
        this.detail = detail;
        this.statusCode = statusCode;
        this.invalid_params = invalid_params;
    }
}