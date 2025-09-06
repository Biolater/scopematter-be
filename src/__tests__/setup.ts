// Test setup file
import { jest } from '@jest/globals';

// Mock Prisma client
const mockPrisma = {
  $transaction: jest.fn<any>(),
  project: {
    findFirst: jest.fn<any>(),
    update: jest.fn<any>(),
    create: jest.fn<any>(),
    delete: jest.fn<any>(),
    findMany: jest.fn<any>(),
  },
  client: {
    create: jest.fn<any>(),
    update: jest.fn<any>(),
  },

  scopeItem: {
    create: jest.fn<any>(),
    findMany: jest.fn<any>(),
    findUnique: jest.fn<any>(),
    findFirst: jest.fn<any>(),
    deleteMany: jest.fn<any>(),
    updateMany: jest.fn<any>(),
  },
};

// Mock the prisma module
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Export mock for use in tests
export { mockPrisma };
