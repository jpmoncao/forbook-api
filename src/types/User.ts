import type { Address, Image, Rating, User } from "@/generated/prisma/client";

export type UserWithInclude = User & {
    ProfileImage?: Image | null;
    Addresses?: Address[];
    DefaultAddress?: Address | null;
    Ratings?: Rating[];
};

export type AddressWithDefaultFlag = Address & { isDefault: boolean };

export type UserPublicWithInclude = Omit<
    UserWithInclude,
    "password" | "profileImageId" | "defaultAddressId"
> & {
    averageRating: number;
    totalRatings: number;
    Addresses?: AddressWithDefaultFlag[];
};

export type UserPublic = Omit<User, "password" | "profileImageId" | "defaultAddressId">;

export function toUserPublicWithInclude(user: UserWithInclude): UserPublicWithInclude {
    const ratings = user.Ratings ?? [];
    const averageRating = ratings.length > 0 ? ratings.reduce((acc, rating) => acc + rating.value, 0) / ratings.length : 0;
    const totalRatings = ratings.length > 0 ? ratings.length : 0;

    const defaultId = user.defaultAddressId ?? user.DefaultAddress?.id ?? null;

    const {
        password: _pwd,
        profileImageId: _img,
        defaultAddressId: _defAddr,
        Ratings: _ratingRows,
        Addresses,
        DefaultAddress: _daf,
        ...rest
    } = user;

    return {
        ...rest,
        ...(Addresses !== undefined
            ? {
                Addresses: Addresses.map((address) => ({
                    ...address,
                    isDefault: address.id === defaultId,
                })),
            }
            : {}),
        averageRating,
        totalRatings,
    };
}

export function toUserPublic(user: User): UserPublic {
    const { password: _, profileImageId: __, defaultAddressId: ___, ...publicUser } = user;
    return publicUser;
}

export type UserLogin = {
    userId: string;
    isEmailVerified: boolean;
    isReceiveTwoFactorAuthEmail: boolean;
}

export type UserTokens = {
    accessToken: string;
    refreshToken: string;
};

export function isUserTokens(value: UserLogin | UserTokens): value is UserTokens {
    return "accessToken" in value && "refreshToken" in value;
}
