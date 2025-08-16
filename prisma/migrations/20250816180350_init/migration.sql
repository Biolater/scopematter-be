-- CreateEnum
CREATE TYPE "public"."Chain" AS ENUM ('ETH_MAINNET');

-- CreateEnum
CREATE TYPE "public"."Asset" AS ENUM ('ETH', 'USDT');

-- CreateEnum
CREATE TYPE "public"."PaymentLinkStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."TxStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "public"."AppUser" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chain" "public"."Chain" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "amountUsd" DECIMAL(18,2),
    "asset" "public"."Asset" NOT NULL,
    "chain" "public"."Chain" NOT NULL,
    "status" "public"."PaymentLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "paymentLinkId" TEXT NOT NULL,
    "onramperTxId" TEXT,
    "txHash" TEXT,
    "chain" "public"."Chain" NOT NULL,
    "asset" "public"."Asset" NOT NULL,
    "amountUsd" DECIMAL(18,2) NOT NULL,
    "cryptoAmount" DECIMAL(38,18) NOT NULL,
    "feeBps" INTEGER NOT NULL DEFAULT 150,
    "feeUsd" DECIMAL(18,2),
    "status" "public"."TxStatus" NOT NULL DEFAULT 'PENDING',
    "providerRaw" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_clerkId_key" ON "public"."AppUser"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "public"."AppUser"("email");

-- CreateIndex
CREATE INDEX "AppUser_clerkId_idx" ON "public"."AppUser"("clerkId");

-- CreateIndex
CREATE INDEX "AppUser_email_idx" ON "public"."AppUser"("email");

-- CreateIndex
CREATE INDEX "Wallet_userId_chain_isPrimary_idx" ON "public"."Wallet"("userId", "chain", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_chain_address_key" ON "public"."Wallet"("userId", "chain", "address");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentLink_slug_key" ON "public"."PaymentLink"("slug");

-- CreateIndex
CREATE INDEX "PaymentLink_userId_status_idx" ON "public"."PaymentLink"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_onramperTxId_key" ON "public"."Transaction"("onramperTxId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "public"."Transaction"("txHash");

-- CreateIndex
CREATE INDEX "Transaction_paymentLinkId_status_idx" ON "public"."Transaction"("paymentLinkId", "status");

-- CreateIndex
CREATE INDEX "Transaction_chain_asset_idx" ON "public"."Transaction"("chain", "asset");

-- AddForeignKey
ALTER TABLE "public"."Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentLink" ADD CONSTRAINT "PaymentLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentLink" ADD CONSTRAINT "PaymentLink_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_paymentLinkId_fkey" FOREIGN KEY ("paymentLinkId") REFERENCES "public"."PaymentLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
