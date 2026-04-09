import { CustomError } from "@/errors/custom-error";
import { ECatalogBookException } from "@/errors/enums/catalogBook";
import { EStatusCode } from "@/errors/enums/status-code";
import { CatalogBook } from "@/generated/prisma/browser";
import { CatalogBookCreateInput, CatalogBookUpdateInput  } from "@/generated/prisma/models";
import CatalogBookRepository from "@/repositories/catalogbook.repository";
import { CatalogBookCreateBody, CatalogBookUpdateBody } from "@/schemas/catalogbook.schema";

export default class CatalogBookService {
    private readonly repository: CatalogBookRepository;

    constructor(){
        this.repository = new CatalogBookRepository();
    }

    createCatalogBook = async (body: CatalogBookCreateBody): Promise<CatalogBook> => {
        const existingCatalogBookIsbn = await this.repository.findByIsbn(body.isbn);
        if(existingCatalogBookIsbn) {
            throw new CustomError(ECatalogBookException.CATALOG_BOOK_ISBN_ALREADY_EXISTS, EStatusCode.CONFLICT);
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

    getCatalogBook = async(isbn: string): Promise<CatalogBook> => {
        const catalogBook = await this.repository.findByIsbn(isbn);
        if(!catalogBook){
            throw new CustomError(ECatalogBookException.CATALOG_BOOK_ISBN_NOT_FOUND, EStatusCode.NOT_FOUND);
        }
        return catalogBook
    }

    updateCatalogBook = async(isbn: string, body: CatalogBookUpdateBody): Promise<CatalogBook> => {
        const catalogBook = await this.repository.findByIsbn(isbn);
        if(!catalogBook) {
            throw new CustomError(ECatalogBookException.CATALOG_BOOK_NOT_FOUND, EStatusCode.NOT_FOUND);
        }

        const catalogBookUpdateInput: CatalogBookUpdateInput = {
            ...(body.description !== undefined && {description: body.description}),

        }
        const updatedCatalogBook = await this.repository.update(isbn, catalogBookUpdateInput);
        return updatedCatalogBook;
    }

    
}