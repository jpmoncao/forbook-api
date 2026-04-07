import { UserBookGetPayload } from "@/generated/prisma/models";


export type UserBookWithInclude = UserBookGetPayload<{
    include: {
        User: {
            include: {
                Address: {
                    omit: {
                        createdAt: true,
                        updatedAt: true,
                        userId: true,
                    }
                },
                ProfileImage: {
                    omit: {
                        createdAt: true,
                        updatedAt: true,
                        userBookId: true,
                    }
                },
            }
        },
        CatalogBook: true,
        MainImage: {
            omit: {
                createdAt: true,
                updatedAt: true,
                userBookId: true,
            }
        },
        GalleryImages: {
            omit: {
                createdAt: true,
                updatedAt: true,
                userBookId: true,
            }
        },
    };
}>;