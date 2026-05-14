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
    };

    getCatalogBookIdsByUserId = async (userId: string): Promise<string[]> => {
        const row = await this.database.findUnique({
            where: { userId },
            select: {
                CatalogBooks: { select: { id: true } },
            },
        });
        return row?.CatalogBooks.map((b: { id: string }) => b.id) ?? [];
    };

    catalogBookIsWishlisted = async (userId: string, catalogBookId: string): Promise<boolean> => {
        const row = await this.database.findUnique({
            where: { userId },
            select: {
                CatalogBooks: {
                    where: { id: catalogBookId },
                    select: { id: true },
                    take: 1,
                },
            },
        });
        return (row?.CatalogBooks.length ?? 0) > 0;
    };
}