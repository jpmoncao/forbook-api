import { Router } from "express";
import AuthController from "@/controllers/auth.controller";
import { validateBody } from "@/middlewares/validate-body";
import { confirmLoginBodySchema, loginBodySchema } from "@/schemas/auth.schema";

const authRouter = Router();
const controller = new AuthController();

authRouter.post("/login", validateBody(loginBodySchema), controller.login);
authRouter.post("/confirm-login", validateBody(confirmLoginBodySchema), controller.confirmLogin);
authRouter.get("/verify-email", controller.verifyEmailCode);
// authRouter.post("/forgot-password", controller.forgotPassword);
// authRouter.post("/reset-password", controller.resetPassword);
// authRouter.post("/refresh-token", controller.refreshToken);

export default authRouter;
