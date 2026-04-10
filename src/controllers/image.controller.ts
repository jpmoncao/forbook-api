import { Request, Response } from "express";
import ImageService from "@/services/image.service";
import { CustomError } from "../errors/custom-error";
import { EStatusCode } from "../errors/enums/status-code";
import { EImageException } from "@/errors/enums/image";
export default class ImageController {
    private readonly service: ImageService;

    constructor() {
        this.service = new ImageService();
    }

    uploadImage = async (req: Request, res: Response) => {
        const image = req.file;
        if (!image) {
            throw new CustomError(
                EStatusCode.BAD_REQUEST,
                EImageException.IMAGE_UPLOAD_FAILED,
                "Nenhuma imagem enviada, anexe uma imagem para fazer o upload",
                [{ name: "file", reason: "O campo file é obrigatório" }]
            );
        }

        const uploadedImage = await this.service.uploadImage(image.buffer, image.mimetype);

        res.status(EStatusCode.CREATED).json({
            message: "Imagem enviada com sucesso",
            data: uploadedImage
        });
    }
}
