import CatalogBookController from "@/controllers/catalogbook.controller";
import { validateBody } from "@/middlewares/validate-body";
import { validateToken } from "@/middlewares/validate-token";
import { catalogBookCreateBodySchema, CatalogBookUpdateBodySchema } from "@/schemas/catalogbook.schema";
import { Router } from "express";



const catalogBookRouter = Router();
const controller = new CatalogBookController();

catalogBookRouter.post("/", validateBody(catalogBookCreateBodySchema), controller.createCatalogBook);

catalogBookRouter.get("/:isbn", validateToken, controller.getCatalogBook);
catalogBookRouter.put("/:isbn", validateToken, validateBody(CatalogBookUpdateBodySchema), controller.updateCatalogBook);

export default catalogBookRouter;