import { UserBookGetPayload } from "@/generated/prisma/models";

export const userBookOmit = {
    mainImageId: true,
    userId: true,
    bookId: true,
    createdAt: true,
    updatedAt: true,
    offeredInTradeOfferId: true,
} as const;

export const userBookInclude = {
    User: {
        omit: {
            createdAt: true,
            updatedAt: true,
            password: true,
            profileImageId: true,
        },
        include: {
            Address: {
                omit: {
                    createdAt: true,
                    updatedAt: true,
                    userId: true,
                },
            },
            ProfileImage: {
                omit: {
                    createdAt: true,
                    updatedAt: true,
                    userBookId: true,
                },
            },
        },
    },
    MainImage: {
        omit: {
            createdAt: true,
            updatedAt: true,
            userBookId: true,
        },
    },
    GalleryImages: {
        omit: {
            createdAt: true,
            updatedAt: true,
            userBookId: true,
        },
    },
    CatalogBook: true,
} as const;

export const userBookQueryArgs = {
    omit: userBookOmit,
    include: userBookInclude,
} as const;

export type UserBookWithInclude = UserBookGetPayload<{
    omit: typeof userBookOmit;
    include: typeof userBookInclude;
}>;
