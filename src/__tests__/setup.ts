// __tests__/setup.ts
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";

// Create a deep mock of PrismaClient
const mockPrisma = mockDeep<PrismaClient>();

// Replace the real Prisma client with our mock in all imports
jest.mock("../lib/prisma", () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Export for use in tests
export { mockPrisma };
export type MockPrisma = DeepMockProxy<PrismaClient>;
