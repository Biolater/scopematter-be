import { Router } from "express";
import { requireAuth } from "../middleware/auth";

import { validateBody } from "../middleware/validate";
import { createProjectSchema } from "../validation/project.schema";
import { createProjectController } from "../controllers/project.controller";


const projectRouter = Router();

projectRouter.post("/", requireAuth, validateBody(createProjectSchema), createProjectController)

export default projectRouter;