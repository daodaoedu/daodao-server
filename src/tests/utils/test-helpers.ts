/**
 * 測試通用工具函數
 * 提供常用的測試模擬和工具函數
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../../types/auth.types';

// Mock JWT secret for testing
export const TEST_JWT_SECRET = 'test-jwt-secret';

/**
 * 建立模擬的 Request 物件
 */
export const createMockRequest = (options: {
  headers?: Record<string, string>;
  user?: Record<string, unknown>;
  isTemporary?: boolean;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
} = {}): Partial<AuthRequest> => {
  return {
    headers: options.headers || {},
    user: options.user,
    isTemporary: options.isTemporary || false,
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    url: '/test',
    method: 'GET',
    originalUrl: '/test',
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' } as any,
  };
};

/**
 * 建立模擬的 Response 物件
 */
export const createMockResponse = (): Partial<Response> => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
};

/**
 * 建立模擬的 NextFunction
 */
export const createMockNext = (): jest.MockedFunction<NextFunction> => {
  return jest.fn();
};

/**
 * 生成測試用的 JWT Token
 */
export const generateTestToken = (payload: Record<string, unknown>, secret: string = TEST_JWT_SECRET, options?: jwt.SignOptions): string => {
  return jwt.sign(payload, secret, options);
};

/**
 * 建立有效的認證 Header
 */
export const createAuthHeader = (token: string): { authorization: string } => {
  return { authorization: `Bearer ${token}` };
};

/**
 * 建立測試用戶 Payload
 */
export const createTestUserPayload = (overrides: Record<string, unknown> = {}) => {
  return {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    isTemp: false,
    ...overrides
  };
};

/**
 * 建立測試用臨時用戶 Payload
 */
export const createTestTempUserPayload = (overrides: Record<string, unknown> = {}) => {
  return {
    id: 1,
    username: 'tempuser',
    email: 'temp@example.com',
    isTemp: true,
    ...overrides
  };
};

/**
 * 測試環境設定工具
 */
export const setupTestEnvironment = (envVars: Record<string, string>) => {
  const originalEnv = process.env;
  
  // 設定環境變數
  Object.keys(envVars).forEach(key => {
    process.env[key] = envVars[key];
  });
  
  // 返回清理函數
  return () => {
    process.env = originalEnv;
  };
};

/**
 * 驗證錯誤類型的工具函數
 */
export const expectErrorType = (error: unknown, expectedType: new (...args: unknown[]) => Error) => {
  expect(error).toBeInstanceOf(expectedType);
  return error;
};

/**
 * 驗證 HTTP 狀態碼
 */
export const expectStatusCode = (mockResponse: Partial<Response>, expectedStatus: number) => {
  expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
};

/**
 * 驗證 JSON 回應
 */
export const expectJsonResponse = (mockResponse: Partial<Response>, expectedData: unknown) => {
  expect(mockResponse.json).toHaveBeenCalledWith(expectedData);
};

/**
 * 建立測試用的 Express App Mock
 */
export const createMockApp = () => {
  const app = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    listen: jest.fn(),
  };
  
  return app;
};

/**
 * 非同步測試工具
 */
export const asyncTestWrapper = (fn: () => Promise<void>) => {
  return async () => {
    await fn();
  };
};

/**
 * 測試計時工具
 */
export const timeTest = async (testFn: () => Promise<void> | void): Promise<number> => {
  const start = Date.now();
  await testFn();
  return Date.now() - start;
};

/**
 * 建立測試用的 Prisma Mock
 */
export const createPrismaMock = () => {
  return {
    users: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    contacts: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    temp_users: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
};

/**
 * 建立測試用的 Email Service Mock
 */
export const createEmailServiceMock = () => {
  return {
    sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
    sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    sendNotificationEmail: jest.fn().mockResolvedValue({ success: true }),
  };
};

/**
 * 建立測試用的 Permission Service Mock
 */
export const createPermissionServiceMock = () => {
  return {
    getUserRoles: jest.fn().mockResolvedValue([]),
    getUserPermissions: jest.fn().mockResolvedValue([]),
    hasPermission: jest.fn().mockResolvedValue(true),
    hasRole: jest.fn().mockResolvedValue(true),
  };
};

/**
 * 測試資料產生器
 */
export const TestDataGenerator = {
  /**
   * 生成隨機字串
   */
  randomString: (length: number = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * 生成隨機 Email
   */
  randomEmail: (): string => {
    return `${TestDataGenerator.randomString(8)}@example.com`;
  },

  /**
   * 生成隨機數字
   */
  randomNumber: (min: number = 1, max: number = 1000): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * 生成隨機日期
   */
  randomDate: (start: Date = new Date('2020-01-01'), end: Date = new Date()): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },
};

/**
 * 常用的測試斷言工具
 */
export const TestAssertions = {
  /**
   * 驗證函數被調用
   */
  toHaveBeenCalled: (mockFn: jest.MockedFunction<unknown>) => {
    expect(mockFn).toHaveBeenCalled();
  },

  /**
   * 驗證函數被調用特定次數
   */
  toHaveBeenCalledTimes: (mockFn: jest.MockedFunction<unknown>, times: number) => {
    expect(mockFn).toHaveBeenCalledTimes(times);
  },

  /**
   * 驗證函數被調用時的參數
   */
  toHaveBeenCalledWith: (mockFn: jest.MockedFunction<unknown>, ...args: unknown[]) => {
    expect(mockFn).toHaveBeenCalledWith(...args);
  },

  /**
   * 驗證物件包含特定屬性
   */
  toHaveProperty: (obj: Record<string, unknown>, property: string, value?: unknown) => {
    if (value !== undefined) {
      expect(obj).toHaveProperty(property, value);
    } else {
      expect(obj).toHaveProperty(property);
    }
  },

  /**
   * 驗證陣列包含特定元素
   */
  toContain: (array: unknown[], element: unknown) => {
    expect(array).toContain(element);
  },

  /**
   * 驗證值為真
   */
  toBeTruthy: (value: unknown) => {
    expect(value).toBeTruthy();
  },

  /**
   * 驗證值為假
   */
  toBeFalsy: (value: unknown) => {
    expect(value).toBeFalsy();
  },
};