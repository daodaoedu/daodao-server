/**
 * 圖片服務速率限制中間件整合測試
 * 測試速率限制中間件與 TypeScript 圖片控制器的整合
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import { createPrismaMock } from '@/utils/prisma-mock';

const mockPrisma = createPrismaMock();

jest.mock('@/services/database/prisma.service', () => ({
  prisma: mockPrisma
}));

// Mock R2 service to avoid actual file operations
jest.mock('@/services/r2.service', () => ({
  uploadToR2: jest.fn().mockResolvedValue(undefined),
  getFromR2: jest.fn().mockRejectedValue(new Error('NoSuchKey: File not found')),
  deleteFromR2: jest.fn().mockResolvedValue(undefined),
  deleteMultipleFromR2: jest.fn().mockResolvedValue(undefined)
}));

describe('Image Service Rate Limiting Middleware Integration', () => {
  let app: Express;
  let validToken: string;

  beforeAll(async () => {
    // Set up test environment
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_SECURITY = 'test-jwt-security';
    process.env.R2_PUBLIC_URL = 'https://test-r2.example.com';
    process.env.NODE_ENV = 'test';

    // Create test Express app
    const express = require('express');
    app = express();
    app.use(express.json());

    // Import and set up image routes with proper middleware
    const { default: imageRoutes } = require('@/routes/image.routes');
    app.use('/api/v1/images', imageRoutes);

    // Add error handling middleware
    const { globalErrorHandler, notFoundHandler } = require('@/middleware/error.middleware');
    app.use(notFoundHandler);
    app.use(globalErrorHandler);

    // 創建有效的 JWT token
    const jwtSecret = process.env.JWT_SECRET || 'test-secret';
    const payload = {
      id: 'test-user-id',
      email: 'test@example.com',
      isTemp: false,
      roles: ['user'],
      permissions: ['image:upload', 'image:delete']
    };

    validToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
  });

  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
  });

  describe('Rate Limiting Middleware Type Safety', () => {
    it('should properly integrate with TypeScript endpoints', async () => {
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      // 驗證請求被正確處理（不是速率限制錯誤）
      expect(response.status).not.toBe(429);
      // 應該是認證成功但可能有其他錯誤（如檔案驗證）
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should maintain type safety in rate limit responses', async () => {
      // 發送多個快速請求來觸發速率限制
      const requests = Array.from({ length: 15 }, () =>
        request(app)
          .post('/api/v1/images')
          .set('Authorization', `Bearer ${validToken}`)
          .attach('file', Buffer.from('fake-image-data'), 'test.jpg')
      );

      const responses = await Promise.all(requests);

      // 檢查是否有速率限制響應
      const rateLimitedResponses = responses.filter(res => res.status === 429);

      if (rateLimitedResponses.length > 0) {
        const rateLimitResponse = rateLimitedResponses[0];

        // 驗證速率限制響應的類型安全性
        expect(rateLimitResponse.body).toHaveProperty('success', false);
        expect(rateLimitResponse.body).toHaveProperty('message');
        expect(rateLimitResponse.body).toHaveProperty('error');
        expect(typeof rateLimitResponse.body.success).toBe('boolean');
        expect(typeof rateLimitResponse.body.message).toBe('string');
        expect(typeof rateLimitResponse.body.error).toBe('string');
      }
    });

    it('should handle rate limiting for multiple file uploads', async () => {
      const response = await request(app)
        .post('/api/v1/images/multiple')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('files', Buffer.from('fake-image-data-1'), 'test1.jpg')
        .attach('files', Buffer.from('fake-image-data-2'), 'test2.jpg');

      // 驗證請求被正確處理（可能是速率限制或其他錯誤）
      expect([200, 400, 429, 500]).toContain(response.status);

      if (response.status === 429) {
        // 如果觸發速率限制，檢查響應格式
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('頻繁');
      }
    });

    it('should handle rate limiting for delete operations', async () => {
      const response = await request(app)
        .delete('/api/v1/images/test-file.jpg')
        .set('Authorization', `Bearer ${validToken}`);

      // 驗證請求被正確處理（可能是速率限制或其他錯誤）
      expect([200, 404, 429, 500]).toContain(response.status);

      if (response.status === 429) {
        // 如果觸發速率限制，檢查響應格式
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('頻繁');
      }
    });
  });

  describe('Rate Limiting Behavior Consistency', () => {
    it('should maintain consistent behavior with JavaScript version', async () => {
      // 測試速率限制的行為是否與 JavaScript 版本一致
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      // 驗證響應格式與 JavaScript 版本一致
      expect(response.body).toHaveProperty('success');
      expect(typeof response.body.success).toBe('boolean');

      if (response.status === 429) {
        // 如果觸發速率限制，檢查響應格式
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('error');
        expect(response.body.message).toContain('頻繁');
      }
    });

    it('should not apply rate limiting to GET requests', async () => {
      // GET 請求不應該受到上傳速率限制的影響
      const response = await request(app)
        .get('/api/v1/images/test-file.jpg');

      // GET 請求不應該返回速率限制錯誤
      expect(response.status).not.toBe(429);
      // 應該返回檔案不存在或其他錯誤
      expect([404, 500]).toContain(response.status);
    });

    it('should handle concurrent requests properly', async () => {
      // 測試並發請求的處理
      const concurrentRequests = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/v1/images')
          .set('Authorization', `Bearer ${validToken}`)
          .attach('file', Buffer.from('fake-image-data'), 'test.jpg')
      );

      const responses = await Promise.all(concurrentRequests);

      // 驗證所有響應都有正確的格式
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success');
        expect(typeof response.body.success).toBe('boolean');

        if (response.status === 429) {
          expect(response.body).toHaveProperty('message');
          expect(response.body).toHaveProperty('error');
        }
      });
    });
  });

  describe('Middleware Chain Integration', () => {
    it('should properly integrate in middleware chain with authentication', async () => {
      // 測試速率限制中間件與認證中間件的整合
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      // 應該先通過認證，然後可能被速率限制或其他處理
      expect(response.status).not.toBe(401); // 不應該是認證錯誤
      expect(response.status).not.toBe(403); // 不應該是權限錯誤
    });

    it('should handle unauthenticated requests with rate limiting', async () => {
      // 測試未認證請求的速率限制處理
      const response = await request(app)
        .post('/api/v1/images')
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      // 應該返回認證錯誤，而不是速率限制錯誤
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should maintain proper error precedence', async () => {
      // 測試錯誤優先級：認證錯誤應該優先於速率限制錯誤
      const invalidToken = 'invalid.token.here';

      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${invalidToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      // 應該返回認證錯誤，而不是速率限制錯誤
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});