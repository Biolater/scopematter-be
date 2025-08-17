import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ENV } from "./config/env";
import { clerkMiddleware } from "@clerk/express";
import { requireAuth } from "./middleware/auth"; // <- your custom one
import webhookRouter from "./routes/webhook.router";
import { sendSuccess } from "./utils/response";
import { errorHandler } from "./middleware/error";
import walletRouter from "./routes/wallet.router";
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
app.use(express.json());   // <- put this BEFORE routers
app.use(morgan("dev"));

// Routes
app.use("/webhooks", webhookRouter);
app.use("/wallets", walletRouter);

app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
});

// Example protected route
app.get("/protected", requireAuth, (req: Request, res: Response) => {
    sendSuccess(res, { message: "Protected route", user: (req as any).user });
});

app.use(errorHandler);


app.listen(ENV.PORT, () => {
    console.log(`Server running at http://localhost:${ENV.PORT}`);
});
