export interface ILoginDTO {
    email: string;
    password: string;
}

export interface IConfirmLoginDTO {
    email: string;
    code: string;
}

export interface IForgotPasswordDTO {
    email: string;
}

export interface IResetPasswordDTO {
    email: string;
    code: string;
    password: string;
}

export interface IRefreshTokenDTO {
    refreshToken: string;
}