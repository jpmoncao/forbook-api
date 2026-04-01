import prisma from "@/config/prisma";
import { Image } from "@/generated/prisma/client";
import { ImageCreateInput } from "@/generated/prisma/models";

export default class ImageRepository {
    create = async (imageCreateInput: ImageCreateInput): Promise<Image> => {
        const image = await prisma.image.create({
            data: imageCreateInput,
        });
        return image;
    }

}