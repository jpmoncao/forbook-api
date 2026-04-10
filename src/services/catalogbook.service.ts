import { CustomError } from "@/errors/custom-error";
import { ECatalogBookException } from "@/errors/enums/catalogBook";
import { EStatusCode } from "@/errors/enums/status-code";
import { CatalogBook } from "@/generated/prisma/browser";
import { CatalogBookCreateInput, CatalogBookUpdateInput } from "@/generated/prisma/models";
import CatalogBookRepository from "@/repositories/catalogBook.repository";
import { CatalogBookCreateBody, CatalogBookUpdateBody } from "@/schemas/catalogBook.schema"

export default class CatalogBookService {
    private readonly repository: CatalogBookRepository;

    constructor() {
        this.repository = new CatalogBookRepository();
    }

    createCatalogBook = async (body: CatalogBookCreateBody): Promise<CatalogBook> => {
        const existingCatalogBookIsbn = await this.repository.findByIsbn(body.isbn);
        if (existingCatalogBookIsbn) {
            throw new CustomError(
                EStatusCode.CONFLICT,
                ECatalogBookException.CATALOG_BOOK_ISBN_ALREADY_EXISTS,
                "O código ISBN já foi informado: " + body.isbn,
                [{ name: "isbn", reason: "O ISBN deve ser único" }]
            );
        }

        const catalogBookCreateInput: CatalogBookCreateInput = {
            isbn: body.isbn,
            title: body.title,
            author: body.author,
            description: body.description,
            year: body.year,
            publisher: body.publisher,
        }

        const catalogBook = await this.repository.create(catalogBookCreateInput);
        return catalogBook
    }

    getCatalogBook = async (isbn: string): Promise<CatalogBook> => {
        const catalogBook = await this.repository.findByIsbn(isbn);
        if (!catalogBook) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                ECatalogBookException.CATALOG_BOOK_ISBN_NOT_FOUND,
                "O código ISBN não foi encontrado: " + isbn,
                [{ name: "isbn", reason: "O ISBN deve ser válido para buscar um livro" }]
            );
        }
        return catalogBook
    }

    updateCatalogBook = async (isbn: string, body: CatalogBookUpdateBody): Promise<CatalogBook> => {
        const catalogBook = await this.repository.findByIsbn(isbn);
        if (!catalogBook) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                ECatalogBookException.CATALOG_BOOK_NOT_FOUND,
                "Livro não encontrado com o código ISBN informado: " + isbn,
                [{ name: "isbn", reason: "O ISBN deve ser válido para atualizar um livro" }]
            );
        }

        const catalogBookUpdateInput: CatalogBookUpdateInput = {
            ...(body.description !== undefined && { description: body.description }),

        }
        const updatedCatalogBook = await this.repository.update(isbn, catalogBookUpdateInput);
        return updatedCatalogBook;
    }


}