import prisma from "../lib/prisma";
import {
  GetUserWalletsInput,
  CreateWalletInput,
  SetPrimaryWalletInput,
  DeleteWalletInput,
} from "../lib/types/wallet";
import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";

export async function getUserWallets({ userId }: GetUserWalletsInput) {
  return prisma.wallet.findMany({ where: { userId } });
}

export async function createWallet({ userId, address, chain, isPrimary = false }: CreateWalletInput) {
  return prisma.$transaction(async (tx) => {
    // Prevent duplicates
    const hasWallet = await tx.wallet.findFirst({
      where: { address, chain, userId },
    });
    if (hasWallet) {
      throw new ServiceError(ServiceErrorCodes.WALLET_EXISTS);
    }

    // If marked as primary, demote all others
    if (isPrimary) {
      await tx.wallet.updateMany({
        where: { userId, chain, isPrimary: true },
        data: { isPrimary: false },
      });
    } else {
      // Ensure at least one primary exists per chain
      const alreadyHasPrimary = await tx.wallet.findFirst({
        where: { userId, chain, isPrimary: true },
      });
      if (!alreadyHasPrimary) {
        isPrimary = true; // auto-promote new wallet
      }
    }

    return tx.wallet.create({
      data: { userId, address, chain, isPrimary },
    });
  });
}

export async function setPrimaryWallet({ userId, walletId }: SetPrimaryWalletInput) {
  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet || wallet.userId !== userId) {
    throw new ServiceError(ServiceErrorCodes.WALLET_NOT_FOUND);
  }

  if (wallet.isPrimary) {
    throw new ServiceError(ServiceErrorCodes.ALREADY_PRIMARY);
  }

  // wrap in a single transaction
  const [_, updated] = await prisma.$transaction([
    prisma.wallet.updateMany({
      where: { userId, chain: wallet.chain, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.wallet.update({
      where: { id: walletId },
      data: { isPrimary: true },
    }),
  ]);

  return updated;
}


export async function deleteWallet({ userId, walletId }: DeleteWalletInput) {
  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet || wallet.userId !== userId) {
    throw new ServiceError(ServiceErrorCodes.WALLET_NOT_FOUND);
  }

  if (wallet.isPrimary) {
    throw new ServiceError(ServiceErrorCodes.CANNOT_DELETE_PRIMARY);
  }

  return prisma.wallet.delete({ where: { id: walletId } });
}
