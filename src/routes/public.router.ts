import { Router } from "express";
import { getShareLinkController } from "../controllers/shareLink.controller";

const publicRouter = Router();

publicRouter.get("/share/:token", getShareLinkController);

export default publicRouter;
