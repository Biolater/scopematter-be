import express from "express";
import { handleClerkWebhook } from "../controllers/clerk.controller";

const webhookRouter = express.Router();

// Clerk requires raw body, not parsed JSON
webhookRouter.post(
  "/webhooks/clerk",
  express.raw({ type: "application/json" }),
  handleClerkWebhook
);

export default webhookRouter;
