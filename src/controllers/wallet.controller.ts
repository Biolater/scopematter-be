import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { sendError, sendSuccess } from "../utils/response";
import { ErrorCodes } from "../utils/error-codes";

export async function getWallets(req: Request, res: Response) {
    try {
        const wallets = await prisma.wallet.findMany({
            where: { userId: req.user.id },
        });
        return sendSuccess(res, { wallets });
    } catch (e) {
        return sendError(res, "Failed to fetch wallets", ErrorCodes.DATABASE_ERROR, 500);
    }
}
export async function createWallet(req: Request, res: Response) {
    try {
        const { address, chain, isPrimary } = req.body;
        const hasWallet = await prisma.wallet.findFirst({
            where: { address, chain, userId: req.user.id },
        });
        if (hasWallet) {
            return sendError(res, "Wallet already exists", ErrorCodes.VALIDATION_ERROR, 400);
        }


        // If isPrimary is true, make all other primary wallets false
        if (isPrimary) {
            await prisma.wallet.updateMany({
                where: { userId: req.user.id, chain, isPrimary: true },
                data: { isPrimary: false },
            });
        }
        // Create the wallet
        const wallet = await prisma.wallet.create({
            data: {
                address,
                chain,
                isPrimary,
                userId: req.user.id,
            },
        });
        // Return the wallet
        return sendSuccess(res, { wallet });
    } catch (e) {
        return sendError(res, "Failed to create wallet", ErrorCodes.DATABASE_ERROR, 500);
    }
}
export async function setPrimaryWallet(req: Request, res: Response) {
    try {
        const { id } = req.params;
        if (!id || id.trim() === "") {
            return sendError(res, "Invalid wallet ID", ErrorCodes.VALIDATION_ERROR, 400);
        }

        // 1. Find wallet
        const wallet = await prisma.wallet.findUnique({ where: { id } });
        if (!wallet || wallet.userId !== req.user.id) {
            return sendError(res, "Wallet not found", ErrorCodes.NOT_FOUND, 404);
        }

        // 2. If already primary, short-circuit
        if (wallet.isPrimary) {
            return sendError(res, "Wallet is already primary", ErrorCodes.VALIDATION_ERROR, 400);
        }

        // 3. Unset other primaries on the same chain
        await prisma.wallet.updateMany({
            where: { userId: req.user.id, chain: wallet.chain, isPrimary: true },
            data: { isPrimary: false },
        });

        // 4. Set this wallet as primary
        const updatedWallet = await prisma.wallet.update({
            where: { id },
            data: { isPrimary: true },
        });

        return sendSuccess(res, { wallet: updatedWallet });
    } catch (e) {
        return sendError(res, "Failed to set primary wallet", ErrorCodes.DATABASE_ERROR, 500);
    }
}
export async function deleteWallet(req: Request, res: Response) {
    try {
        const { id } = req.params;
        if (!id || id.trim() === "") {
            return sendError(res, "Wallet ID is required", ErrorCodes.VALIDATION_ERROR, 400);
        }

        // 1. Find wallet
        const wallet = await prisma.wallet.findUnique({ where: { id } });
        if (!wallet || wallet.userId !== req.user.id) {
            return sendError(res, "Wallet not found", ErrorCodes.NOT_FOUND, 404);
        }

        // 2. Prevent deleting primary wallet
        if (wallet.isPrimary) {
            return sendError(res, "Cannot delete primary wallet", ErrorCodes.VALIDATION_ERROR, 400);
        }

        // 3. Delete wallet
        const deletedWallet = await prisma.wallet.delete({ where: { id } });

        return sendSuccess(res, { wallet: deletedWallet });
    } catch (e) {
        return sendError(res, "Failed to delete wallet", ErrorCodes.DATABASE_ERROR, 500);
    }
}