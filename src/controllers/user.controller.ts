import { Request, Response } from "express";
import UserService from "@/services/user.service";
import type { UserCreateBody, UserUpdateBody } from "@/schemas/user.schema";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { EUserException } from "@/errors/enums/user";
import parseQueryParams from "@/utils/query-param";
import { AddressCreateBody, AddressUpdateBody } from "@/schemas/address.schema";

export default class UserController {
    private readonly service: UserService;

    constructor() {
        this.service = new UserService();
    }

    createUser = async (req: Request, res: Response) => {
        const userCreateDTO = req.body as UserCreateBody;

        const user = await this.service.createUser(userCreateDTO);

        res.status(201).json({
            message: "Usuário criado com sucesso",
            data: user
        });
    }

    getUserMe = async (req: Request, res: Response) => {
        const userId = req.userId;
        if (!userId) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_UNAUTHORIZED,
                "Esse usuário não está autenticado",
                [{ name: "userId", reason: "O campo userId é obrigatório" }]
            );
        }

        const user = await this.service.getMe(userId);

        res.status(200).json({
            message: "Usuário encontrado com sucesso",
            data: user,
        });
    }

    getUserById = async (req: Request, res: Response) => {
        const userId = req.params.id as string;

        const user = await this.service.getUserById(userId);

        res.status(200).json({
            message: "Usuário encontrado com sucesso",
            data: user,
        });
    }

    updateUser = async (req: Request, res: Response) => {
        const userId = req.userId;
        if (!userId) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_UNAUTHORIZED,
                "Esse usuário não está autenticado",
                [{ name: "userId", reason: "O campo userId é obrigatório" }]
            );
        }

        const userUpdateDTO = req.body as UserUpdateBody;

        const user = await this.service.updateUser(userId, userUpdateDTO);

        res.status(200).json({
            message: "Usuário atualizado com sucesso",
            data: user,
        });
    }

    getAllUsers = async (req: Request, res: Response) => {
        const queryParams = parseQueryParams(req.query);

        const { data: users, meta } = await this.service.getAllUsers(queryParams);

        res.status(200).json({
            message: "Usuários listados com sucesso",
            data: users,
            meta,
        });
    }

    getUserWishlist = async (req: Request, res: Response) => {
        const userId = req.params.id as string;

        const wishlist = await this.service.getUserWishlist(userId);

        res.status(200).json({
            message: "Lista de desejos do usuário encontrado com sucesso",
            data: wishlist,
        });
    }

    addBookToWishlist = async (req: Request, res: Response) => {
        const currentUserId = req.userId;
        const userId = req.params.id as string;
        const bookId = req.params.bookId as string;

        if (userId !== currentUserId) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_UNAUTHORIZED,
                "Você não tem permissão para adicionar livros à lista de desejos de outro usuário",
                [{ name: "userId", reason: "Você não tem permissão para adicionar livros à lista de desejos de outro usuário" }]
            );
        }

        const wishlist = await this.service.addBookToWishlist(userId, bookId);

        res.status(200).json({
            message: "Livro adicionado à lista de desejos com sucesso",
            data: wishlist,
        });
    }

    removeBookFromWishlist = async (req: Request, res: Response) => {
        const currentUserId = req.userId;
        const userId = req.params.id as string;
        const bookId = req.params.bookId as string;

        if (userId !== currentUserId) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_UNAUTHORIZED,
                "Você não tem permissão para remover livros da lista de desejos de outro usuário",
                [{ name: "userId", reason: "Você não tem permissão para remover livros da lista de desejos de outro usuário" }]
            );
        }

        const wishlist = await this.service.removeBookFromWishlist(userId, bookId);

        res.status(200).json({
            message: "Livro removido da lista de desejos com sucesso",
            data: wishlist,
        });
    }

    createAddress = async (req: Request, res: Response) => {
        const currentUserId = req.userId;
        const userId = req.params.id as string;
        const addressCreateDTO = req.body as AddressCreateBody;

        if (userId !== currentUserId) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_UNAUTHORIZED,
                "Você não tem permissão para criar endereços para outro usuário",
                [{ name: "userId", reason: "Você não tem permissão para criar endereços para outro usuário" }]
            );
        }

        const address = await this.service.createAddress(userId, addressCreateDTO);

        res.status(200).json({
            message: "Endereço criado com sucesso",
            data: address,
        });
    }

    setDefaultAddress = async (req: Request, res: Response) => {
        const currentUserId = req.userId;
        const userId = req.params.id as string;
        const addressId = req.params.addressId as string;

        if (userId !== currentUserId) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_UNAUTHORIZED,
                "Você não tem permissão para alterar o endereço padrão de outro usuário",
                [{ name: "userId", reason: "Você não tem permissão para alterar o endereço padrão de outro usuário" }]
            );
        }

        const address = await this.service.setDefaultAddress(userId, addressId);

        res.status(200).json({
            message: "Endereço padrão atualizado com sucesso",
            data: address,
        });
    }

    updateAddress = async (req: Request, res: Response) => {
        const currentUserId = req.userId;
        const userId = req.params.id as string;
        const addressId = req.params.addressId as string;
        const addressUpdateDTO = req.body as AddressUpdateBody;

        if (userId !== currentUserId) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_UNAUTHORIZED,
                "Você não tem permissão para alterar endereços de outro usuário",
                [{ name: "userId", reason: "Você não tem permissão para alterar endereços de outro usuário" }]
            );
        }

        const address = await this.service.updateAddress(userId, addressId, addressUpdateDTO);

        res.status(200).json({
            message: "Endereço atualizado com sucesso",
            data: address,
        });
    }

    deleteAddress = async (req: Request, res: Response) => {
        const currentUserId = req.userId;
        const userId = req.params.id as string;
        const addressId = req.params.addressId as string;

        if (userId !== currentUserId) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_UNAUTHORIZED,
                "Você não tem permissão para remover endereços de outro usuário",
                [{ name: "userId", reason: "Você não tem permissão para remover endereços de outro usuário" }]
            );
        }

        await this.service.deleteAddress(userId, addressId);

        res.status(200).json({
            message: "Endereço removido com sucesso",
        });
    }
}
