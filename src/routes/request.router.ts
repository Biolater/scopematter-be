import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createRequestSchema, updateRequestSchema, deleteRequestSchema } from "../validation/request.schema";
import { createRequestController, getRequestsController, updateRequestController, deleteRequestController } from "../controllers/request.controller";

const requestRouter = Router({ mergeParams: true });

requestRouter.post("/", requireAuth, validateBody(createRequestSchema), createRequestController);

requestRouter.get("/", requireAuth, getRequestsController);

requestRouter.put("/:id", requireAuth, validateBody(updateRequestSchema), updateRequestController);

requestRouter.delete("/:id", requireAuth, validateBody(deleteRequestSchema), deleteRequestController);

export default requestRouter;