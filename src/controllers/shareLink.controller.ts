import { Request, Response } from "express";
import { CreateShareLinkSchema } from "../validation/shareLink.schema";
import { handleServiceError } from "../utils/error-mapper";
import { sendSuccess } from "../utils/response";
import { createShareLink, getShareLink, getShareLinks, revokeShareLink } from "../services/shareLink.service";

export const createShareLinkController = async (req: Request<{ projectId: string }, {}, CreateShareLinkSchema>, res: Response) => {
    try {
        const { projectId } = req.params;
        const { expiresAt, showScopeItems, showRequests, showChangeOrders } = req.body;
        const shareLink = await createShareLink({ projectId, expiresAt, showScopeItems, showRequests, showChangeOrders, userId: req.user.id });
        return sendSuccess({ res, data: shareLink, status: 201 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to create share link" });
    }
}

export const getShareLinkController = async (req: Request<{ token: string }>, res: Response) => {
    try {
        const { token } = req.params;
        const shareLink = await getShareLink({ token });
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
        res.setHeader("Cache-Control", "no-store");
        return sendSuccess({ res, data: shareLink, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to get share link" });
    }
}

export const getShareLinksController = async (req: Request<{ projectId: string }>, res: Response) => {
    try {
        const shareLinks = await getShareLinks({ userId: req.user.id, projectId: req.params.projectId });
        return sendSuccess({ res, data: shareLinks, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to get share links" });
    }
}

export const revokeShareLinkController = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;
        await revokeShareLink({ userId: req.user.id, id });
        return sendSuccess({ res, data: { id }, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to revoke share link" });
    }
}