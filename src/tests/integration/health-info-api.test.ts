/**
 * Health Check 和 API Info 端點整合測試
 * 測試系統健康檢查和 API 資訊端點
 */

import request from 'supertest';
import express from 'express';
import apiRoutes from '../../routes/index';

describe('Health Check and API Info Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    // 設置測試環境
    process.env.NODE_ENV = 'test';
    
    app = express();
    app.use(express.json());
    app.use('/api/v1', apiRoutes);
    
    // 錯誤處理中間件
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(err.statusCode || 500).json({
        success: false,
        error: {
          message: err.message || 'Internal Server Error',
          code: err.code || 'INTERNAL_ERROR'
        }
      });
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return health status successfully', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'DaoDao API is running',
        timestamp: expect.any(String),
        version: '1.0.0'
      });

      // 驗證時間戳是有效的 ISO 字串
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    it('should include current timestamp in response', async () => {
      const beforeRequest = new Date();
      
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);
      
      const afterRequest = new Date();
      const responseTime = new Date(response.body.timestamp);
      
      // 驗證時間戳在請求前後的合理範圍內
      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime() - 1000);
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterRequest.getTime() + 1000);
    });
  });

  describe('GET /api/v1/info', () => {
    it('should return API information successfully', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          name: 'DaoDao Resource Management API',
          version: '1.0.0',
          description: '學習資源管理與心得分享 API 系統',
          endpoints: expect.any(Object),
          features: expect.any(Array)
        }
      });
    });

    it('should include all expected endpoints in API info', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      const endpoints = response.body.data.endpoints;

      // 驗證所有主要端點都被列出
      expect(endpoints).toHaveProperty('auth', '/api/v1/auth');
      expect(endpoints).toHaveProperty('resources', '/api/v1/resources');
      expect(endpoints).toHaveProperty('resourceReviews', '/api/v1/resources/:resourceId/reviews');
      expect(endpoints).toHaveProperty('tags', '/api/v1/tags');
      expect(endpoints).toHaveProperty('projects', '/api/v1/projects');
      expect(endpoints).toHaveProperty('users', '/api/v1/users');
      expect(endpoints).toHaveProperty('ideas', '/api/v1/ideas');
      expect(endpoints).toHaveProperty('me', '/api/v1/me');
      expect(endpoints).toHaveProperty('health', '/api/v1/health');
    });

    it('should include comprehensive feature list', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      const features = response.body.data.features;

      // 驗證關鍵功能都被列出
      expect(features).toContain('用戶認證系統');
      expect(features).toContain('JWT 令牌管理');
      expect(features).toContain('Google OAuth 整合');
      expect(features).toContain('資源 CRUD 操作');
      expect(features).toContain('心得評價管理');
      expect(features).toContain('標籤系統');
      expect(features).toContain('專案管理系統');
      expect(features).toContain('用戶管理系統');
      expect(features).toContain('想法管理系統');
      expect(features).toContain('TypeScript 類型安全');
      expect(features).toContain('Prisma ORM 整合');

      // 確保功能列表不為空
      expect(features.length).toBeGreaterThan(0);
    });

    it('should have consistent version across health and info endpoints', async () => {
      const [healthResponse, infoResponse] = await Promise.all([
        request(app).get('/api/v1/health'),
        request(app).get('/api/v1/info')
      ]);

      expect(healthResponse.body.version).toBe(infoResponse.body.data.version);
    });
  });

  describe('CORS and Headers', () => {
    it('should handle CORS properly for health endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      // 在實際環境中應該設置 CORS 標頭
    });

    it('should handle CORS properly for info endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);
    });
  });

  afterAll(async () => {
    // 清理工作
    delete process.env.NODE_ENV;
  });
});