import { User } from "@/generated/prisma/client";
import { UserGetPayload } from "@/generated/prisma/models";

const fieldsToExclude = ["password", "profileImageId"] as const;

export type UserWithInclude = UserGetPayload<{
    include: {
        ProfileImage: true;
    };
}>;

export type UserPublicWithInclude = Omit<UserWithInclude, (typeof fieldsToExclude)[number]>;

export type UserPublic = Omit<User, (typeof fieldsToExclude)[number]>;

export function toUserPublicWithInclude(user: UserWithInclude): UserPublicWithInclude {
    const { password: _, profileImageId: __, ...publicUser } = user;
    return publicUser;
}

export function toUserPublic(user: User): UserPublic {
    const { password: _, profileImageId: __, ...publicUser } = user;
    return publicUser;
}
