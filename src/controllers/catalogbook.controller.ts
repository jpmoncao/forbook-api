import { CustomError } from "@/errors/custom-error";
import { ECatalogBookException } from "@/errors/enums/catalogBook";
import { EStatusCode } from "@/errors/enums/status-code";
import { CatalogBookCreateBody, CatalogBookUpdateBody } from "@/schemas/catalogBook.schema";
import CatalogBookService from "@/services/catalogBook.service";
import { Request, Response } from "express";

export default class CatalogBookController {
    private readonly service: CatalogBookService;

    constructor() {
        this.service = new CatalogBookService();
    }

    createCatalogBook = async (req: Request, res: Response) => {
        const CatalogBookCreateDTO = req.body as CatalogBookCreateBody;

        const catalogBook = await this.service.createCatalogBook(CatalogBookCreateDTO);

        res.status(201).json({
            message: "Catalog Book criado com sucesso!",
            data: catalogBook
        });
    }

    getCatalogBook = async (req: Request, res: Response) => {
        const isbn = (req.params.isbn as string).trim();
        if (!isbn) {
            throw new CustomError(ECatalogBookException.CATALOG_BOOK_ISBN_NOT_FOUND, EStatusCode.NOT_FOUND);
        }

        const catalogBook = await this.service.getCatalogBook(isbn);

        res.status(200).json({
            message: "Catalog Book encontrado",
            data: catalogBook
        });
    }

    updateCatalogBook = async (req: Request, res: Response) => {
        const isbn = (req.params.isbn as string).trim();
        if (!isbn) {
            throw new CustomError(ECatalogBookException.CATALOG_BOOK_UNAUTHRORIZED, EStatusCode.UNAUTHORIZED);
        }

        const catalogBookUpdateDTO = req.body as CatalogBookUpdateBody;

        const catalogBook = await this.service.updateCatalogBook(isbn, catalogBookUpdateDTO);

        res.status(200).json({
            message: "CatalogBook alterado com sucesso",
            data: catalogBook
        });
    }
}
