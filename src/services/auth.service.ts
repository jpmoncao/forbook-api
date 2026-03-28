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

export default class AuthService {
    static readonly EXPIRATION_TIME = 1000 * 60 * 10; // 10 minutes

    private readonly userRepository: UserRepository;
    private readonly loginAttemptRepository: LoginAttemptRepository;
    private readonly mailService: MailService;

    constructor() {
        this.userRepository = new UserRepository();
        this.loginAttemptRepository = new LoginAttemptRepository();
        this.mailService = new MailService();
    }

    login = async (email: string, password: string): Promise<void> => {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new CustomError(EUserException.USER_NOT_FOUND, EStatusCode.NOT_FOUND);
        }

        const isPasswordValid = await Hash.compare(password + (process.env.PEPPER_SECRET ?? ""), user.password);
        if (!isPasswordValid) {
            throw new CustomError(EUserException.USER_INVALID_PASSWORD, EStatusCode.UNAUTHORIZED);
        }

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

        await this.loginAttemptRepository.create(loginAttemptCreateInput);

        await this.mailService.sendLoginCode(user.email, code);

        return;
    }

    confirmLogin = async (email: string, code: string): Promise<{ accessToken: string, refreshToken: string }> => {
        const loginAttempt = await this.loginAttemptRepository.findByCode(code);
        if (!loginAttempt) {
            throw new CustomError(ELoginAttemptException.LOGIN_ATTEMPT_NOT_FOUND, EStatusCode.NOT_FOUND);
        }

        if (loginAttempt.expiresAt.getTime() < new Date().getTime()) {
            throw new CustomError(ELoginAttemptException.LOGIN_ATTEMPT_EXPIRED, EStatusCode.UNAUTHORIZED);
        }

        if (loginAttempt.success) {
            throw new CustomError(ELoginAttemptException.LOGIN_ATTEMPT_ALREADY_USED, EStatusCode.BAD_REQUEST);
        }

        const user = await this.userRepository.findById(loginAttempt.userId);
        if (!user || user.email !== email) {
            throw new CustomError(ELoginAttemptException.LOGIN_ATTEMPT_INVALID_USER, EStatusCode.UNAUTHORIZED);
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
}