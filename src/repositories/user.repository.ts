import type { Address, User } from "@/generated/prisma/client";
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
        return await this.database.findUnique({ where: { id }, include });
    };

    findByEmail = async (email: string): Promise<User | null> => {
        return await this.database.findFirst({ where: { email } });
    };

    findByCpf = async (cpf: string): Promise<User | null> => {
        return await this.database.findFirst({ where: { cpf } });
    };

    findByPhoneNumber = async (phoneNumber: string): Promise<User | null> => {
        return await this.database.findFirst({ where: { phoneNumber } });
    };

    override async create(data: UserCreateInput): Promise<User> {
        const row = await this.database.create({
            data,
            include: { Addresses: true },
        });
        const defaultId = row.Addresses[0]?.id;
        if (!defaultId) {
            return row;
        }
        return await this.database.update({
            where: { id: row.id },
            data: { defaultAddressId: defaultId },
        });
    }

    override async update(id: string, data: UserUpdateInput): Promise<UserWithInclude> {
        return await this.database.update({
            where: { id },
            data,
            include: {
                ProfileImage: true,
                Addresses: true,
                DefaultAddress: true,
                Ratings: true,
            },
        });
    }

    findUsers = async (): Promise<User[]> => {
        return await this.getAll({
            orderBy: {
                name: "desc"
            },
        });
    }

    setDefaultAddressId = async (userId: string, addressId: string): Promise<User> => {
        return await this.database.update({
            where: { id: userId },
            data: { defaultAddressId: addressId },
        });
    }

    deleteAddressWithDefaultFallback = async (
        userId: string,
        addressId: string,
        addresses: Address[],
        defaultAddressId: string | null,
    ): Promise<void> => {
        const wasDefault = defaultAddressId === addressId;
        const nextDefaultId = wasDefault
            ? addresses
                .filter((address) => address.id !== addressId)
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]?.id
            : undefined;

        await this.client.$transaction(async (tx) => {
            await tx.address.delete({ where: { id: addressId } });
            if (wasDefault && nextDefaultId) {
                await tx.user.update({
                    where: { id: userId },
                    data: { defaultAddressId: nextDefaultId },
                });
            }
        });
    }
}
