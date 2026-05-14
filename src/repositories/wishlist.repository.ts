import type { Wishlist } from "@/generated/prisma/client";
import type { WishlistCreateInput, WishlistUpdateInput } from "@/generated/prisma/models";
import AbstractRepository from "@/shared/repository";
import { WishlistWithInclude } from "@/types/Wishlist";

export default class WishlistRepository extends AbstractRepository<
    "wishlist",
    Wishlist,
    WishlistCreateInput,
    WishlistUpdateInput
> {
    protected readonly modelKey = "wishlist" as const;

    findByUserId = async (userId: string): Promise<WishlistWithInclude | null> => {
        return this.database.findUnique({
            where: { userId },
            include: {
                CatalogBooks: true,
            },
        });
    }
}