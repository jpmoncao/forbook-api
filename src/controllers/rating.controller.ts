import { Request, Response } from "express";
import RatingService from "@/services/rating.service";
import type { RatingCreateBody, RatingCreateWithRatedByBody, RatingUpdateBody } from "@/schemas/rating.schema";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { ERatingException } from "@/errors/enums/rating";
import parseQueryParams from "@/utils/query-param";

export default class RatingController {
    private readonly service: RatingService;

    constructor() {
        this.service = new RatingService();
    }

    getRatingsByUserId = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        if (!userId) {
            throw new CustomError(
                EStatusCode.BAD_REQUEST,
                ERatingException.RATING_NOT_FOUND,
                "O id do usuário não foi informado",
                [{ name: "userId", reason: "O campo userId é obrigatório" }]
            );
        }

        const queryParams = parseQueryParams(req.query);
        queryParams.filter = {
            ...queryParams.filter,
            ratedToId: {
                equals: userId
            },
        }
        queryParams.sort = { createdAt: "desc" };

        const { data, meta } = await this.service.getAllRatings(queryParams);

        res.status(200).json({
            message: "Avaliações do usuário obtidas com sucesso",
            data,
            meta
        });
    }

    getRatingById = async (req: Request, res: Response) => {
        const ratingId = req.params.id as string;
        if (!ratingId) {
            throw new CustomError(
                EStatusCode.BAD_REQUEST,
                ERatingException.RATING_NOT_FOUND,
                "O id da avaliação não foi informado",
                [{ name: "id", reason: "O campo id é obrigatório" }]
            );
        }

        const rating = await this.service.getRatingById(ratingId);

        res.status(200).json({
            message: "Avaliação obtida com sucesso",
            data: rating,
        });
    }

    createRating = async (req: Request, res: Response) => {
        const userId = req.userId as string;
        const ratingCreateDTO = req.body as RatingCreateWithRatedByBody;
        ratingCreateDTO.ratedById = userId;

        const rating = await this.service.createRating(ratingCreateDTO);

        res.status(201).json({
            message: "Usuário criado com sucesso",
            data: rating
        });
    }

    updateRating = async (req: Request, res: Response) => {
        const userId = req.userId as string;

        const ratingId = req.params.id as string;
        if (!ratingId) {
            throw new CustomError(
                EStatusCode.BAD_REQUEST,
                ERatingException.RATING_NOT_FOUND,
                "O id da avaliação não foi informado",
                [{ name: "id", reason: "O campo id é obrigatório" }]
            );
        }

        const ratingUpdateDTO = req.body as RatingUpdateBody;

        const rating = await this.service.updateRating(ratingId, userId, ratingUpdateDTO);

        res.status(200).json({
            message: "Avaliação atualizada com sucesso",
            data: rating
        });
    }

    deleteRating = async (req: Request, res: Response) => {
        const userId = req.userId as string;

        const ratingId = req.params.id as string;
        if (!ratingId) {
            throw new CustomError(
                EStatusCode.BAD_REQUEST,
                ERatingException.RATING_NOT_FOUND,
                "O id da avaliação não foi informado",
                [{ name: "id", reason: "O campo id é obrigatório" }]
            );
        }

        await this.service.deleteRating(ratingId, userId);

        res.status(200).json({
            message: "Avaliação deletada com sucesso",
        });
    }
}
