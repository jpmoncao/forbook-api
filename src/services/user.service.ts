import type { UserCreateBody } from "@/schemas/user.schema";
import { UserCreateInput } from "@/generated/prisma/models"
import UserRepository from "@/repositories/user.repository";
import Hash from "@/utils/hash";
import { EUserException } from "@/errors/enums/user";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { UserPublic } from "@/types/User";

export default class UserService {
    private readonly repository: UserRepository;

    constructor() {
        this.repository = new UserRepository();
    }

    createUser = async (body: UserCreateBody): Promise<UserPublic> => {
        const existingUserEmail = await this.repository.findByEmail(body.email);
        if (existingUserEmail) {
            throw new CustomError(EUserException.USER_EMAIL_ALREADY_EXISTS, EStatusCode.CONFLICT);
        }

        const existingUserCpf = await this.repository.findByCpf(body.cpf);
        if (existingUserCpf) {
            throw new CustomError(EUserException.USER_CPF_ALREADY_EXISTS, EStatusCode.CONFLICT);
        }

        const existingUserPhoneNumber = await this.repository.findByPhoneNumber(body.phoneNumber);
        if (existingUserPhoneNumber) {
            throw new CustomError(EUserException.USER_PHONE_NUMBER_ALREADY_EXISTS, EStatusCode.CONFLICT);
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

        const user = await this.repository.create(userCreateInput) as UserPublic;
        return user;
    }
}
