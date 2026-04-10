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
            throw new CustomError(
                EStatusCode.BAD_REQUEST,
                EImageException.IMAGE_UPLOAD_FAILED,
                "O tipo do arquivo enviado falhou na validação como uma imagem",
                [{ name: "file", reason: "O tipo do arquivo deve ser uma imagem" }]
            );
        }
    },
});