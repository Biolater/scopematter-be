import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createPaymentLinkSchema } from "../validation/paymentLink.schema";
import { createPaymentLinkController, getPaymentLinkBySlugController } from "../controllers/paymentLink.controller";

const paymentLinkRouter = Router();

paymentLinkRouter.post("/", requireAuth, validateBody(createPaymentLinkSchema), createPaymentLinkController)
paymentLinkRouter.get("/:slug", getPaymentLinkBySlugController)
paymentLinkRouter.get("/", requireAuth, () => { })
paymentLinkRouter.delete("/:id", requireAuth, () => { })