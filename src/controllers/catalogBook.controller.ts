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
            throw new CustomError(
                EStatusCode.BAD_REQUEST,
                ECatalogBookException.CATALOG_BOOK_ISBN_NOT_FOUND,
                "Algum campo obrigatório não foi informado",
                [{ name: "isbn", reason: "O campo ISBN é obrigatório" }]
            );
        }

        const catalogBook = await this.service.getCatalogBook(isbn);
        if (!catalogBook) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                ECatalogBookException.CATALOG_BOOK_ISBN_NOT_FOUND,
                "Nenhum livro encontrado com o ISBN informado"
            );
        }

        res.status(200).json({
            message: "Catalog Book encontrado",
            data: catalogBook
        });
    }

    updateCatalogBook = async (req: Request, res: Response) => {
        const isbn = (req.params.isbn as string).trim();
        if (!isbn) {
            throw new CustomError(
                EStatusCode.BAD_REQUEST,
                ECatalogBookException.CATALOG_BOOK_ISBN_NOT_FOUND,
                "Algum campo obrigatório não foi informado",
                [{ name: "isbn", reason: "O campo ISBN é obrigatório" }]
            );
        }

        const catalogBookUpdateDTO = req.body as CatalogBookUpdateBody;

        const catalogBook = await this.service.updateCatalogBook(isbn, catalogBookUpdateDTO);
        if (!catalogBook) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                ECatalogBookException.CATALOG_BOOK_ISBN_NOT_FOUND,
                "Nenhum livro encontrado com o ISBN informado"
            );
        }

        res.status(200).json({
            message: "CatalogBook alterado com sucesso",
            data: catalogBook
        });
    }
}   
