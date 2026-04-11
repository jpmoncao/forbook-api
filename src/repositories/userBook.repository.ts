import type { UserBookCreateInput, UserBookUpdateInput, UserBookWhereInput } from "@/generated/prisma/models";
import AbstractRepository, { type RepositoryPagination } from "@/shared/repository";
import { userBookQueryArgs, type UserBookWithInclude } from "@/types/UserBook";

export default class UserBookRepository extends AbstractRepository<
    "userBook",
    UserBookWithInclude,
    UserBookCreateInput,
    UserBookUpdateInput
> {
    protected readonly modelKey = "userBook" as const;

    override getAll = async (
        filter: UserBookWhereInput,
        pagination?: RepositoryPagination,
    ): Promise<UserBookWithInclude[]> => {
        return super.getAll(
            {
                where: filter,
                ...userBookQueryArgs,
            },
            pagination,
        );
    };

    override async getById(id: string): Promise<UserBookWithInclude | null> {
        return this.database.findFirst({
            where: { id },
            ...userBookQueryArgs,
        });
    }

    override async create(userBookCreateInput: UserBookCreateInput): Promise<UserBookWithInclude> {
        return this.database.create({
            data: userBookCreateInput,
            ...userBookQueryArgs,
        });
    }

    override async update(
        userBookId: string,
        userBookUpdateInput: UserBookUpdateInput,
    ): Promise<UserBookWithInclude> {
        return this.database.update({
            where: { id: userBookId },
            data: userBookUpdateInput,
            ...userBookQueryArgs,
        });
    }
}
