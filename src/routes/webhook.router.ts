import express from "express";
import { handleClerkWebhook } from "../controllers/clerk.controller";
import bodyParser from "body-parser";


const webhookRouter = express.Router();

// Clerk requires raw body, not parsed JSON
webhookRouter.post(
  "/clerk",
  bodyParser.raw({ type: "application/json" }),
  handleClerkWebhook
);

export default webhookRouter;
