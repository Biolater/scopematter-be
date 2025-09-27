import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createScopeItemSchema, updateScopeItemSchema } from "../validation/scopeItem.schema";
import {
    createScopeItemController,
    getScopeItemsController,
    deleteScopeItemController,
    updateScopeItemController,
    exportScopeItemsController,
} from "../controllers/scopeItem.controller";

const scopeItemRouter = Router({ mergeParams: true });

scopeItemRouter.post(
    "/",
    requireAuth,
    validateBody(createScopeItemSchema),
    createScopeItemController
);

scopeItemRouter.get("/", requireAuth, getScopeItemsController);

scopeItemRouter.delete("/:id", requireAuth, deleteScopeItemController);

scopeItemRouter.put("/:id", requireAuth, validateBody(updateScopeItemSchema), updateScopeItemController);

scopeItemRouter.get("/export", requireAuth, exportScopeItemsController);

export default scopeItemRouter;
