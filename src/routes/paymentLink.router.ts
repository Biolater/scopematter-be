/* import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createPaymentLinkSchema } from "../validation/paymentLink.schema";
import { createPaymentLinkController, deletePaymentLinkController, getPaymentLinkBySlugController, getPaymentLinksController, updatePaymentLinkStatusController } from "../controllers/paymentLink.controller";

const paymentLinkRouter = Router();

paymentLinkRouter.get("/", requireAuth, getPaymentLinksController)
paymentLinkRouter.post("/", requireAuth, validateBody(createPaymentLinkSchema), createPaymentLinkController)
paymentLinkRouter.get("/:slug", getPaymentLinkBySlugController)
paymentLinkRouter.patch("/:id/status", requireAuth, updatePaymentLinkStatusController)
paymentLinkRouter.delete("/:id", requireAuth, deletePaymentLinkController)

export default paymentLinkRouter; */