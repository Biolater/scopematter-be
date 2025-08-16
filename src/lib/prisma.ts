import { PrismaClient } from "@prisma/client";

declare global {
    // Extend Node's global scope (TypeScript)
    var prisma: PrismaClient | undefined;
}

// Reuse existing instance in dev; always create in production
const prisma: PrismaClient =
    global.prisma ||
    new PrismaClient({
        // optional: add logging, middleware, etc.
        
    });

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

export default prisma;
