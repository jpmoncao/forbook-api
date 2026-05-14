import { type WishlistGetPayload } from "@/generated/prisma/models";

export type WishlistWithInclude = WishlistGetPayload<{
    include: {
        CatalogBooks: true;
    };
}>;
