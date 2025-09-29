import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createShareLinkController, getShareLinksController, revokeShareLinkController } from "../controllers/shareLink.controller";
import { validateBody } from "../middleware/validate";
import { createShareLinkSchema } from "../validation/shareLink.schema";

const shareLinkRouter = Router({ mergeParams: true });

shareLinkRouter.post("/", requireAuth, validateBody(createShareLinkSchema), createShareLinkController);
shareLinkRouter.get("/", requireAuth, getShareLinksController);
shareLinkRouter.delete("/:id", requireAuth, revokeShareLinkController);

export default shareLinkRouter;