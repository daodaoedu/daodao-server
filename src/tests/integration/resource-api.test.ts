/**
 * Resource API 整合測試
 * 測試資源管理相關的 API 端點
 */

import request from 'supertest';
import express from 'express';

// 模擬資源服務
jest.mock('@/services/resource.service', () => ({
  default: {
    getResources: jest.fn(),
    getResourceById: jest.fn(),
    createResource: jest.fn(),
    updateResource: jest.fn(),
    updateResourceStatus: jest.fn(),
    deleteResource: jest.fn(),
    getResourceTags: jest.fn()
  }
}));

// 模擬認證中間件
jest.mock('@/middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { 
      id: 1, 
      username: 'testuser', 
      email: 'test@example.com',
      external_id: 'user-1'
    };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.user = { 
      id: 1, 
      username: 'testuser', 
      email: 'test@example.com',
      external_id: 'user-1'
    };
    next();
  },
  requireRole: () => (req: any, res: any, next: any) => next()
}));

// 模擬驗證中間件
jest.mock('@/validators/validation.middleware', () => ({
  validate: () => (req: any, res: any, next: any) => {
    // Check for malformed JSON content type
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      try {
        // If body exists and is a string, it's likely malformed JSON
        if (typeof req.body === 'string') {
          return res.status(400).json({
            success: false,
            error: { message: 'Invalid JSON', code: 'VALIDATION_ERROR' }
          });
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid JSON', code: 'VALIDATION_ERROR' }
        });
      }
    }
    next();
  }
}));

// 模擬資源控制器
jest.mock('@/controllers/resource.controller', () => {
  const mockFunctions = {
    getResources: jest.fn(),
    getResourceById: jest.fn(),
    createResource: jest.fn(),
    updateResource: jest.fn(),
    updateResourceStatus: jest.fn(),
    deleteResource: jest.fn(),
    getResourceTags: jest.fn()
  };
  
  return {
    // Named exports
    ...mockFunctions,
    // Default export
    default: mockFunctions
  };
});

import resourceService from '@/services/resource.service';
import resourceController from '@/controllers/resource.controller';

describe('Resource API Integration Tests', () => {
  let app: express.Application;
  let mockResourceService: jest.Mocked<typeof resourceService>;
  let mockResourceController: jest.Mocked<typeof resourceController>;

  beforeAll(() => {
    // 設置測試環境
    process.env.NODE_ENV = 'test';
    
    app = express();
    
    // JSON parsing with error handling
    app.use(express.json({
      strict: true
    }));
    
    // Handle JSON parsing errors
    app.use((err: Error & { status?: number }, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid JSON',
            code: 'VALIDATION_ERROR'
          }
        });
      }
      next(err);
    });
    
    // 設置路由
    const resourceRoutes = require('@/routes/resource.routes').default;
    app.use('/api/v1/resources', resourceRoutes);
    
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

    mockResourceService = resourceService as jest.Mocked<typeof resourceService>;
    mockResourceController = resourceController as jest.Mocked<typeof resourceController>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 設置默認的控制器模擬行為
    mockResourceController.getResources.mockImplementation((req: any, res: any) => {
      res.status(200).json({
        success: true,
        data: [
          {
            id: 'resource-1',
            title: '測試資源1',
            description: '這是一個測試資源',
            url: 'https://example.com/resource1',
            type: 'article',
            cost: 'free',
            level: 'beginner',
            majorCategory: 'programming',
            subCategory: 'javascript',
            tags: ['JavaScript', 'React'],
            status: 'active',
            author: {
              id: 'user-1',
              name: '作者1'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        pagination: {
          cursor: null,
          hasMore: false,
          limit: 20,
          total: 1
        }
      });
    });

    mockResourceController.getResourceById.mockImplementation((req: any, res: any) => {
      const resourceId = req.params.resourceId;
      if (resourceId === 'resource-1') {
        res.status(200).json({
          success: true,
          data: {
            id: 'resource-1',
            title: '測試資源1',
            description: '這是一個測試資源的詳細描述',
            url: 'https://example.com/resource1',
            type: 'article',
            cost: 'free',
            level: 'beginner',
            majorCategory: 'programming',
            subCategory: 'javascript',
            tags: ['JavaScript', 'React'],
            status: 'active',
            author: {
              id: 'user-1',
              name: '作者1'
            },
            stats: {
              viewCount: 100,
              likeCount: 25,
              reviewCount: 5,
              averageRating: 4.2
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: { message: '資源不存在', code: 'NOT_FOUND' }
        });
      }
    });

    mockResourceController.createResource.mockImplementation((req: any, res: any) => {
      res.status(201).json({
        success: true,
        data: {
          id: 'new-resource-id',
          title: req.body.title,
          description: req.body.description,
          url: req.body.url,
          type: req.body.type,
          cost: req.body.cost,
          level: req.body.level,
          majorCategory: req.body.majorCategory,
          subCategory: req.body.subCategory,
          tags: req.body.tags || [],
          status: 'active',
          author: {
            id: 'user-1',
            name: '測試用戶'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    });

    mockResourceController.updateResource.mockImplementation((req: any, res: any) => {
      res.status(200).json({
        success: true,
        data: {
          id: req.params.resourceId,
          title: req.body.title || '更新後的標題',
          description: req.body.description || '更新後的描述',
          url: req.body.url || 'https://updated.com',
          type: req.body.type || 'article',
          cost: req.body.cost || 'free',
          level: req.body.level || 'beginner',
          majorCategory: req.body.majorCategory || 'programming',
          subCategory: req.body.subCategory || 'javascript',
          tags: req.body.tags || ['Updated'],
          status: 'active',
          author: {
            id: 'user-1',
            name: '測試用戶'
          },
          updatedAt: new Date().toISOString()
        }
      });
    });

    mockResourceController.updateResourceStatus.mockImplementation((req: any, res: any) => {
      res.status(200).json({
        success: true,
        data: {
          id: req.params.resourceId,
          status: req.body.status,
          updatedAt: new Date().toISOString()
        }
      });
    });

    mockResourceController.deleteResource.mockImplementation((req: any, res: any) => {
      res.status(200).json({
        success: true,
        message: '資源已刪除'
      });
    });

    mockResourceController.getResourceTags.mockImplementation((req: any, res: any) => {
      res.status(200).json({
        success: true,
        data: [
          { name: 'JavaScript', count: 10 },
          { name: 'React', count: 8 },
          { name: 'TypeScript', count: 6 }
        ]
      });
    });
  });

  describe('GET /api/v1/resources', () => {
    it('should return resources list successfully', async () => {
      const response = await request(app)
        .get('/api/v1/resources')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        pagination: expect.any(Object)
      });

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: 'resource-1',
        title: '測試資源1',
        type: 'article'
      });
    });

    it('should handle query parameters', async () => {
      await request(app)
        .get('/api/v1/resources')
        .query({
          cursor: 'cursor-value',
          limit: 10,
          type: 'article',
          cost: 'free',
          level: 'beginner',
          majorCategory: 'programming',
          subCategory: 'javascript',
          tags: 'JavaScript,React',
          query: '搜尋關鍵字',
          sort: 'createdAt',
          order: 'desc'
        })
        .expect(200);

      expect(mockResourceController.getResources).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      mockResourceController.getResources.mockImplementation((req: any, res: any) => {
        res.status(200).json({
          success: true,
          data: [],
          pagination: { cursor: null, hasMore: false, limit: 20, total: 0 }
        });
      });

      const response = await request(app)
        .get('/api/v1/resources')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('GET /api/v1/resources/:id', () => {
    it('should return specific resource', async () => {
      const response = await request(app)
        .get('/api/v1/resources/resource-1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: 'resource-1',
          title: '測試資源1',
          stats: expect.any(Object)
        }
      });
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/v1/resources/non-existent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '資源不存在',
          code: 'NOT_FOUND'
        }
      });
    });
  });

  describe('POST /api/v1/resources', () => {
    it('should create new resource successfully', async () => {
      const resourceData = {
        title: '新資源',
        description: '這是一個新的資源',
        url: 'https://example.com/new',
        type: 'video',
        cost: 'paid',
        level: 'intermediate',
        majorCategory: 'design',
        subCategory: 'ui-ux',
        tags: ['Design', 'UI/UX']
      };

      const response = await request(app)
        .post('/api/v1/resources')
        .send(resourceData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          title: '新資源',
          type: 'video',
          cost: 'paid',
          level: 'intermediate'
        }
      });
    });

    it('should create resource with embedded review', async () => {
      const resourceWithReview = {
        title: '帶評價的資源',
        description: '描述',
        url: 'https://example.com',
        type: 'article',
        cost: 'free',
        level: 'beginner',
        majorCategory: 'programming',
        subCategory: 'javascript',
        embedReview: {
          content: '這是一個很棒的資源',
          rating: 5,
          tags: ['Excellent', 'Helpful']
        }
      };

      const response = await request(app)
        .post('/api/v1/resources')
        .send(resourceWithReview)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/resources/:id', () => {
    it('should update resource successfully', async () => {
      const updateData = {
        title: '更新後的標題',
        description: '更新後的描述',
        tags: ['Updated', 'Modified']
      };

      const response = await request(app)
        .patch('/api/v1/resources/resource-1')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: 'resource-1',
          title: '更新後的標題',
          description: '更新後的描述'
        }
      });
    });

    it('should handle permission errors', async () => {
      mockResourceController.updateResource.mockImplementation((req: any, res: any) => {
        res.status(403).json({
          success: false,
          error: { message: '無權限修改此資源', code: 'FORBIDDEN' }
        });
      });

      const response = await request(app)
        .patch('/api/v1/resources/resource-1')
        .send({ title: '嘗試更新' })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '無權限修改此資源'
        }
      });
    });
  });

  describe('PATCH /api/v1/resources/:id/status', () => {
    it('should update resource status successfully', async () => {
      const statusUpdate = {
        status: 'inactive',
        reason: '內容過時'
      };

      const response = await request(app)
        .patch('/api/v1/resources/resource-1/status')
        .send(statusUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: 'resource-1',
          status: 'inactive'
        }
      });
    });
  });

  describe('DELETE /api/v1/resources/:id', () => {
    it('should delete resource successfully', async () => {
      const response = await request(app)
        .delete('/api/v1/resources/resource-1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: '資源已刪除'
      });
    });

    it('should handle permission errors when deleting', async () => {
      mockResourceController.deleteResource.mockImplementation((req: any, res: any) => {
        res.status(403).json({
          success: false,
          error: { message: '無權限刪除此資源', code: 'FORBIDDEN' }
        });
      });

      const response = await request(app)
        .delete('/api/v1/resources/resource-1')
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '無權限刪除此資源'
        }
      });
    });
  });

  describe('GET /api/v1/resources/:id/tags', () => {
    it('should return resource tags', async () => {
      const response = await request(app)
        .get('/api/v1/resources/resource-1/tags')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            count: expect.any(Number)
          })
        ])
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockResourceController.getResources.mockImplementation((req: any, res: any) => {
        res.status(500).json({
          success: false,
          error: { message: 'Database error', code: 'INTERNAL_ERROR' }
        });
      });

      const response = await request(app)
        .get('/api/v1/resources')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: 'Database error'
        })
      });
    });

    it('should handle malformed requests', async () => {
      const response = await request(app)
        .post('/api/v1/resources')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}') // Malformed JSON
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  afterAll(() => {
    delete process.env.NODE_ENV;
  });
});