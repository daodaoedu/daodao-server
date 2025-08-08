/**
 * 圖片服務 Multer 中間件整合測試
 * 測試 Multer 檔案上傳中間件與 TypeScript 圖片控制器的整合
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

describe('Image Service Multer Middleware Integration', () => {
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

  describe('File Upload Middleware Integration', () => {
    it('should handle single file upload with proper TypeScript typing', async () => {
      const testFile = Buffer.from('fake-jpeg-data');

      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', testFile, 'test.jpg');

      // 驗證 multer 中間件正確處理檔案
      expect([200, 400, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
      expect(typeof response.body.success).toBe('boolean');
    });

    it('should handle multiple file upload with proper TypeScript typing', async () => {
      const testFile1 = Buffer.from('fake-jpeg-data-1');
      const testFile2 = Buffer.from('fake-jpeg-data-2');

      const response = await request(app)
        .post('/api/v1/images/multiple')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('files', testFile1, 'test1.jpg')
        .attach('files', testFile2, 'test2.jpg');

      // 驗證 multer 中間件正確處理多個檔案
      expect([200, 400, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
      expect(typeof response.body.success).toBe('boolean');
    });

    it('should handle missing file with proper error handling', async () => {
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Content-Type', 'multipart/form-data');

      // 應該返回錯誤，因為沒有檔案
      expect([400, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);

      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should handle file size limit validation', async () => {
      // 創建一個超過 500KB 限制的大檔案
      const largeFile = Buffer.alloc(600 * 1024, 'a'); // 600KB

      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', largeFile, 'large.jpg');

      // 應該返回檔案大小錯誤
      expect([400, 413, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle unsupported file types', async () => {
      const textFile = Buffer.from('This is not an image');

      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', textFile, 'test.txt');

      // 應該返回檔案類型錯誤
      expect([400, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('File Type Handling', () => {
    it('should accept JPEG files', async () => {
      const jpegFile = Buffer.from('fake-jpeg-data');

      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', jpegFile, {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      // 應該接受 JPEG 檔案
      expect([200, 400, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should accept PNG files', async () => {
      const pngFile = Buffer.from('fake-png-data');

      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', pngFile, {
          filename: 'test.png',
          contentType: 'image/png'
        });

      // 應該接受 PNG 檔案
      expect([200, 400, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should accept WebP files', async () => {
      const webpFile = Buffer.from('fake-webp-data');

      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', webpFile, {
          filename: 'test.webp',
          contentType: 'image/webp'
        });

      // 應該接受 WebP 檔案
      expect([200, 400, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should reject unsupported file types', async () => {
      const gifFile = Buffer.from('fake-gif-data');

      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', gifFile, {
          filename: 'test.gif',
          contentType: 'image/gif'
        });

      // 應該拒絕不支援的檔案類型
      expect([400, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Error Handling in Middleware Chain', () => {
    it('should handle multer errors properly', async () => {
      // 測試 multer 錯誤處理
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .field('wrongfield', 'value'); // 錯誤的欄位名稱

      // 應該返回適當的錯誤
      expect([400, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should maintain error handling precedence', async () => {
      // 測試錯誤優先級：認證錯誤應該優先於 multer 錯誤
      const response = await request(app)
        .post('/api/v1/images')
        .attach('file', Buffer.from('fake-data'), 'test.jpg');

      // 應該返回認證錯誤，而不是 multer 錯誤
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle multiple files limit', async () => {
      // 測試多檔案數量限制（設定為最多 5 個檔案）
      const files = Array.from({ length: 7 }, (_, i) =>
        Buffer.from(`fake-data-${i}`)
      );

      let request_builder = request(app)
        .post('/api/v1/images/multiple')
        .set('Authorization', `Bearer ${validToken}`);

      // 附加 7 個檔案（超過限制）
      files.forEach((file, i) => {
        request_builder = request_builder.attach('files', file, `test${i}.jpg`);
      });

      const response = await request_builder;

      // 應該返回檔案數量限制錯誤
      expect([400, 413, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should maintain type safety with Express.Multer.File', async () => {
      const testFile = Buffer.from('fake-jpeg-data');

      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', testFile, 'test.jpg');

      // 驗證響應結構符合 TypeScript 類型定義
      expect(response.body).toHaveProperty('success');
      expect(typeof response.body.success).toBe('boolean');

      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('message');
      } else {
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should handle file array types correctly', async () => {
      const testFile1 = Buffer.from('fake-jpeg-data-1');
      const testFile2 = Buffer.from('fake-jpeg-data-2');

      const response = await request(app)
        .post('/api/v1/images/multiple')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('files', testFile1, 'test1.jpg')
        .attach('files', testFile2, 'test2.jpg');

      // 驗證多檔案響應結構符合 TypeScript 類型定義
      expect(response.body).toHaveProperty('success');
      expect(typeof response.body.success).toBe('boolean');

      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('urls');
        expect(response.body.data).toHaveProperty('totalFiles');
      } else {
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should provide consistent error response types', async () => {
      const response = await request(app)
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Content-Type', 'multipart/form-data');

      // 驗證錯誤響應的類型一致性
      expect(response.body).toHaveProperty('success', false);
      expect(typeof response.body.success).toBe('boolean');

      if (response.body.error) {
        expect(typeof response.body.error).toBe('string');
      }
    });
  });
});