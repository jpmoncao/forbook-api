import type { Rating } from "@/generated/prisma/client";
import type { RatingCreateInput, RatingUpdateInput } from "@/generated/prisma/models";
import AbstractRepository from "@/shared/repository";

export default class RatingRepository extends AbstractRepository<
    "rating",
    Rating,
    RatingCreateInput,
    RatingUpdateInput
> {
    protected readonly modelKey = "rating" as const;
}
