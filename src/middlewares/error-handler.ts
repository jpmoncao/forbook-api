import { CustomError } from "@/errors/custom-error";
import { EGenericException } from "@/errors/enums/generic";
import { EStatusCode } from "@/errors/enums/status-code";
import { NextFunction, Request, Response } from "express";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(err);
    if (err instanceof CustomError) {
        res.status(err.statusCode).json({
            //type: "https://forbook.com.br/errors/...",
            title: err.title,
            status: err.statusCode,
            ...(err.detail && { detail: err.detail }),
            ...(req.originalUrl && { instance: req.originalUrl }),
            ...(err.invalid_params && { invalid_params: err.invalid_params })
        });
        return;
    }

    res.status(EStatusCode.INTERNAL_SERVER_ERROR).json({
        //type: "https://forbook.com.br/errors/...",
        title: EGenericException.INTERNAL_SERVER_ERROR,
        status: EStatusCode.INTERNAL_SERVER_ERROR,
        instance: req.originalUrl,
    });
};