import { IAddressCreateDTO } from "./adress";

export interface IUserCreateDTO {
    email: string;
    password: string;
    name: string;
    phoneNumber: string;
    cpf: string;
    birthDate: Date;
    address: IAddressCreateDTO;
}