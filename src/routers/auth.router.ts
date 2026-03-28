import { Router } from "express";
import AuthController from "@/controllers/auth.controller";

const authRouter = Router();
const controller = new AuthController();

authRouter.post("/login", controller.login);
authRouter.post("/confirm-login", controller.confirmLogin);
// authRouter.post("/forgot-password", controller.forgotPassword);
// authRouter.post("/reset-password", controller.resetPassword);
// authRouter.post("/refresh-token", controller.refreshToken);

export default authRouter;
