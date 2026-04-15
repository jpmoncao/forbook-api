import type { VerifyEmailAttempt } from "@/generated/prisma/client";
import type { VerifyEmailAttemptCreateInput, VerifyEmailAttemptUpdateInput } from "@/generated/prisma/models";
import AbstractRepository from "@/shared/repository";

export default class VerifyEmailAttemptRepository extends AbstractRepository<
    "verifyEmailAttempt",
    VerifyEmailAttempt,
    VerifyEmailAttemptCreateInput,
    VerifyEmailAttemptUpdateInput
> {
    protected readonly modelKey = "verifyEmailAttempt" as const;

    findByCode = async (code: string): Promise<VerifyEmailAttempt | null> => {
        return this.database.findFirst({
            where: { code },
        });
    };
}
