import type { Request, Response } from "express";
import { Webhook } from "svix";
import { ENV } from "../config/env";
import { upsertAppUser } from "../services/clerk.service";

export async function handleClerkWebhook(req: Request, res: Response) {
    try {
      const payload = req.body as Buffer;
  
      const svixId = req.header("svix-id");
      const svixTimestamp = req.header("svix-timestamp");
      const svixSignature = req.header("svix-signature");
  
      if (!svixId || !svixTimestamp || !svixSignature) {
        return res.status(400).send("Missing Svix headers");
      }
  
      const wh = new Webhook(ENV.CLERK_WEBHOOK_SECRET);
      const evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
  
      // ✅ Correct: pass only evt.data
      console.log("Passing to service:", (evt as any).type, (evt as any).data.id);
      await upsertAppUser((evt as any).data, (evt as any).type);
  
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("❌ Clerk webhook verification failed:", err);
      return res.status(400).send("Invalid signature");
    }
  }
  