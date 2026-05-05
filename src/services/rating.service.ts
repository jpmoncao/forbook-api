import RatingRepository from "@/repositories/rating.repository";
import { IQueryParams } from "@/shared/interfaces/query-param";
import { buildPaginationMeta } from "@/shared/repository";
import { IPaginated } from "@/shared/interfaces/paginated";
import { RatingInclude, RatingOrderByWithAggregationInput, RatingWhereInput } from "@/generated/prisma/models";
import { RatingWithInclude } from "@/types/Rating";
import { RatingCreateWithRatedByBody, RatingUpdateBody } from "@/schemas/rating.schema";
import { Rating } from "@/generated/prisma/client";
import type { RatingCreateInput, RatingUpdateInput } from "@/generated/prisma/models";
import { EStatusCode } from "@/errors/enums/status-code";
import { ERatingException } from "@/errors/enums/rating";
import { CustomError } from "@/errors/custom-error";

export default class RatingService {
    private readonly repository: RatingRepository;

    constructor() {
        this.repository = new RatingRepository();
    }

    getAllRatings = async (query: IQueryParams): Promise<IPaginated<RatingWithInclude>> => {
        const pagination = { page: query.page, limit: query.limit };
        const filter = query.filter as RatingWhereInput;
        const include = {
            RatedBy: true,
            RatedTo: true,
        } as RatingInclude;
        const orderBy = Object.entries(query.sort).map(([field, direction]) => ({
            [field]: direction,
        })) as RatingOrderByWithAggregationInput;

        const [ratings, total] = await Promise.all([
            this.repository.getAll({ where: filter, include, orderBy }, pagination) as Promise<RatingWithInclude[]>,
            this.repository.countWhere(filter),
        ]);

        return {
            data: ratings,
            meta: buildPaginationMeta(total, pagination),
        };
    }

    getRatingById = async (id: string): Promise<RatingWithInclude | null> => {
        const rating = await this.repository.getByIdWithInclude(id, {
            RatedBy: true,
            RatedTo: true,
        }) as RatingWithInclude;
        return rating;
    };

    createRating = async (ratingBody: RatingCreateWithRatedByBody): Promise<Rating> => {
        const ratingCreateInput: RatingCreateInput = {
            value: ratingBody.value,
            comment: ratingBody.comment,
            RatedBy: {
                connect: {
                    id: ratingBody.ratedById,
                },
            },
            RatedTo: {
                connect: {
                    id: ratingBody.ratedToId,
                },
            },
        };
        const newRating = await this.repository.create(ratingCreateInput);
        return newRating;
    };

    updateRating = async (id: string, userId: string, ratingBody: RatingUpdateBody): Promise<Rating> => {
        const rating = await this.repository.getById(id) as Rating;
        if (!rating) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                ERatingException.RATING_NOT_FOUND,
                "Avaliação não encontrada",
                [{ name: "id", reason: "O campo id é obrigatório" }],
            );
        }

        if (rating.ratedById !== userId) {
            throw new CustomError(
                EStatusCode.FORBIDDEN,
                ERatingException.RATING_UNAUTHORIZED,
                "Você não tem permissão para atualizar esta avaliação",
                [{ name: "userId", reason: "O usuário informado não é o autor da avaliação" }],
            );
        }

        const ratingUpdateInput: RatingUpdateInput = {
            ...(ratingBody.value !== undefined && { value: ratingBody.value }),
            ...(ratingBody.comment !== undefined && { comment: ratingBody.comment }),
        };

        const updatedRating = await this.repository.update(id, ratingUpdateInput);
        return updatedRating;
    };

    deleteRating = async (id: string, userId: string): Promise<void> => {
        const rating = await this.repository.getById(id) as Rating;
        if (!rating) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                ERatingException.RATING_NOT_FOUND,
                "Avaliação não encontrada",
                [{ name: "id", reason: "O campo id é obrigatório" }],
            );
        }

        if (rating.ratedById !== userId) {
            throw new CustomError(
                EStatusCode.FORBIDDEN,
                ERatingException.RATING_UNAUTHORIZED,
                "Você não tem permissão para deletar esta avaliação",
                [{ name: "userId", reason: "O usuário informado não é o autor da avaliação" }],
            );
        }

        await this.repository.delete(id);
    };
}
