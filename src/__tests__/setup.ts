// __tests__/setup.ts
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";

// Create a deep mock of PrismaClient
const mockPrisma = mockDeep<PrismaClient>();

// Create a mock Redis instance
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

// Replace the real Prisma client with our mock in all imports
jest.mock("../lib/prisma", () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Replace the real Redis client with our mock
jest.mock("../lib/redis", () => ({
  redis: mockRedis,
}));

// Export for use in tests
export { mockPrisma, mockRedis };
export type MockPrisma = DeepMockProxy<PrismaClient>;
