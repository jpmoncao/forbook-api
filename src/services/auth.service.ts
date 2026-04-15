import { EStatusCode } from "@/errors/enums/status-code";
import { EUserException } from "@/errors/enums/user";
import UserRepository from "@/repositories/user.repository";
import LoginAttemptRepository from "@/repositories/loginAttempt.repository";
import { CustomError } from "@/errors/custom-error";
import Hash from "@/utils/hash";
import { LoginAttemptCreateInput } from "@/generated/prisma/models";
import MailService from "@/services/mail.service";
import { ELoginAttemptException } from "@/errors/enums/loginAttempt";
import Jwt from "@/utils/jwt";
import { ConfirmLoginBody, LoginBody } from "@/schemas/auth.schema";
import { UserLogin, UserTokens } from "@/types/User";
import VerifyEmailAttemptRepository from "@/repositories/verifyEmailAttempt.repository";

export default class AuthService {
    static readonly EXPIRATION_TIME = 1000 * 60 * 10; // 10 minutes

    private readonly userRepository: UserRepository;
    private readonly loginAttemptRepository: LoginAttemptRepository;
    private readonly verifyEmailAttemptRepository: VerifyEmailAttemptRepository;
    private readonly mailService: MailService;

    constructor() {
        this.userRepository = new UserRepository();
        this.loginAttemptRepository = new LoginAttemptRepository();
        this.verifyEmailAttemptRepository = new VerifyEmailAttemptRepository();
        this.mailService = new MailService();
    }

    login = async (body: LoginBody): Promise<UserLogin | UserTokens> => {
        const user = await this.userRepository.findByEmail(body.email);
        if (!user) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EUserException.USER_NOT_FOUND,
                "Usuário não encontrado com o email informado: " + body.email
            );
        }

        if (!user.isEmailVerified) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_EMAIL_NOT_VERIFIED,
                "Verifique seu e-mail, enviamos um código de verificação para você",
                [{ name: "email", reason: "O e-mail do usuário ainda não foi verificado" }]
            );
        }

        const isPasswordValid = await Hash.compare(body.password + (process.env.PEPPER_SECRET ?? ""), user.password);
        if (!isPasswordValid) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_INVALID_PASSWORD,
                "A senha informada não confere com a senha do usuário"
            );
        }

        if (user.isReceiveTwoFactorAuthEmail) {
            const code = Array.from({ length: 6 }, () => Math.random().toString(36)[2]).join('');

            const now = new Date();
            const expiresAt = new Date(now.getTime() + AuthService.EXPIRATION_TIME);

            const loginAttemptCreateInput: LoginAttemptCreateInput = {
                code,
                expiresAt,
                User: {
                    connect: {
                        id: user.id,
                    },
                },
            };

            const loginAttempt = await this.loginAttemptRepository.create(loginAttemptCreateInput);
            if (!loginAttempt) {
                throw new CustomError(
                    EStatusCode.INTERNAL_SERVER_ERROR,
                    ELoginAttemptException.LOGIN_ATTEMPT_CREATION_FAILED,
                    "Ocorreu um erro ao criar a tentativa de login"
                );
            }

            await this.mailService.sendLoginCode(user.email, user.name.split(" ")[0], code);

            return {
                userId: user.id,
                isEmailVerified: user.isEmailVerified,
                isReceiveTwoFactorAuthEmail: user.isReceiveTwoFactorAuthEmail,
            };
        }

        const accessToken = Jwt.generateAccessToken(user.id);
        const refreshToken = Jwt.generateRefreshToken(user.id);

        return {
            accessToken,
            refreshToken,
        };
    }

    confirmLogin = async (body: ConfirmLoginBody): Promise<{ accessToken: string, refreshToken: string }> => {
        const loginAttempt = await this.loginAttemptRepository.findByCode(body.code);
        if (!loginAttempt) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                ELoginAttemptException.LOGIN_ATTEMPT_NOT_FOUND,
                "Tentativa de login não encontrada com o código informado: " + body.code,
                [{ name: "code", reason: "O código de autentificação deve ser válido" }]
            );
        }

        if (loginAttempt.expiresAt.getTime() < new Date().getTime()) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                ELoginAttemptException.LOGIN_ATTEMPT_EXPIRED,
                "A tentativa de login expirou em: " + loginAttempt.expiresAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
                [{ name: "expiresAt", reason: "A tentativa de login deve ser renovada antes de expirar" }]
            );
        }

        if (loginAttempt.success) {
            throw new CustomError(
                EStatusCode.BAD_REQUEST,
                ELoginAttemptException.LOGIN_ATTEMPT_ALREADY_USED,
                "Tente novamente com um novo código de autentificação"
            );
        }

        const user = await this.userRepository.findById(loginAttempt.userId);
        if (!user || user.email !== body.email) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                ELoginAttemptException.LOGIN_ATTEMPT_INVALID_USER,
                "O código de autentificação informado não pertence ao usuário informado",
                [
                    { name: "email", reason: "O email do usuário deve ser o mesmo do código de autentificação" },
                    { name: "code", reason: "O código de autentificação deve pertencer ao usuário informado" }
                ]
            );
        }

        if (!user.isEmailVerified) {
            throw new CustomError(
                EStatusCode.UNAUTHORIZED,
                EUserException.USER_EMAIL_NOT_VERIFIED,
                "O e-mail do usuário não foi verificado, enviamos um código de verificação para você",
                [{ name: "email", reason: "O e-mail do usuário ainda não foi verificado" }]
            );
        }

        await this.loginAttemptRepository.update(loginAttempt.id, {
            success: true,
        });

        const accessToken = Jwt.generateAccessToken(user.id);
        const refreshToken = Jwt.generateRefreshToken(user.id);

        return {
            accessToken,
            refreshToken,
        };
    }

    verifyEmailCode = async (code: string): Promise<void> => {
        const verifyEmailAttempt = await this.verifyEmailAttemptRepository.findByCode(code);
        if (!verifyEmailAttempt) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EUserException.USER_VERIFY_EMAIL_CODE_NOT_FOUND,
                "Código de verificação não encontrado com o código informado: " + code,
                [{ name: "code", reason: "O código de verificação deve ser válido" }]
            );
        }

        if (verifyEmailAttempt.success) {
            throw new CustomError(
                EStatusCode.BAD_REQUEST,
                EUserException.USER_VERIFY_EMAIL_CODE_ALREADY_USED,
                "O código de verificação já foi usado",
                [{ name: "code", reason: "O código de verificação deve ser usado uma vez" }]
            );
        }

        await this.verifyEmailAttemptRepository.update(verifyEmailAttempt.id, {
            success: true,
            verifiedAt: new Date(),
        });

        const user = await this.userRepository.findById(verifyEmailAttempt.userId);
        if (!user) {
            throw new CustomError(
                EStatusCode.NOT_FOUND,
                EUserException.USER_NOT_FOUND,
                "Usuário não encontrado com o ID informado: " + verifyEmailAttempt.userId
            );
        }

        await this.userRepository.update(user.id, { isEmailVerified: true });

        return;
    }
}