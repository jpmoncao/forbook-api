import { IUserCreateDTO } from "@/interfaces/user";
import { UserCreateInput } from "@/generated/prisma/models"
import UserRepository from "@/repositories/user.repository";
import { EUserException } from "@/errors/enums/user";
import { CustomError } from "@/errors/custom-error";
import { EStatusCode } from "@/errors/enums/status-code";
import { User } from "@/generated/prisma/client";

export default class UserService {
    private readonly repository: UserRepository;

    constructor() {
        this.repository = new UserRepository();
    }

    createUser = async (userCreateDTO: IUserCreateDTO): Promise<User> => {
        const existingUserEmail = await this.repository.findByEmail(userCreateDTO.email);
        if (existingUserEmail) {
            throw new CustomError(EUserException.USER_EMAIL_ALREADY_EXISTS, EStatusCode.CONFLICT);
        }

        const existingUserCpf = await this.repository.findByCpf(userCreateDTO.cpf);
        if (existingUserCpf) {
            throw new CustomError(EUserException.USER_CPF_ALREADY_EXISTS, EStatusCode.CONFLICT);
        }

        const existingUserPhoneNumber = await this.repository.findByPhoneNumber(userCreateDTO.phoneNumber);
        if (existingUserPhoneNumber) {
            throw new CustomError(EUserException.USER_PHONE_NUMBER_ALREADY_EXISTS, EStatusCode.CONFLICT);
        }

        const userCreateInput: UserCreateInput = {
            email: userCreateDTO.email,
            password: userCreateDTO.password,
            name: userCreateDTO.name,
            phoneNumber: userCreateDTO.phoneNumber,
            cpf: userCreateDTO.cpf,
            birthDate: userCreateDTO.birthDate,
            Address: {
                create: {
                    street: userCreateDTO.address.street,
                    number: userCreateDTO.address.number,
                    complement: userCreateDTO.address.complement,
                    neighborhood: userCreateDTO.address.neighborhood,
                    city: userCreateDTO.address.city,
                    state: userCreateDTO.address.state,
                    zipCode: userCreateDTO.address.zipCode,
                }
            }
        }

        const user = await this.repository.create(userCreateInput);
        return user;
    }
}
