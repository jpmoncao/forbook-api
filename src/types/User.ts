import { User } from "@/generated/prisma/client";

export type UserPublic = Omit<User, "password">;
