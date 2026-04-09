import type { UserBookCreateInput, UserBookUpdateInput, UserBookWhereInput } from "@/generated/prisma/models";
import AbstractRepository from "@/shared/repository";
import { userBookInclude, type UserBookWithInclude } from "@/types/UserBook";

export default class UserBookRepository extends AbstractRepository<
    "userBook",
    UserBookWithInclude,
    UserBookCreateInput,
    UserBookUpdateInput
> {
    protected readonly modelKey = "userBook" as const;

    findAll = async (filter: UserBookWhereInput): Promise<UserBookWithInclude[]> => {
        return this.database.findMany({
            where: filter,
            include: userBookInclude,
        });
    };

    findById = (id: string) => this.getById(id);

    override async getById(id: string): Promise<UserBookWithInclude | null> {
        return this.database.findFirst({
            where: { id },
            include: userBookInclude,
        });
    }

    override async create(userBookCreateInput: UserBookCreateInput): Promise<UserBookWithInclude> {
        return this.database.create({
            data: userBookCreateInput,
            include: userBookInclude,
        });
    }

    override async update(
        userBookId: string,
        userBookUpdateInput: UserBookUpdateInput,
    ): Promise<UserBookWithInclude> {
        return this.database.update({
            where: { id: userBookId },
            data: userBookUpdateInput,
            include: userBookInclude,
        });
    }
}
