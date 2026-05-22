import { UserBookCondition, UserBookStatus } from "@/generated/prisma/enums";
import { z } from "@/docs/zod-openapi";
import { apiJsonListResponseSchema, apiJsonResponseSchema, messageResponseSchema } from "@/schemas/responses/common.schema";

export const healthResponseSchema = z
    .object({
        message: z.string(),
    })
    .openapi("HealthResponse");

export const userTokensSchema = z
    .object({
        accessToken: z.string(),
        refreshToken: z.string(),
    })
    .openapi("UserTokens");

export const userLoginSchema = z
    .object({
        userId: z.string().uuid(),
        isEmailVerified: z.boolean(),
        isReceiveTwoFactorAuthEmail: z.boolean(),
    })
    .openapi("UserLogin");

export const loginDataSchema = z.union([userTokensSchema, userLoginSchema]).openapi("LoginData");

export const loginResponseSchema = apiJsonResponseSchema("LoginResponse", loginDataSchema);
export const confirmLoginResponseSchema = apiJsonResponseSchema("ConfirmLoginResponse", userTokensSchema);

export const addressResponseSchema = z
    .object({
        id: z.string().uuid(),
        street: z.string(),
        number: z.string(),
        complement: z.string().nullable(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        userId: z.string().uuid(),
        isDefault: z.boolean().optional(),
    })
    .openapi("AddressResponse");

export const userResponseSchema = z
    .object({
        id: z.string().uuid(),
        email: z.string().email(),
        name: z.string(),
        phoneNumber: z.string(),
        cpf: z.string(),
        birthDate: z.string().datetime(),
        isEmailVerified: z.boolean(),
        isReceiveTwoFactorAuthEmail: z.boolean(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
        averageRating: z.number().optional(),
        totalRatings: z.number().optional(),
        Addresses: z.array(addressResponseSchema).optional(),
        ProfileImage: z
            .object({
                id: z.string().uuid(),
                url: z.string(),
            })
            .nullable()
            .optional(),
    })
    .openapi("UserResponse");

export const createUserResponseSchema = apiJsonResponseSchema("CreateUserResponse", userResponseSchema);
export const userResponseEnvelopeSchema = apiJsonResponseSchema("UserResponseEnvelope", userResponseSchema);
export const usersListResponseSchema = apiJsonListResponseSchema("UsersListResponse", userResponseSchema);
export const addressResponseEnvelopeSchema = apiJsonResponseSchema("AddressResponseEnvelope", addressResponseSchema);
export const wishlistResponseSchema = apiJsonResponseSchema(
    "WishlistResponse",
    z.array(
        z
            .object({
                id: z.string().uuid(),
                userId: z.string().uuid(),
                catalogBookId: z.string().uuid(),
            })
            .openapi("WishlistItem")
    )
);

export const catalogBookResponseSchema = z
    .object({
        isbn: z.string(),
        title: z.string(),
        author: z.string(),
        description: z.string(),
        year: z.number(),
        publisher: z.string(),
    })
    .openapi("CatalogBookResponse");

export const catalogBookResponseEnvelopeSchema = apiJsonResponseSchema(
    "CatalogBookResponseEnvelope",
    catalogBookResponseSchema
);

export const userBookResponseSchema = z
    .object({
        id: z.string().uuid(),
        condition: z.enum(UserBookCondition),
        price: z.number(),
        description: z.string(),
        status: z.enum(UserBookStatus),
        userId: z.string().uuid(),
        catalogBookId: z.string().uuid(),
        mainImageId: z.string().uuid(),
        CatalogBook: catalogBookResponseSchema.optional(),
    })
    .openapi("UserBookResponse");

export const createUserBookResponseSchema = apiJsonResponseSchema("CreateUserBookResponse", userBookResponseSchema);
export const userBookResponseEnvelopeSchema = apiJsonResponseSchema("UserBookResponseEnvelope", userBookResponseSchema);
export const userBooksListResponseSchema = apiJsonListResponseSchema("UserBooksListResponse", userBookResponseSchema);

export const ratingResponseSchema = z
    .object({
        id: z.string().uuid(),
        value: z.number().int().min(1).max(5),
        comment: z.string(),
        ratedById: z.string().uuid(),
        ratedToId: z.string().uuid(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
    })
    .openapi("RatingResponse");

export const createRatingResponseSchema = apiJsonResponseSchema("CreateRatingResponse", ratingResponseSchema);
export const ratingResponseEnvelopeSchema = apiJsonResponseSchema("RatingResponseEnvelope", ratingResponseSchema);
export const ratingsListResponseSchema = apiJsonListResponseSchema("RatingsListResponse", ratingResponseSchema);

export const imageResponseSchema = z
    .object({
        id: z.string().uuid(),
        url: z.string(),
        createdAt: z.string().datetime(),
    })
    .openapi("ImageResponse");

export const imageUploadResponseSchema = apiJsonResponseSchema("ImageUploadResponse", imageResponseSchema);

export const deleteMessageResponseSchema = messageResponseSchema;
