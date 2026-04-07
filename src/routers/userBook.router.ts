import { Router } from "express";
import UserBookController from "@/controllers/userBook.controller";
import { validateBody } from "@/middlewares/validate-body";
import { userBookCreateBodySchema, userBookUpdateBodySchema } from "@/schemas/userBook.schema";
import { validateToken } from "@/middlewares/validate-token";

const userBookRouter = Router();
const controller = new UserBookController();

userBookRouter.get("/", validateToken, controller.getAllUserBooks);
userBookRouter.get("/my", validateToken, controller.getMyUserBooks);
userBookRouter.get("/:id", validateToken, controller.getUserBookById);
userBookRouter.post("/", validateToken, validateBody(userBookCreateBodySchema), controller.createUserBook);
userBookRouter.put("/:id", validateToken, validateBody(userBookUpdateBodySchema), controller.updateUserBook);

export default userBookRouter;
