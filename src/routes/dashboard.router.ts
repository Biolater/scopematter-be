import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboardController } from "../controllers/dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, getDashboardController);

export default dashboardRouter;