import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { createPaymentLink, getPaymentLinkBySlug } from "../services/paymentLink.service";
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
        return sendSuccess(res, { paymentLink });
    } catch (error) {
        return handleServiceError(res, error, "Error creating payment link");
    }
}

export async function getPaymentLinkBySlugController(req: Request, res: Response) { 
    try {
        const { slug } = req.params;
        const paymentLink = await getPaymentLinkBySlug({ slug });
        return sendSuccess(res, { paymentLink });
    } catch (error) {
        return handleServiceError(res, error, "Error getting payment link");
    }
}