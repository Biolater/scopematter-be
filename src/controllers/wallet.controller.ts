import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import {
  getUserWallets,
  createWallet,
  setPrimaryWallet,
  deleteWallet,
} from "../services/wallet.service";
import { handleServiceError } from "../utils/error-mapper";

export async function getWalletsController(req: Request, res: Response) {
  try {
    const wallets = await getUserWallets({ userId: req.user.id });
    return sendSuccess({ res, data: { wallets } });
  } catch (e) {
    return handleServiceError({ res, e, fallbackMsg: "Failed to fetch wallets" });
  }
}

export async function createWalletController(req: Request, res: Response) {
  try {
    const { address, chain, isPrimary } = req.body;
    const wallet = await createWallet({ userId: req.user.id, address, chain, isPrimary });
    return sendSuccess({ res, data: { wallet }, status: 201 });
  } catch (e) {
    return handleServiceError({ res, e, fallbackMsg: "Failed to create wallet" });
  }
}

export async function setPrimaryWalletController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const wallet = await setPrimaryWallet({ userId: req.user.id, walletId: id });
    return sendSuccess({ res, data: { wallet }, status: 200 });
  } catch (e) {
    return handleServiceError({ res, e, fallbackMsg: "Failed to set primary wallet" });
  }
}

export async function deleteWalletController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const wallet = await deleteWallet({ userId: req.user.id, walletId: id });
    return sendSuccess({ res, data: { wallet }, status: 200 });
  } catch (e) {
    return handleServiceError({ res, e, fallbackMsg: "Failed to delete wallet" });
  }
}