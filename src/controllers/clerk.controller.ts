import { Request, Response } from "express";
import { Webhook } from "svix";
import { upsertAppUser } from "../services/clerk.service";
import { ENV } from "../config/env";

export async function handleClerkWebhook(req: Request, res: Response) {
    const wh = new Webhook(ENV.CLERK_WEBHOOK_SECRET);

    let evt;
    try {
        evt = wh.verify(req.body, req.headers as any);
    } catch (err) {
        console.error("❌ Clerk webhook verification failed:", err);
        return res.status(400).send("Invalid signature");
    }

    const { type, data } = evt as { type: string; data: any };

    try {
        await upsertAppUser(data, type);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("❌ Error handling Clerk webhook:", err);
        res.status(500).json({ error: "Database error" });
    }
}
