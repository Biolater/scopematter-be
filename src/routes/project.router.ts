import { Router } from "express";
import { requireAuth } from "../middleware/auth";

import { validateBody } from "../middleware/validate";
import { createProjectSchema, updateProjectSchema } from "../validation/project.schema";
import { createProjectController, deleteProjectController, getProjectController, getProjectsController, updateProjectController } from "../controllers/project.controller";


const projectRouter = Router();

projectRouter.post("/", requireAuth, validateBody(createProjectSchema), createProjectController)

projectRouter.get("/", requireAuth, getProjectsController);

projectRouter.get("/:id", requireAuth, getProjectController);

projectRouter.put("/:id", requireAuth, validateBody(updateProjectSchema), updateProjectController);

projectRouter.delete("/:id", requireAuth, deleteProjectController);

export default projectRouter;   