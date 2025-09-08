import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createRequestSchema, updateRequestSchema } from "../validation/request.schema";
import { createRequestController, getRequestsController, updateRequestController } from "../controllers/request.controller";

const requestRouter = Router({ mergeParams: true });

requestRouter.post("/", requireAuth, validateBody(createRequestSchema), createRequestController);

requestRouter.get("/", requireAuth, getRequestsController);

requestRouter.put("/:id", requireAuth, validateBody(updateRequestSchema), updateRequestController);

export default requestRouter;