/**
 * Enhanced Test Utilities and Helpers
 * Provides comprehensive testing utilities with type safety and parameter order validation
 */

import { Response, NextFunction } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { Socket } from 'net';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserJwtPayload } from '../types/auth.types';

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
    user: options.user as UserJwtPayload | undefined,
    isTemporary: options.isTemporary || false,
    body: options.body || {} as Record<string, unknown>,
    params: options.params as ParamsDictionary || {},
    query: (options.query || {}) as ParsedQs,
    url: '/test',
    method: 'GET',
    originalUrl: '/test',
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' } as unknown as Socket,
    isAuthenticated: (function(this: Express.Request): this is Express.AuthenticatedRequest { return !!this.user; }),
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
export const createTestUserPayload = (overrides: Record<string, unknown> = {}): UserJwtPayload => {
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
export const createTestTempUserPayload = (overrides: Record<string, unknown> = {}): UserJwtPayload => {
  return {
    id: 1,
    username: 'tempuser',
    email: 'temp@example.com',
    isTemp: true,
    ...overrides
  };
};

/**
 * 建立完整的 Prisma 用戶模擬物件
 * 返回類型兼容 Prisma users.findUnique 的返回值
 */
export const createMockPrismaUser = (overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> => {
  const now = new Date();
  const mockUser = {
    id: 1,
    external_id: 'test-external-id',
    mongo_id: null,
    gender: null,
    language: null,
    education_stage: 'other' as const,
    tag_list: [],
    contact_id: 1,
    is_open_location: null,
    location_id: null,
    nickname: 'testuser',
    role_id: 1,
    is_open_profile: null,
    birth_date: null,
    basic_info_id: null,
    createdDate: now,
    updatedDate: now,
    created_by: null,
    created_at: now,
    updated_by: null,
    updated_at: now,
    email_verified: false,
    email_verified_at: null,
    is_active: true,
    // Relations
    contacts: {
      id: 1,
      google_id: null,
      photo_url: null,
      is_subscribe_email: null,
      email: 'test@example.com',
      ig: null,
      discord: null,
      line: null,
      fb: null
    },
    roles: {
      id: 1,
      name: 'user',
      description: null
    },
    user_positions: [] as Array<{
      user_id: number;
      position_id: number;
      position: { name: string; id: number };
    }>,
    location: null,
    ...overrides
  };
  // 返回 mock 用戶，使用工具類型確保類型安全
  return mockUser;
};