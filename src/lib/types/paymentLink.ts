import { Asset, Chain } from "@prisma/client";

export interface CreatePaymentLinkInput {
    userId: string;
    walletId: string;
    chain: Chain;
    asset: Asset;
    amountUsd?: number;
    memo?: string;
}

export interface GetPaymentLinkBySlugInput {
    slug: string;
}