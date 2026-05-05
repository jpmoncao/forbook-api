import { Router } from "express";
import RatingController from "@/controllers/rating.controller";
import { validateToken } from "@/middlewares/validate-token";
import { ratingCreateBodySchema, ratingUpdateBodySchema } from "@/schemas/rating.schema";
import { validateBody } from "@/middlewares/validate-body";

const ratingRouter = Router();
const controller = new RatingController();

ratingRouter.get("/:userId/user", validateToken, controller.getRatingsByUserId);
ratingRouter.get("/:id", validateToken, controller.getRatingById);
ratingRouter.post("/", validateToken, validateBody(ratingCreateBodySchema), controller.createRating);
ratingRouter.put("/:id", validateToken, validateBody(ratingUpdateBodySchema), controller.updateRating);
ratingRouter.delete("/:id", validateToken, controller.deleteRating);

export default ratingRouter;
