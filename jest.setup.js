// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Mock Prisma for tests to prevent real database connections
const { createPrismaMock } = require('./src/utils/prisma-mock');
const mockPrismaInstance = createPrismaMock();

jest.mock('./src/services/database/prisma.service', () => ({
  prisma: mockPrismaInstance,
  prismaService: {
    getClient: jest.fn(() => mockPrismaInstance),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isDbConnected: jest.fn(() => true),
    healthCheck: jest.fn().mockResolvedValue(true),
    transaction: jest.fn((fn) => fn(mockPrismaInstance)),
    queryRaw: jest.fn().mockResolvedValue({}),
    executeRaw: jest.fn().mockResolvedValue(1)
  },
  PrismaService: {
    getInstance: jest.fn(() => ({
      getClient: jest.fn(() => mockPrismaInstance),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isDbConnected: jest.fn(() => true),
      healthCheck: jest.fn().mockResolvedValue(true),
      transaction: jest.fn((fn) => fn(mockPrismaInstance)),
      queryRaw: jest.fn().mockResolvedValue({}),
      executeRaw: jest.fn().mockResolvedValue(1)
    }))
  }
}));

// Mock the generated Prisma client
jest.mock('./generated/prisma', () => ({
  PrismaClient: jest.fn(() => mockPrismaInstance)
}));

global.console.log = () => {};

// 設置模組別名解析
const path = require('path');

// 讓 Node.js 能夠解析 @ 別名
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  // 檢查請求的模組名稱是否符合任何別名
  const pattern = '^@/(.*)$';
  const regex = new RegExp(pattern);
  if (regex.test(request)) {
    // 替換模組名稱中的別名
    const newRequest = request.replace(regex, path.resolve(__dirname, 'src/$1'));
    return originalResolveFilename.call(this, newRequest, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};