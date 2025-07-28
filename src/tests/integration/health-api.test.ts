/**
 * Health Check 和 Info API 整合測試
 * 測試系統健康檢查和 API 資訊端點
 */

import request from 'supertest';
import express from 'express';

describe('Health Check and Info API Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    // 設置測試應用
    app = express();
    app.use(express.json());
    
    // 導入主路由
    const mainRoutes = require('../../routes/index').default;
    app.use('/api/v1', mainRoutes);
    
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

      // 驗證時間戳格式
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return consistent structure', async () => {
      const response1 = await request(app).get('/api/v1/health');
      const response2 = await request(app).get('/api/v1/health');

      // 結構應該一致
      expect(Object.keys(response1.body)).toEqual(Object.keys(response2.body));
      expect(response1.body.success).toBe(response2.body.success);
      expect(response1.body.message).toBe(response2.body.message);
      expect(response1.body.version).toBe(response2.body.version);
    });

    it('should have proper response headers', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
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

    it('should include all expected endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      const expectedEndpoints = {
        auth: '/api/v1/auth',
        resources: '/api/v1/resources',
        resourceReviews: '/api/v1/resources/:resourceId/reviews',
        tags: '/api/v1/tags',
        projects: '/api/v1/projects',
        users: '/api/v1/users',
        ideas: '/api/v1/ideas',
        me: '/api/v1/me',
        health: '/api/v1/health'
      };

      expect(response.body.data.endpoints).toMatchObject(expectedEndpoints);
    });

    it('should include expected features list', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      const expectedFeatures = [
        '用戶認證系統',
        'JWT 令牌管理',
        'Google OAuth 整合',
        '資源 CRUD 操作',
        '心得評價管理',
        '標籤系統',
        '專案管理系統',
        '用戶管理系統',
        '想法管理系統',
        '留言系統',
        '個人 API 端點',
        '巢狀路由支援',
        '分頁查詢',
        '複雜過濾條件',
        'TypeScript 類型安全',
        'Prisma ORM 整合'
      ];

      expect(response.body.data.features).toEqual(expect.arrayContaining(expectedFeatures));
      expect(response.body.data.features.length).toBe(expectedFeatures.length);
    });

    it('should have consistent data structure', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      // 驗證必要的屬性存在
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('endpoints');
      expect(response.body.data).toHaveProperty('features');

      // 驗證數據類型
      expect(typeof response.body.data.name).toBe('string');
      expect(typeof response.body.data.version).toBe('string');
      expect(typeof response.body.data.description).toBe('string');
      expect(typeof response.body.data.endpoints).toBe('object');
      expect(Array.isArray(response.body.data.features)).toBe(true);
    });

    it('should have proper response headers', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('API Information Accuracy', () => {
    it('should list all registered routes correctly', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      const endpoints = response.body.data.endpoints;

      // 驗證每個端點的格式
      Object.values(endpoints).forEach((endpoint: any) => {
        expect(typeof endpoint).toBe('string');
        expect(endpoint).toMatch(/^\/api\/v1\//);
      });
    });

    it('should reflect current API capabilities', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      const features = response.body.data.features;

      // 確保包含核心功能
      expect(features).toContain('TypeScript 類型安全');
      expect(features).toContain('Prisma ORM 整合');
      expect(features).toContain('想法管理系統');
      expect(features).toContain('個人 API 端點');
    });
  });

  describe('Error Handling', () => {
    it('should handle health check gracefully even with errors', async () => {
      // Health check 應該總是返回 200，即使有內部問題
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle info endpoint gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should respond to health check quickly', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/health')
        .expect(200);
      
      const duration = Date.now() - startTime;
      
      // Health check 應該在 100ms 內回應
      expect(duration).toBeLessThan(100);
    });

    it('should respond to info request quickly', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/info')
        .expect(200);
      
      const duration = Date.now() - startTime;
      
      // Info endpoint 應該在 100ms 內回應
      expect(duration).toBeLessThan(100);
    });
  });
});