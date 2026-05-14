import type { UserCreateBody, UserUpdateBody } from "@/schemas/user.schema";
import { UserCreateInput, UserUpdateInput, UserWhereInput } from "@/generated/prisma/models"
import UserRepository from "@/repositories/user.repository";
import Hash from "@/utils/hash";
import { EUserException } from "@/errors/enums/user";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { toUserPublic, toUserPublicWithInclude, UserPublic, UserPublicWithInclude } from "@/types/User";
import MailService from "@/services/mail.service";
import VerifyEmailAttemptRepository from "@/repositories/verifyEmailAttempt.repository";
import { User, Wishlist } from "@/generated/prisma/client";
import { IPaginated } from "@/shared/interfaces/paginated";
import { IQueryParams } from "@/shared/interfaces/query-param";
import { buildPaginationMeta } from "@/shared/repository";
import WishlistRepository from "@/repositories/wishlist.repository";
import { EWishlistException } from "@/errors/enums/wishlist";
import { WishlistWithInclude } from "@/types/Wishlist";
import CatalogBookRepository from "@/repositories/catalogBook.repository";
import { ECatalogBookException } from "@/errors/enums/catalogBook";

export default class UserService {
    private readonly repository: UserRepository;
    private readonly verifyEmailAttemptRepository: VerifyEmailAttemptRepository;
    private readonly mailService: MailService;
    private readonly wishlistRepository: WishlistRepository;
    private readonly catalogBookRepository: CatalogBookRepository;

    constructor() {
        this.repository = new UserRepository();
        this.verifyEmailAttemptRepository = new VerifyEmailAttemptRepository();
        this.mailService = new MailService();
        this.wishlistRepository = new WishlistRepository();
        this.catalogBookRepository = new CatalogBookRepository();
    }

    createUser = async (body: UserCreateBody): Promise<UserPublic> => {
        const existingUserEmail = await this.repository.findByEmail(body.email);
        if (existingUserEmail) {
            throw new CustomError(
                EStatusCode.CONFLICT,
                EUserException.USER_EMAIL_ALREADY_EXISTS,
                "O email informado já está em uso: " + body.email,
                [{ name: "email", reason: "O email deve ser único" }]
            );
        }

        const existingUserCpf = await this.repository.findByCpf(body.cpf);
        if (existingUserCpf) {
            throw new CustomError(
                EStatusCode.CONFLICT,
                EUserException.USER_CPF_ALREADY_EXISTS,
                "O CPF informado já está em uso: " + body.cpf,
                [{ name: "cpf", reason: "O CPF deve ser único" }]
            );
        }

        const existingUserPhoneNumber = await this.repository.findByPhoneNumber(body.phoneNumber);
        if (existingUserPhoneNumber) {
            throw new CustomError(
                EStatusCode.CONFLICT,
                EUserException.USER_PHONE_NUMBER_ALREADY_EXISTS,
                "O número de telefone informado já está em uso: " + body.phoneNumber,
                [{ name: "phoneNumber", reason: "O número de telefone deve ser único" }]
            );
        }

        const password = await Hash.hash(body.password + (process.env.PEPPER_SECRET ?? ""));

        const userCreateInput: UserCreateInput = {
            email: body.email,
            password,
            name: body.name,
            phoneNumber: body.phoneNumber,
            cpf: body.cpf,
            birthDate: body.birthDate,
            Address: {
                create: {
                    street: body.address.street,
                    number: body.address.number,
                    complement: body.address.complement || "",
                    neighborhood: body.address.neighborhood,
                    city: body.address.city,
                    state: body.address.state,
                    zipCode: body.address.zipCode,
                }
            }
        }

        const user = await this.repository.create(userCreateInput);

        const code = Array.from({ length: 6 }, () => Math.random().toString(36)[2]).join('');
        const verifyEmailAttempt = await this.verifyEmailAttemptRepository.create({
            code,
            User: {
                connect: {
                    id: user.id,
                },
            },
        });
        if (!verifyEmailAttempt) {
            throw new CustomError(
                EStatusCode.INTERNAL_SERVER_ERROR,
                EUserException.USER_VERIFY_EMAIL_CODE_NOT_FOUND,
                "Erro ao criar código de verificação",
                [{ name: "code", reason: "O código de verificação deve ser criado" }]
            );
        }

        await this.mailService.verifyEmail(user.email, code);

        return toUserPublic(user);
    }

    getMe = async (userId: string): Promise<UserPublicWithInclude> => {
        const user = await this.repository.findByIdWithInclude(userId, { ProfileImage: true, Ratings: true });
        if (!user) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EUserException.USER_NOT_FOUND,
                "Usuário não encontrado com o ID informado: " + userId,
                [{ name: "userId", reason: "O ID do usuário deve ser válido" }]
            );
        }

        return toUserPublicWithInclude(user);
    }

    getUserById = async (userId: string): Promise<UserPublicWithInclude> => {
        const user = await this.repository.findByIdWithInclude(userId, { ProfileImage: true, Ratings: true });
        if (!user) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EUserException.USER_NOT_FOUND,
                "Usuário não encontrado com o ID informado: " + userId,
                [{ name: "userId", reason: "O ID do usuário deve ser válido" }]
            );
        }

        return toUserPublicWithInclude(user);
    }

    updateUser = async (userId: string, body: UserUpdateBody): Promise<UserPublicWithInclude> => {
        const user = await this.repository.findById(userId);
        if (!user) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EUserException.USER_NOT_FOUND,
                "Usuário não encontrado com o ID informado: " + userId,
                [{ name: "userId", reason: "O ID do usuário deve ser válido" }]
            );
        }

        const userUpdateInput: UserUpdateInput = {
            ...(body.name !== undefined && { name: body.name }),
            ...(body.isReceiveTwoFactorAuthEmail !== undefined && { isReceiveTwoFactorAuthEmail: body.isReceiveTwoFactorAuthEmail }),
            ...(body.profileImageId !== undefined && {
                ProfileImage: {
                    connect: {
                        id: body.profileImageId,
                    },
                },
            }),
        }

        const updatedUser = await this.repository.update(userId, userUpdateInput);
        return toUserPublicWithInclude(updatedUser);
    }

    getAllUsers = async (query: IQueryParams): Promise<IPaginated<UserPublic>> => {
        const pagination = { page: query.page, limit: query.limit };
        const filter = query.filter as UserWhereInput;

        const [users, total] = await Promise.all([
            this.repository.getAll(filter, pagination) as Promise<User[]>,
            this.repository.countWhere(filter),
        ]);

        return {
            data: users.map(user => toUserPublic(user)),
            meta: buildPaginationMeta(total, pagination),
        };
    }

    getUserWishlist = async (userId: string): Promise<WishlistWithInclude> => {
        const wishlist = await this.wishlistRepository.findByUserId(userId);
        if (!wishlist) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EWishlistException.WISHLIST_NOT_FOUND,
                "Lista de desejos não encontrada para o usuário: " + userId,
            );
        }

        return wishlist;
    }

    addBookToWishlist = async (userId: string, bookId: string): Promise<WishlistWithInclude> => {
        const wishlist = await this.wishlistRepository.findByUserId(userId);
        if (!wishlist) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EWishlistException.WISHLIST_NOT_FOUND,
                "Lista de desejos não encontrada para o usuário: " + userId,
            );
        }

        const book = await this.catalogBookRepository.findById(bookId);
        if (!book) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                ECatalogBookException.CATALOG_BOOK_NOT_FOUND,
                "Livro não encontrado com o ID informado: " + bookId,
            );
        }

        const isBookInWishlist = wishlist.CatalogBooks.some(b => b.id === bookId);
        if (isBookInWishlist) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EWishlistException.WISHLIST_BOOK_ALREADY_IN_WISHLIST,
                "Livro já está na lista de desejos para o usuário: " + userId,
                [{ name: "bookId", reason: `O livro \"${book.title}\" já está na lista de desejos para o usuário ${userId}` }]
            );
        }

        await this.wishlistRepository.update(wishlist.id, {
            CatalogBooks: {
                connect: {
                    id: bookId,
                },
            },
        });

        const updatedWishlist = await this.wishlistRepository.findByUserId(userId);
        if (!updatedWishlist) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EWishlistException.WISHLIST_NOT_FOUND,
                "Lista de desejos não encontrada para o usuário: " + userId,
            );
        }

        return updatedWishlist;
    }

    removeBookFromWishlist = async (userId: string, bookId: string): Promise<WishlistWithInclude> => {
        const wishlist = await this.wishlistRepository.findByUserId(userId);
        if (!wishlist) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EWishlistException.WISHLIST_NOT_FOUND,
                "Lista de desejos não encontrada para o usuário: " + userId,
            );
        }

        const book = await this.catalogBookRepository.findById(bookId);
        if (!book) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                ECatalogBookException.CATALOG_BOOK_NOT_FOUND,
                "Livro não encontrado com o ID informado: " + bookId,
            );
        }

        const isBookInWishlist = wishlist.CatalogBooks.some(b => b.id === bookId);
        if (!isBookInWishlist) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EWishlistException.WISHLIST_BOOK_NOT_FOUND,
                "Livro não encontrado na lista de desejos para o usuário: " + userId,
                [{ name: "bookId", reason: `O livro \"${book.title}\" não está na lista de desejos para o usuário ${userId}` }]
            );
        }

        await this.wishlistRepository.update(wishlist.id, {
            CatalogBooks: {
                disconnect: {
                    id: bookId,
                },
            },
        });

        const updatedWishlist = await this.wishlistRepository.findByUserId(userId);
        if (!updatedWishlist) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EWishlistException.WISHLIST_NOT_FOUND,
                "Lista de desejos não encontrada para o usuário: " + userId,
            );
        }

        return updatedWishlist;
    }
}
