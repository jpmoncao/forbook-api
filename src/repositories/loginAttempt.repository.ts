import type { LoginAttempt } from "@/generated/prisma/client";
import type { LoginAttemptCreateInput, LoginAttemptUpdateInput } from "@/generated/prisma/models";
import AbstractRepository from "@/shared/repository";

export default class LoginAttemptRepository extends AbstractRepository<
    "loginAttempt",
    LoginAttempt,
    LoginAttemptCreateInput,
    LoginAttemptUpdateInput
> {
    protected readonly modelKey = "loginAttempt" as const;

    findByCode = async (code: string): Promise<LoginAttempt | null> => {
        return this.database.findFirst({
            where: { code },
        });
    };
}
