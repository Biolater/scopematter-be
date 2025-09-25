import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { handleServiceError } from "../utils/error-mapper";
import { createScopeItem, deleteScopeItem, getScopeItems, updateScopeItem } from "../services/scopeItem.service";
import { CreateScopeItemSchema, DeleteScopeItemSchema, UpdateScopeItemSchema } from "../validation/scopeItem.schema";

export const createScopeItemController = async (req: Request<{ projectId: string }, {}, CreateScopeItemSchema>, res: Response) => {
    try {
        const { description, name } = req.body;
        const { projectId } = req.params;
        const scopeItem = await createScopeItem({
            projectId,
            description,
            userId: req.user.id,
            name: req.body.name,
        });
        return sendSuccess({ res, data: scopeItem, status: 201 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to create scope item" });
    }
}

export const getScopeItemsController = async (req: Request<{ projectId: string }>, res: Response) => {
    try {
        const { projectId } = req.params;
        const scopeItems = await getScopeItems({ projectId, userId: req.user.id });
        return sendSuccess({ res, data: scopeItems, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to get scope items" });
    }
}

export const deleteScopeItemController = async (req: Request<{ projectId: string, id: string }, {}, DeleteScopeItemSchema>, res: Response) => {
    try {
        const { projectId, id } = req.params;
        const scopeItem = await deleteScopeItem({ projectId, id, userId: req.user.id });
        return sendSuccess({ res, data: scopeItem, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to delete scope item" });
    }
}

export const updateScopeItemController = async (req: Request<{ projectId: string, id: string }, {}, UpdateScopeItemSchema>, res: Response) => {
    try {
        const { projectId, id } = req.params;
        const { description, name } = req.body;
        const scopeItem = await updateScopeItem({ projectId, id, userId: req.user.id, description, name });
        return sendSuccess({ res, data: scopeItem, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to update scope item" });
    }
}
