export enum EAuthException {
    AUTH_UNAUTHORIZED = "Autenticação não autorizada",
    AUTH_INVALID_TOKEN = "Token de autenticação inválido",
    AUTH_EXPIRED_TOKEN = "Token de autenticação expirado",
    AUTH_INVALID_REFRESH_TOKEN = "Refresh token de autenticação inválido",
    AUTH_EXPIRED_REFRESH_TOKEN = "Refresh token de autenticação expirado",
}