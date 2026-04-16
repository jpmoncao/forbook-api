import type { User } from "@/generated/prisma/client";
import type { UserCreateInput, UserInclude, UserUpdateInput } from "@/generated/prisma/models";
import AbstractRepository from "@/shared/repository";
import type { UserWithInclude } from "@/types/User";

export default class UserRepository extends AbstractRepository<
    "user",
    User,
    UserCreateInput,
    UserUpdateInput
> {
    protected readonly modelKey = "user" as const;

    findById = (id: string) => this.getById(id);

    findByIdWithInclude = async (id: string, include: UserInclude): Promise<UserWithInclude | null> => {
        return this.database.findUnique({ where: { id }, include });
    };

    findByEmail = async (email: string): Promise<User | null> => {
        return this.database.findFirst({ where: { email } });
    };

    findByCpf = async (cpf: string): Promise<User | null> => {
        return this.database.findFirst({ where: { cpf } });
    };

    findByPhoneNumber = async (phoneNumber: string): Promise<User | null> => {
        return this.database.findFirst({ where: { phoneNumber } });
    };

    override async update(id: string, data: UserUpdateInput): Promise<UserWithInclude> {
        return this.database.update({
            where: { id },
            data,
            include: { ProfileImage: true },
        });
    }

    findUsers = async (): Promise<User[]> => {
        return this.getAll({
            orderBy: {
                name: "desc"
            },
        });
    }

    findUsersOrderId = async (): Promise<User[]> => {
        return this.getAll({
            orderBy: {
                id: "desc"
            },
        });
    }
}
