import type { Image } from "@/generated/prisma/client";
import type { ImageCreateInput, ImageUpdateInput } from "@/generated/prisma/models";
import AbstractRepository from "@/shared/repository";

export default class ImageRepository extends AbstractRepository<
    "image",
    Image,
    ImageCreateInput,
    ImageUpdateInput
> {
    protected readonly modelKey = "image" as const;
}
