import { Router } from "express";
import UserController from "../controllers/user.controller";
import { validateBody } from "@/middlewares/validate-body";
import { userCreateBodySchema, userUpdateBodySchema } from "@/schemas/user.schema";
import { validateToken } from "@/middlewares/validate-token";

const userRouter = Router();
const controller = new UserController();

userRouter.get("/me", validateToken, controller.getUserMe);
userRouter.get("/:id/wishlist", validateToken, controller.getUserWishlist);
userRouter.get("/:id", validateToken, controller.getUserById);
userRouter.get("/", validateToken, controller.getAllUsers);

userRouter.post("/:id/wishlist/:bookId", validateToken, controller.addBookToWishlist);
userRouter.post("/", validateBody(userCreateBodySchema), controller.createUser);

userRouter.put("/me", validateToken, validateBody(userUpdateBodySchema), controller.updateUser);

userRouter.delete("/:id/wishlist/:bookId", validateToken, controller.removeBookFromWishlist);

export default userRouter;
