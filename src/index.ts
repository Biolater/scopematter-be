import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ENV } from "./config/env";
import { clerkMiddleware, requireAuth } from "@clerk/express";

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
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
});

app.get("/protected", requireAuth(), (_req: Request, res: Response) => {
    res.json({ message: "Protected route" });
});

// Error handler (optional, to type `_err`)
app.use(
    (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
);

app.listen(ENV.PORT, () => {
    console.log(`Server running at http://localhost:${ENV.PORT}`);
});
