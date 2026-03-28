import prisma from "@/config/prisma";
import { LoginAttempt } from "@/generated/prisma/client";
import { LoginAttemptCreateInput, LoginAttemptUpdateInput } from "@/generated/prisma/models";

export default class LoginAttemptRepository {
    create = async (loginAttemptCreateInput: LoginAttemptCreateInput): Promise<LoginAttempt> => {
        return await prisma.loginAttempt.create({
            data: loginAttemptCreateInput
        });
    }

    update = async (id: string, loginAttemptUpdateInput: LoginAttemptUpdateInput): Promise<LoginAttempt> => {
        return await prisma.loginAttempt.update({
            where: { id },
            data: loginAttemptUpdateInput
        });
    }

    findByCode = async (code: string): Promise<LoginAttempt | null> => {
        return await prisma.loginAttempt.findFirst({
            where: {
                code
            }
        });
    }
}