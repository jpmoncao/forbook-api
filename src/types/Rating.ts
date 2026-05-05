import type { RatingGetPayload } from "@/generated/prisma/models";

export type RatingWithInclude = RatingGetPayload<{
    include: {
        RatedBy: true;
        RatedTo: true;
    };
}>;