import CatalogBookController from "@/controllers/catalogBook.controller";
import { validateBody } from "@/middlewares/validate-body";
import { validateToken } from "@/middlewares/validate-token";
import { catalogBookCreateBodySchema, catalogBookUpdateBodySchema } from "@/schemas/catalogBook.schema";
import { Router } from "express";

const catalogBookRouter = Router();
const controller = new CatalogBookController();

catalogBookRouter.get("/:isbn", validateToken, controller.getCatalogBook);
catalogBookRouter.post("/", validateToken, validateBody(catalogBookCreateBodySchema), controller.createCatalogBook);
catalogBookRouter.put("/:isbn", validateToken, validateBody(catalogBookUpdateBodySchema), controller.updateCatalogBook);

export default catalogBookRouter;
