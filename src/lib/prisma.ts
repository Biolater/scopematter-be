import { PrismaClient } from "@prisma/client";

declare global {
    // Extend Node's global scope (TypeScript)
    var prisma: PrismaClient | undefined;
}

// Reuse existing instance in dev; always create in production
const prisma: PrismaClient =
    global.prisma ||
    new PrismaClient({
        transactionOptions: {
            maxWait: 10000,
            timeout: 10000,
        }
    });

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

// Graceful shutdown
process.on("beforeExit", async () => {
    await prisma.$disconnect();
});

export default prisma;
