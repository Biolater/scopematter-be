import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { handleServiceError } from "../utils/error-mapper";
import { createProject, deleteProject, getProject, getProjects, updateProject } from "../services/project.service";
import { CreateProjectSchema, UpdateProjectSchema } from "../validation/project.schema";


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

export const getProjectsController = async (req: Request, res: Response) => {
    try {
        const projects = await getProjects({ userId: req.user.id });
        return sendSuccess({ res, data: projects, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to get projects" });
    }
}

export const getProjectController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await getProject({ id, userId: req.user.id });
        return sendSuccess({ res, data: project, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to get project" });
    }
}

export const deleteProjectController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await deleteProject({ id, userId: req.user.id });
        return sendSuccess({ res, data: project, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to delete project" });
    }
}

export const updateProjectController = async (req: Request<{ id: string }, {}, UpdateProjectSchema>, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const project = await updateProject({ id, userId: req.user.id, data });
        return sendSuccess({ res, data: project, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to update project" });
    }
}