import type { UserBookCreateInput, UserBookUpdateInput, UserBookWhereInput } from "@/generated/prisma/models";
import AbstractRepository, { type RepositoryPagination } from "@/shared/repository";
import { userBookQueryArgs, type UserBookPayload } from "@/types/UserBook";

export default class UserBookRepository extends AbstractRepository<
    "userBook",
    UserBookPayload,
    UserBookCreateInput,
    UserBookUpdateInput
> {
    protected readonly modelKey = "userBook" as const;

    override getAll = async (
        filter: UserBookWhereInput,
        pagination?: RepositoryPagination,
    ): Promise<UserBookPayload[]> => {
        return super.getAll(
            {
                where: filter,
                ...userBookQueryArgs,
            },
            pagination,
        );
    };

    override async getById(id: string): Promise<UserBookPayload | null> {
        return this.database.findFirst({
            where: { id },
            ...userBookQueryArgs,
        });
    }

    override async create(userBookCreateInput: UserBookCreateInput): Promise<UserBookPayload> {
        return this.database.create({
            data: userBookCreateInput,
            ...userBookQueryArgs,
        });
    }

    override async update(
        userBookId: string,
        userBookUpdateInput: UserBookUpdateInput,
    ): Promise<UserBookPayload> {
        return this.database.update({
            where: { id: userBookId },
            data: userBookUpdateInput,
            ...userBookQueryArgs,
        });
    }
}
