/**
 * API 端點基礎測試
 * 測試所有 API 端點的基本連通性
 */

// 設置測試環境變數（在任何導入之前）
process.env.NODE_ENV = 'test';
process.env.EMAIL_ADDRESS = 'test@example.com';
process.env.EMAIL_PASSWORD = 'test_password';
process.env.JWT_SECRET = 'test_secret';
process.env.SESSION_SECRET = 'test_session_secret';
process.env.GOOGLE_CLIENT_ID = 'test_client_id';
process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';

import request from 'supertest';
import express from 'express';
import apiRoutes from '@/routes/index';

describe('API Endpoints Basic Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    // 設置測試所需的環境變數
    process.env.EMAIL_ADDRESS = 'test@example.com';
    process.env.EMAIL_PASSWORD = 'test_password';
    process.env.JWT_SECRET = 'test_secret';
    process.env.SESSION_SECRET = 'test_session_secret';
    
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

  describe('Health Check and Info Endpoints', () => {
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
    });

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

      // 驗證端點列表
      const endpoints = response.body.data.endpoints;
      expect(endpoints).toHaveProperty('auth', '/api/v1/auth');
      expect(endpoints).toHaveProperty('resources', '/api/v1/resources');
      expect(endpoints).toHaveProperty('ideas', '/api/v1/ideas');
      expect(endpoints).toHaveProperty('me', '/api/v1/me');
    });
  });

  describe('Route Registration Verification', () => {
    it('should have Ideas API routes registered', async () => {
      // 測試 GET /api/v1/ideas (可能會返回錯誤，但不應該是 404)
      const response = await request(app)
        .get('/api/v1/ideas');
      
      // 不應該是 404 Not Found
      expect(response.status).not.toBe(404);
    });

    it('should have Me API routes registered', async () => {
      // 測試 GET /api/v1/me/ideas (可能會返回錯誤，但不應該是 404)
      const response = await request(app)
        .get('/api/v1/me/ideas');
      
      // 不應該是 404 Not Found  
      expect(response.status).not.toBe(404);
    });

    it('should have Auth API routes registered', async () => {
      const response = await request(app)
        .get('/api/v1/auth/google');
      
      // 不應該是 404 Not Found
      expect(response.status).not.toBe(404);
    });

    it('should have Resources API routes registered', async () => {
      const response = await request(app)
        .get('/api/v1/resources');
      
      // 不應該是 404 Not Found
      expect(response.status).not.toBe(404);
    });

    it('should have Tags API routes registered', async () => {
      const response = await request(app)
        .get('/api/v1/tags/popular');
      
      // 不應該是 404 Not Found
      expect(response.status).not.toBe(404);
    });

    it('should have Projects API routes registered', async () => {
      const response = await request(app)
        .get('/api/v1/projects');
      
      // 不應該是 404 Not Found
      expect(response.status).not.toBe(404);
    });

    it('should have Users API routes registered', async () => {
      const response = await request(app)
        .get('/api/v1/users');
      
      // 不應該是 404 Not Found
      expect(response.status).not.toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/resources')
        .send('invalid json')
        .set('Content-Type', 'application/json');
      
      // Should not crash the server
      expect([400, 401, 403, 500]).toContain(response.status);
    });
  });

  afterAll(async () => {
    delete process.env.NODE_ENV;
    delete process.env.EMAIL_ADDRESS;
    delete process.env.EMAIL_PASSWORD;
    delete process.env.JWT_SECRET;
    delete process.env.SESSION_SECRET;
  });
});