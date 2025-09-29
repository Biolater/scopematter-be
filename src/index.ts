import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ENV } from "./config/env";
import { clerkClient, clerkMiddleware } from "@clerk/express";
import { requireAuth } from "./middleware/auth"; // <- your custom one
import webhookRouter from "./routes/webhook.router";
import { sendSuccess } from "./utils/response";
import { errorHandler } from "./middleware/error";
import projectRouter from "./routes/project.router";
import dashboardRouter from "./routes/dashboard.router";
import publicRouter from "./routes/public.router";

const app = express();

// Middlewares
app.use(
    clerkMiddleware({
        publishableKey: ENV.CLERK_PUBLISHABLE_KEY,
        secretKey: ENV.CLERK_SECRET_KEY,
    })
);
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/webhooks", webhookRouter);
app.use(express.json());


app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
});

app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/public", publicRouter);

app.get("/clerk/:userId", async (req: Request, res: Response) => {
    try {
        // 🔥 FIX: always coerce to string
        const secret = String(req.headers["x-internal-secret"] || "").trim();

        if (secret !== ENV.INTERNAL_API_SECRET) {
            console.log("Invalid secret:", secret); // debug
            return res.status(403).json({ error: "Forbidden" });
        }

        const { userId } = req.params;

        // Get Clerk user
        const user = await clerkClient.users.getUser(userId);

        // Get sessions
        const sessions = await clerkClient.sessions.getSessionList({ userId });
        if (!sessions || sessions.data.length === 0) {
            return res.status(404).json({ error: "No active sessions for this user" });
        }

        const sessionId = sessions.data[0].id;

        // Mint JWT using your template ("postman")
        const token = await clerkClient.sessions.getToken(sessionId, "postman");

        return res.json({
            message: "Clerk route",
            user,
            jwt: token.jwt,
        });
    } catch (err: any) {
        console.error("Error in /clerk/:userId", err);
        return res.status(500).json({ error: err.message });
    }
});

// Example protected route
app.get("/protected", requireAuth, (req: Request, res: Response) => {
    sendSuccess({ res, data: { message: "Protected route", user: (req as any).user } });
});

app.use(errorHandler);


app.listen(ENV.PORT, () => {
    console.log(`Server running at http://localhost:${ENV.PORT}`);
});
