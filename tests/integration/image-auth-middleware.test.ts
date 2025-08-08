/**
 * 圖片服務認證中間件整合測試
 * 測試認證中間件與 TypeScript 圖片控制器的整合
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

describe('Image Service Authentication Middleware Integration', () => {
  let app: Express;
  let validToken: string;
  let expiredToken: string;
  let invalidToken: string;

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
    expiredToken = jwt.sign(payload, jwtSecret, { expiresIn: '-1h' });
    invalidToken = 'invalid.token.here';
  });

  describe('Authentication Middleware Type Compatibility', () => {
    it('should properly type the request object with user information', async () => {
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      // 驗證請求被正確處理（即使沒有實際檔案上傳）
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should preserve request context through middleware chain', async () => {
      const response = await request(app)
        .delete('/api/v1/images/test-file.jpg')
        .set('Authorization', `Bearer ${validToken}`);

      // 驗證認證中間件正確傳遞請求上下文
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .post('/api/v1/images')
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should handle expired JWT tokens', async () => {
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${expiredToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('過期');
    });

    it('should handle invalid JWT tokens', async () => {
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${invalidToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('無效');
    });
  });

  describe('Request Context Preservation', () => {
    it('should preserve user information in upload requests', async () => {
      // 模擬一個會檢查用戶信息的請求
      const response = await request(app)
        .post('/api/v1/images/multiple')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('files', Buffer.from('fake-image-data-1'), 'test1.jpg')
        .attach('files', Buffer.from('fake-image-data-2'), 'test2.jpg');

      // 驗證認證成功且請求被處理
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should preserve user information in delete requests', async () => {
      const response = await request(app)
        .delete('/api/v1/images/test-file.jpg')
        .set('Authorization', `Bearer ${validToken}`);

      // 驗證認證成功且請求被處理
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should not require authentication for image retrieval', async () => {
      const response = await request(app)
        .get('/api/v1/images/test-file.jpg');

      // GET 請求不需要認證，應該不會返回 401
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      // Should return 404 or 500 (file not found or service error) but not auth errors
    }, 10000);
  });

  describe('TypeScript Type Safety', () => {
    it('should handle typed request objects correctly', async () => {
      // 測試 TypeScript 類型安全性 - 沒有檔案的請求
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Content-Type', 'multipart/form-data');

      // 驗證類型安全的錯誤處理 - 應該返回 400 (沒有檔案) 或其他錯誤
      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should maintain type safety in error responses', async () => {
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', 'Bearer malformed-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.error.message).toBe('string');
    });
  });
});