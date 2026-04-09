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
            throw new CustomError(EImageException.IMAGE_UPLOAD_FAILED, EStatusCode.BAD_REQUEST);
        }

        const uploadedImage = await this.service.uploadImage(image.buffer, image.mimetype);

        res.status(EStatusCode.CREATED).json({
            message: "Imagem enviada com sucesso",
            data: uploadedImage
        });
    }
}
