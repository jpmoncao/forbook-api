import { CustomError } from "@/errors/custom-error";
import { EImageException } from "@/errors/enums/image";
import { EStatusCode } from "@/errors/enums/status-code";
import multer from "multer";

export const multerMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
    },
    fileFilter: (_, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(null, false);
            throw new CustomError(EImageException.IMAGE_UPLOAD_FAILED, EStatusCode.BAD_REQUEST);
        }
    },
});