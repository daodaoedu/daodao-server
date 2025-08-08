/**
 * 資源控制器測試
 * 基於 Prisma 架構的現代化 TypeScript 測試
 */

import request from 'supertest';
import express from 'express';
import resourceController from '@/controllers/resource.controller';
import resourceService from '@/services/resource.service';
import tagService from '@/services/tag.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/utils/error-handler';
import type { ResourceResponse } from '@/types/resource.types';
import type { AuthRequest } from '@/types/auth.types';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createTestUserPayload,
  generateTestToken,
  createAuthHeader,
  TestDataGenerator
} from '../../utils/test-helpers';

// 模擬服務
jest.mock('@/services/resource.service', () => ({
  __esModule: true,
  default: {
    getResources: jest.fn(),
    getResourceById: jest.fn(),
    createResource: jest.fn(),
    updateResource: jest.fn(),
    deleteResource: jest.fn(),
    getResourceStats: jest.fn()
  }
}));

jest.mock('@/services/tag.service', () => ({
  __esModule: true,
  default: {
    getEntityTags: jest.fn(),
    setEntityTags: jest.fn()
  }
}));

// 模擬驗證器
jest.mock('@/validators/resource.validator', () => ({
  validateCreateResource: jest.fn(),
  validateUpdateResource: jest.fn(),
  validateUpdateResourceStatus: jest.fn()
}));

// 創建測試用的 Express 應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 模擬認證中間件
  app.use((req: any, res: any, next: any) => {
    if (req.headers.authorization) {
      req.user = {
        id: 1,
        username: 'testuser',
        roles: ['user']
      };
    } else if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === undefined) {
      // 在開發環境下，即使沒有 auth header 也設定測試用戶
      req.user = {
        id: 1,
        username: 'test_user_for_swagger',
        roles: ['user']
      };
    }
    next();
  });
  
  // 設置路由
  app.get('/resources', resourceController.getResources);
  app.get('/resources/:id', resourceController.getResourceById);
  app.get('/resources/:id/tags', resourceController.getResourceTags);
  app.post('/resources', resourceController.createResource);
  app.patch('/resources/:id', resourceController.updateResource);
  app.patch('/resources/:id/status', resourceController.updateResourceStatus);
  app.delete('/resources/:id', resourceController.deleteResource);
  
  // 錯誤處理中間件
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof BadRequestError) {
      res.status(400).json({ success: false, error: { message: err.message } });
    } else if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { message: err.message } });
    } else if (err instanceof ForbiddenError) {
      res.status(403).json({ success: false, error: { message: err.message } });
    } else if (err.name === 'ZodError') {
      // 處理 Zod 驗證錯誤
      res.status(400).json({ success: false, error: { message: '驗證失敗', details: err.errors } });
    } else {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });
  
  return app;
};

// 測試資料 - 符合當前 ResourceResponse 介面
const mockResource: ResourceResponse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: '測試資源',
  url: 'https://example.com',
  imageUrl: 'https://example.com/image.jpg',
  description: '這是一個測試資源',
  videoUrl: null,
  type: 'books_articles',
  cost: 'free',
  level: 'beginner',
  status: 'active',
  avgRating: 4.5,
  majorCategory: 'Programming',
  subCategory: 'JavaScript',
  user: {
    id: 1,
    name: 'TestUser',
    _id: 'user-uuid',
    roleList: ['user'],
    photoURL: null,
    educationStage: null,
    tagList: [],
    selfIntroduction: null
  },
  tags: ['javascript', 'react'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  viewCount: 0,
  favoriteCount: 0,
  shareCount: 0,
  reviewCount: 0,
  likeCount: 0
};

describe('ResourceController', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
    
    // 設置環境變數為開發模式
    process.env.NODE_ENV = 'dev';
  });

  afterEach(() => {
    // 清理環境變數
    delete process.env.NODE_ENV;
  });

  describe('GET /resources', () => {
    it('應該成功獲取資源列表（無篩選條件）', async () => {
      const mockResponse = {
        resources: [mockResource],
        pagination: {
          cursors: { start: null, end: null },
          hasMore: false,
          count: 1
        }
      };
      (resourceService.getResources as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/resources')
        .expect(200);

      expect(resourceService.getResources).toHaveBeenCalledWith({}, {});
      expect(response.body).toEqual({
        success: true,
        data: mockResponse
      });
    });

    it('應該正確處理分頁參數', async () => {
      const mockResponse = {
        resources: [],
        pagination: {
          cursors: { start: null, end: null },
          hasMore: false,
          count: 0
        }
      };
      (resourceService.getResources as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/resources?limit=10&cursor=test-cursor&sort=updated_at&order=asc')
        .expect(200);

      expect(resourceService.getResources).toHaveBeenCalledWith(
        {},
        {
          cursor: 'test-cursor',
          limit: 10,
          sort: 'updated_at',
          order: 'asc'
        }
      );
    });

    it('應該正確處理篩選參數', async () => {
      const mockResponse = {
        resources: [],
        pagination: {
          cursors: { start: null, end: null },
          hasMore: false,
          count: 0
        }
      };
      (resourceService.getResources as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/resources?type=books_articles&cost=free&level=beginner&majorCategory=programming&subCategory=javascript&query=react&tags=javascript,react')
        .expect(200);

      expect(resourceService.getResources).toHaveBeenCalledWith(
        {
          type: 'books_articles',
          cost: 'free',
          level: 'beginner',
          majorCategory: 'programming',
          subCategory: 'javascript',
          query: 'react',
          tags: ['javascript', 'react']
        },
        {}
      );
    });

    it('應該正確處理標籤參數（逗號分隔）', async () => {
      const mockResponse = {
        resources: [],
        pagination: {
          cursors: { start: null, end: null },
          hasMore: false,
          count: 0
        }
      };
      (resourceService.getResources as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/resources?tags=javascript,react,typescript')
        .expect(200);

      expect(resourceService.getResources).toHaveBeenCalledWith(
        {
          tags: ['javascript', 'react', 'typescript']
        },
        {}
      );
    });

    it('應該處理服務錯誤', async () => {
      (resourceService.getResources as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/resources')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal Server Error'
      });
    });
  });

  describe('GET /resources/:id', () => {
    it('應該成功獲取資源詳情', async () => {
      (resourceService.getResourceById as jest.Mock).mockResolvedValue(mockResource);

      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000')
        .expect(200);

      expect(resourceService.getResourceById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(response.body).toEqual({
        success: true,
        data: mockResource
      });
    });

    it('應該處理資源不存在的情況', async () => {
      (resourceService.getResourceById as jest.Mock).mockRejectedValue(new NotFoundError('資源不存在'));

      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '資源不存在'
        }
      });
    });

    it('應該處理服務錯誤', async () => {
      (resourceService.getResourceById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal Server Error'
      });
    });
  });

  describe('POST /resources', () => {
    const { validateCreateResource } = require('@/validators/resource.validator');
    
    beforeEach(() => {
      validateCreateResource.mockImplementation((data: any) => data);
    });

    it('應該成功創建資源（已登入用戶）', async () => {
      const createData = {
        name: '新測試資源',
        url: 'https://example.com/new',
        description: '新資源描述',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner'
      };

      (resourceService.createResource as jest.Mock).mockResolvedValue(mockResource);

      const response = await request(app)
        .post('/resources')
        .set('Authorization', 'Bearer test-token')
        .send(createData)
        .expect(201);

      expect(validateCreateResource).toHaveBeenCalledWith(createData);
      expect(resourceService.createResource).toHaveBeenCalledWith(createData, 1);
      expect(response.body).toEqual({
        success: true,
        data: mockResource
      });
    });

    it('應該在開發環境中使用測試用戶創建資源', async () => {
      const createData = {
        name: '測試資源',
        url: 'https://example.com',
        description: '測試描述',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        majorCategory: 'Programming',
        subCategory: 'JavaScript',
        tags: ['javascript', 'tutorial']
      };

      (resourceService.createResource as jest.Mock).mockResolvedValue(mockResource);

      const response = await request(app)
        .post('/resources')
        .send(createData)
        .expect(201);

      expect(resourceService.createResource).toHaveBeenCalledWith(createData, 1);
      expect(response.body).toEqual({
        success: true,
        data: mockResource
      });
    });

    it('應該處理驗證錯誤', async () => {
      const invalidData = {
        name: '',
        url: 'invalid-url'
      };

      validateCreateResource.mockImplementation(() => {
        throw new BadRequestError('驗證失敗');
      });

      const response = await request(app)
        .post('/resources')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '驗證失敗'
        }
      });
    });
  });

  describe('PATCH /resources/:id', () => {
    const { validateUpdateResource } = require('@/validators/resource.validator');
    
    beforeEach(() => {
      validateUpdateResource.mockImplementation((data: any) => data);
    });

    it('應該成功更新資源', async () => {
      const updateData = {
        name: '更新後的資源名稱',
        description: '更新後的描述'
      };

      const updatedResource = { ...mockResource, ...updateData };
      (resourceService.updateResource as jest.Mock).mockResolvedValue(updatedResource);

      const response = await request(app)
        .patch('/resources/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', 'Bearer test-token')
        .send(updateData)
        .expect(200);

      expect(validateUpdateResource).toHaveBeenCalledWith(updateData);
      expect(resourceService.updateResource).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        updateData,
        1
      );
      expect(response.body).toEqual({
        success: true,
        data: updatedResource
      });
    });

    it('應該處理資源不存在的情況', async () => {
      const updateData = { name: '新名稱' };
      (resourceService.updateResource as jest.Mock).mockRejectedValue(new NotFoundError('資源不存在'));

      const response = await request(app)
        .patch('/resources/550e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', 'Bearer test-token')
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '資源不存在'
        }
      });
    });

    it('應該處理權限不足的情況', async () => {
      const updateData = { name: '新名稱' };
      (resourceService.updateResource as jest.Mock).mockRejectedValue(new ForbiddenError('無權限修改此資源'));

      const response = await request(app)
        .patch('/resources/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', 'Bearer test-token')
        .send(updateData)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '無權限修改此資源'
        }
      });
    });
  });

  describe('PATCH /resources/:id/status', () => {
    const { validateUpdateResourceStatus } = require('@/validators/resource.validator');
    
    beforeEach(() => {
      validateUpdateResourceStatus.mockImplementation((data: any) => data);
    });

    it('應該成功更新資源狀態', async () => {
      const statusData = { status: 'archived' };
      const updatedResource = { ...mockResource, status: 'archived' };
      (resourceService.updateResource as jest.Mock).mockResolvedValue(updatedResource);

      const response = await request(app)
        .patch('/resources/550e8400-e29b-41d4-a716-446655440000/status')
        .set('Authorization', 'Bearer test-token')
        .send(statusData)
        .expect(200);

      expect(validateUpdateResourceStatus).toHaveBeenCalledWith(statusData);
      expect(resourceService.updateResource).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        { status: 'archived' },
        1
      );
      expect(response.body).toEqual({
        success: true,
        data: updatedResource
      });
    });
  });

  describe('DELETE /resources/:id', () => {
    it('應該成功刪除資源', async () => {
      (resourceService.deleteResource as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/resources/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(resourceService.deleteResource).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        1
      );
      expect(response.body).toEqual({
        success: true,
        message: '資源已成功刪除'
      });
    });

    it('應該處理資源不存在的情況', async () => {
      (resourceService.deleteResource as jest.Mock).mockRejectedValue(new NotFoundError('資源不存在'));

      const response = await request(app)
        .delete('/resources/550e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '資源不存在'
        }
      });
    });

    it('應該處理權限不足的情況', async () => {
      (resourceService.deleteResource as jest.Mock).mockRejectedValue(new ForbiddenError('無權限刪除此資源'));

      const response = await request(app)
        .delete('/resources/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', 'Bearer test-token')
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '無權限刪除此資源'
        }
      });
    });
  });

  describe('GET /resources/:id/tags', () => {
    it('應該成功獲取資源標籤', async () => {
      const mockTags = [
        { id: 1, name: 'javascript' },
        { id: 2, name: 'react' },
        { id: 3, name: 'typescript' }
      ];
      (tagService.getEntityTags as jest.Mock).mockResolvedValue(mockTags);

      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000/tags')
        .expect(200);

      expect(tagService.getEntityTags).toHaveBeenCalledWith(
        'resource',
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(response.body).toEqual({
        success: true,
        data: ['javascript', 'react', 'typescript']
      });
    });

    it('應該處理服務錯誤', async () => {
      (tagService.getEntityTags as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000/tags')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal Server Error'
      });
    });
  });

  describe('用戶權限測試', () => {
    const { validateCreateResource } = require('@/validators/resource.validator');
    
    beforeEach(() => {
      validateCreateResource.mockImplementation((data: any) => data);
    });
    
    it('應該在開發環境下為未登入用戶提供測試用戶 ID', async () => {
      // 明確設置為開發環境
      process.env.NODE_ENV = 'dev';
      
      const createData = {
        name: '測試資源',
        url: 'https://example.com',
        description: '測試描述',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner'
      };

      (resourceService.createResource as jest.Mock).mockResolvedValue(mockResource);

      // 不設置 Authorization header
      const response = await request(app)
        .post('/resources')
        .send(createData)
        .expect(201);

      expect(resourceService.createResource).toHaveBeenCalledWith(createData, 1);
    });

    it('應該在生產環境下拒絕未登入用戶的請求', async () => {
      // 設置為生產環境
      process.env.NODE_ENV = 'prod';
      
      const createData = {
        name: '測試資源',
        url: 'https://example.com',
        description: '測試描述',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner'
      };

      const response = await request(app)
        .post('/resources')
        .send(createData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '必須登入才能執行此操作'
        }
      });
    });
  });
});