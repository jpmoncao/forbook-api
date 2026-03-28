import { NextFunction, Request, Response } from "express";
import { z, ZodSchema } from "zod";
import { EStatusCode } from "@/errors/enums/status-code";
import { EGenericException } from "@/errors/enums/generic";

export function validateBody<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            console.log(result.error);

            res.status(EStatusCode.UNPROCESSABLE_ENTITY).json({
                message: EGenericException.INVALID_BODY,
                errors: z.flattenError(result.error).fieldErrors,
            });
            return;
        }

        req.body = result.data as Request["body"];
        next();
    };
}
