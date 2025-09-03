import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { handleServiceError } from "../utils/error-mapper";
import { createProject } from "../services/project.service";
import { CreateProjectSchema } from "../validation/project.schema";


export const createProjectController = async (req: Request<{}, {}, CreateProjectSchema>,
    res: Response) => {
    try {
        const { name, description, client } = req.body;
        const project = await createProject({
            userId: req.user.id,
            name,
            description,
            client,
        });
        return sendSuccess({ res, data: project, status: 201 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to create project" });
    }
}