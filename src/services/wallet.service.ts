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

export async function createWallet({ userId, address, chain, isPrimary }: CreateWalletInput) {
  const hasWallet = await prisma.wallet.findFirst({ where: { address, chain, userId } });
  if (hasWallet) throw new ServiceError(ServiceErrorCodes.WALLET_EXISTS);

  if (isPrimary) {
    await prisma.wallet.updateMany({
      where: { userId, chain, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.wallet.create({ data: { userId, address, chain, isPrimary } });
}

export async function setPrimaryWallet({ userId, walletId }: SetPrimaryWalletInput) {
  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet || wallet.userId !== userId) {
    throw new ServiceError(ServiceErrorCodes.WALLET_NOT_FOUND);
  }

  if (wallet.isPrimary) {
    throw new ServiceError(ServiceErrorCodes.ALREADY_PRIMARY);
  }

  await prisma.wallet.updateMany({
    where: { userId, chain: wallet.chain, isPrimary: true },
    data: { isPrimary: false },
  });

  return prisma.wallet.update({ where: { id: walletId }, data: { isPrimary: true } });
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
