import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { handleServiceError } from "../utils/error-mapper";
import { CreateRequestSchema, UpdateRequestSchema } from "../validation/request.schema";
import { createRequest, getRequests, updateRequest } from "../services/request.service";

export const createRequestController = async (req: Request<{ projectId: string }, {}, CreateRequestSchema>, res: Response) => {
    try {
        const { description } = req.body;
        const { projectId } = req.params;
        const request = await createRequest({
            projectId,
            description,
            userId: req.user.id,
        });
        return sendSuccess({ res, data: request, status: 201 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to create request" });
    }
}

export const getRequestsController = async (req: Request<{ projectId: string }>, res: Response) => {
    try {
        const { projectId } = req.params;
        const requests = await getRequests({ projectId, userId: req.user.id });
        return sendSuccess({ res, data: requests, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to get requests" });
    }
}

export const updateRequestController = async (req: Request<{ id: string }, {}, UpdateRequestSchema>, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const request = await updateRequest({ id, userId: req.user.id, data });
        return sendSuccess({ res, data: request, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to update request" });
    }
}