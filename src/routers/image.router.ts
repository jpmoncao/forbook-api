import { Router } from "express";
import ImageController from "@/controllers/image.controller";
import { validateToken } from "@/middlewares/validate-token";
import { multerMiddleware } from "@/middlewares/multer";

const imageRouter = Router();
const controller = new ImageController();

imageRouter.post("/upload", validateToken, multerMiddleware.single("image"), controller.uploadImage);

export default imageRouter;
