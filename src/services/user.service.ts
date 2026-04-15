import type { UserCreateBody, UserUpdateBody } from "@/schemas/user.schema";
import { UserCreateInput, UserUpdateInput } from "@/generated/prisma/models"
import UserRepository from "@/repositories/user.repository";
import Hash from "@/utils/hash";
import { EUserException } from "@/errors/enums/user";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { toUserPublic, toUserPublicWithInclude, UserPublic, UserPublicWithInclude } from "@/types/User";
import MailService from "@/services/mail.service";
import VerifyEmailAttemptRepository from "@/repositories/verifyEmailAttempt.repository";

export default class UserService {
    private readonly repository: UserRepository;
    private readonly verifyEmailAttemptRepository: VerifyEmailAttemptRepository;
    private readonly mailService: MailService;

    constructor() {
        this.repository = new UserRepository();
        this.verifyEmailAttemptRepository = new VerifyEmailAttemptRepository();
        this.mailService = new MailService();
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
        const user = await this.repository.findByIdWithInclude(userId, { ProfileImage: true });
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
}
