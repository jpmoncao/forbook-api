import prisma from "@/config/prisma";
import { User } from "@/generated/prisma/client";
import { UserCreateInput } from "@/generated/prisma/models";

export default class UserRepository {
    create = async (userCreateInput: UserCreateInput): Promise<User> => {
        const user = await prisma.user.create({
            data: userCreateInput,
        });
        return user;
    }

    findByEmail = async (email: string): Promise<User | null> => {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    }

    findByCpf = async (cpf: string): Promise<User | null> => {
        const user = await prisma.user.findUnique({
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