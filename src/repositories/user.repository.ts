import prisma from "@/config/prisma";
import { User } from "@/generated/prisma/client";
import { UserCreateInput, UserInclude, UserUpdateInput } from "@/generated/prisma/models";
import type { UserWithInclude } from "@/types/User";

export default class UserRepository {
    create = async (userCreateInput: UserCreateInput): Promise<User> => {
        const user = await prisma.user.create({
            data: userCreateInput,
        });
        return user;
    }

    update = async (id: string, userUpdateInput: UserUpdateInput): Promise<UserWithInclude> => {
        return prisma.user.update({
            where: { id },
            data: userUpdateInput,
            include: {
                ProfileImage: true,
            },
        });
    }

    findById = async (id: string): Promise<User | null> => {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                ProfileImage: true,
            },
        });
        return user;
    }

    findByIdWithInclude = async (id: string, include: UserInclude): Promise<UserWithInclude | null> => {
        const user = await prisma.user.findUnique({
            where: { id },
            include,
        });
        return user;
    }

    findByEmail = async (email: string): Promise<User | null> => {
        const user = await prisma.user.findFirst({
            where: { email },
        });
        return user;
    }

    findByCpf = async (cpf: string): Promise<User | null> => {
        const user = await prisma.user.findFirst({
            where: { cpf },
        });
        return user;
    }

    findByPhoneNumber = async (phoneNumber: string): Promise<User | null> => {
        const user = await prisma.user.findFirst({
            where: { phoneNumber },
        });
        return user;
    }
}