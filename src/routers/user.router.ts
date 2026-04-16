import { Router } from "express";
import UserController from "../controllers/user.controller";
import { validateBody } from "@/middlewares/validate-body";
import { userCreateBodySchema, userUpdateBodySchema } from "@/schemas/user.schema";
import { validateToken } from "@/middlewares/validate-token";

const userRouter = Router();
const controller = new UserController();

userRouter.post("/", validateBody(userCreateBodySchema), controller.createUser);

userRouter.get("/me", validateToken, controller.getUser);
userRouter.put("/me", validateToken, validateBody(userUpdateBodySchema), controller.updateUser);
userRouter.get("/all", controller.getUsers);

export default userRouter;
