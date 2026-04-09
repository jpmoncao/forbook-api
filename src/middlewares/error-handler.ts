import { CustomError } from "@/errors/custom-error";
import { EGenericException } from "@/errors/enums/generic";
import { EStatusCode } from "@/errors/enums/status-code";
import { NextFunction, Request, Response } from "express";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(err);
    if (err instanceof CustomError) {
        res.status(err.statusCode).json({ message: err.message });
        return;
    }

    res.status(EStatusCode.INTERNAL_SERVER_ERROR).json({ message: EGenericException.INTERNAL_SERVER_ERROR });
};