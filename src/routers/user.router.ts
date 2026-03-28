import { Router } from "express";
import UserController from "../controllers/user.controller";
import { validateBody } from "@/middlewares/validate-body";
import { userCreateBodySchema } from "@/schemas/user.schema";

const userRouter = Router();
const controller = new UserController();

userRouter.post("/", validateBody(userCreateBodySchema), controller.createUser);

export default userRouter;
