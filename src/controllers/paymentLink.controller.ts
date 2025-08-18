import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { createPaymentLink, deletePaymentLink, getPaymentLinkBySlug, getPaymentLinks } from "../services/paymentLink.service";
import { handleServiceError } from "../utils/error-mapper";

export async function createPaymentLinkController(req: Request, res: Response) {
    try {
        const { walletId, chain, asset, amountUsd, memo } = req.body;
        const paymentLink = await createPaymentLink({
            userId: req.user.id,
            walletId,
            chain,
            asset,
            amountUsd,
            memo,
        });
        return sendSuccess({ res, data: { paymentLink }, status: 201 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Error creating payment link" });
    }
}

export async function getPaymentLinkBySlugController(req: Request, res: Response) {
    try {
        const { slug } = req.params;
        const paymentLink = await getPaymentLinkBySlug({ slug });
        return sendSuccess({ res, data: { paymentLink } });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Error getting payment link" });
    }
}

export async function getPaymentLinksController(req: Request, res: Response) {
    try {
        const paymentLinks = await getPaymentLinks({ userId: req.user.id });
        return sendSuccess({ res, data: { paymentLinks } });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Error getting payment links" });
    }
}

export async function deletePaymentLinkController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const paymentLink = await deletePaymentLink({ userId: req.user.id, paymentLinkId: id });
        return sendSuccess({ res, data: { paymentLink } });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Error deleting payment link" });
    }
}