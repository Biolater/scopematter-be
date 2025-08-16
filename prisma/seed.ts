import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a mock user
  const user = await prisma.appUser.create({
    data: {
      clerkId: "mock_clerk_id_123",
      email: "demo@paylynk.app",
      name: "Demo User",
    },
  });

  // Create wallet for that user
  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      address: "0x1234567890abcdef1234567890abcdef12345678",
      chain: "ETH_MAINNET",
      isPrimary: true,
    },
  });

  // Create a payment link
  const paymentLink = await prisma.paymentLink.create({
    data: {
      userId: user.id,
      walletId: wallet.id,
      slug: "demo-link-001",
      asset: "USDT",
      chain: "ETH_MAINNET",
      amountUsd: 100.0,
      status: "ACTIVE",
      memo: "Demo design payment",
    },
  });

  // Create a transaction for that link
  await prisma.transaction.create({
    data: {
      userId: user.id,
      paymentLinkId: paymentLink.id,
      onramperTxId: "onramper_tx_mock_123",
      txHash: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
      chain: "ETH_MAINNET",
      asset: "USDT",
      amountUsd: 100.0,
      cryptoAmount: 98.5, // after fee
      feeBps: 150,
      feeUsd: 1.5,
      status: "SUCCESS",
      providerRaw: {
        orderId: "mock_order_123",
        method: "visa",
        status: "completed",
      },
    },
  });

  console.log("✅ Mock data inserted");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
