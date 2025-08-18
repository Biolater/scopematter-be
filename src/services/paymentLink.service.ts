import prisma from "../lib/prisma";
import { CreatePaymentLinkInput, DeletePaymentLinkInput, GetPaymentLinkBySlugInput, GetPaymentLinksInput } from "../lib/types/paymentLink";
import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";

export const createPaymentLink = async ({
    userId,
    walletId,
    chain,
    asset,
    amountUsd,
    memo,
}: CreatePaymentLinkInput) => {
    // 1. Wallet ownership check
    const wallet = await prisma.wallet.findFirst({
        where: { userId, id: walletId },
    });
    if (!wallet) {
        throw new ServiceError(ServiceErrorCodes.WALLET_NOT_FOUND);
    }

    // 2. Chain consistency
    if (wallet.chain !== chain) {
        throw new ServiceError(ServiceErrorCodes.CHAIN_MISMATCH);
    }

    // 3. Asset validity (per chain)
    if (chain === "ETH_MAINNET" && !["ETH", "USDT"].includes(asset)) {
        throw new ServiceError(ServiceErrorCodes.UNSUPPORTED_ASSET);
    }

    // 4. Insert record
    return prisma.paymentLink.create({
        data: {
            userId,
            walletId,
            chain,
            asset,
            amountUsd,
            memo,
        },
    });
};

export const getPaymentLinkBySlug = async ({ slug }: GetPaymentLinkBySlugInput) => {
    const link = await prisma.paymentLink.findFirst({
        where: { slug, status: "ACTIVE" },
        include: {
            wallet: {
                select: { address: true, chain: true, isPrimary: true },
            },
            user: {
                select: {
                    imageUrl: true,
                    email: true,
                },
            },
        },
    });

    if (!link) {
        throw new ServiceError(ServiceErrorCodes.PAYMENTLINK_NOT_FOUND);
    }

    return link;
};

export const getPaymentLinks = async ({ userId }: GetPaymentLinksInput) => {
    return prisma.paymentLink.findMany({
        where: { userId, status: "ACTIVE" },
        include: {
            wallet: {
                select: { address: true, chain: true, isPrimary: true },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const deletePaymentLink = async ({ userId, paymentLinkId }: DeletePaymentLinkInput) => {
    const paymentLink = await prisma.paymentLink.findFirst({
        where: { userId, id: paymentLinkId },
    });
    if (!paymentLink) {
        throw new ServiceError(ServiceErrorCodes.PAYMENTLINK_NOT_FOUND);
    }

    if (paymentLink.status === "INACTIVE") {
        throw new ServiceError(ServiceErrorCodes.PAYMENTLINK_NOT_FOUND);
    }

    return prisma.paymentLink.update({
        where: { id: paymentLinkId },
        data: { status: "INACTIVE" },
    });
};