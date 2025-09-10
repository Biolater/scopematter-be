import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createChangeOrderSchema, updateChangeOrderSchema } from "../validation/changeOrder.schema";
import { createChangeOrderController, getChangeOrdersController, updateChangeOrderController, getChangeOrderController } from "../controllers/changeOrder.controller";


const changeOrderRouter = Router({ mergeParams: true });

changeOrderRouter.post("/", requireAuth, validateBody(createChangeOrderSchema), createChangeOrderController);

changeOrderRouter.get("/", requireAuth, getChangeOrdersController);

changeOrderRouter.get("/:id", requireAuth, getChangeOrderController);

changeOrderRouter.put("/:id", requireAuth, validateBody(updateChangeOrderSchema), updateChangeOrderController);

export default changeOrderRouter;