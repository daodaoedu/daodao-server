/**
 * 想法控制器測試
 */

import request from 'supertest';
import express from 'express';
import ideaController from '@/controllers/idea.controller';
import ideaService from '@/services/idea.service';
import { Request } from 'express';
import { IdeaStatus, ResourceStatus } from '@/types/idea.types';

// 模擬服務
jest.mock('@/services/idea.service', () => ({
  __esModule: true,
  default: {
    getIdeas: jest.fn(),
    getIdeaById: jest.fn(),
    createIdea: jest.fn(),
    updateIdea: jest.fn(),
    deleteIdea: jest.fn()
  }
}));

// 模擬驗證中間件
jest.mock('@/validators/validation.middleware', () => ({
  validate: () => (_req: unknown, _res: unknown, next: () => void) => next()
}));

// 模擬驗證 schemas
jest.mock('@/validators/idea.validators', () => ({
  ideaParamsSchema: {
    parse: jest.fn().mockImplementation((params) => params)
  },
  ideaQuerySchema: {
    parse: jest.fn().mockImplementation((query) => ({
      page: typeof query.page === 'string' ? parseInt(query.page) : (query.page || 1),
      limit: typeof query.limit === 'string' ? parseInt(query.limit) : (query.limit || 20),
      sort: query.sort || 'createdAt',
      order: query.order || 'desc',
      query: query.query,
      status: query.status,
      tags: query.tags,
      userId: query.userId
    }))
  },
  createIdeaSchema: {
    parse: jest.fn().mockImplementation((body) => body)
  },
  updateIdeaSchema: {
    parse: jest.fn().mockImplementation((body) => body)
  }
}));

// 創建測試用的 Express 應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 模擬認證中間件
  const mockAuth = (req: unknown, res: unknown, next: () => void) => {
    (req as { user?: { id: number; username: string } }).user = { id: 1, username: 'testuser' };
    next();
  };
  
  // 設置路由
  app.get('/ideas', ideaController.getIdeas);
  app.get('/ideas/:id', ideaController.getIdeaById);
  app.post('/ideas', mockAuth, ideaController.createIdea);
  app.patch('/ideas/:id', mockAuth, ideaController.updateIdea);
  app.delete('/ideas/:id', mockAuth, ideaController.deleteIdea);
  app.get('/me/ideas', mockAuth, ideaController.getMyIdeas);
  
  // 添加錯誤處理中間件
  app.use((err: Error, _req: unknown, res: { status: (code: number) => { json: (data: unknown) => void } }, _next: () => void) => {
    res.status(500).json({
      success: false,
      error: {
        message: err.message || 'Internal Server Error'
      }
    });
  });
  
  return app;
};

describe('IdeaController', () => {
  let app: express.Application;
  const mockIdeaService = ideaService as jest.Mocked<typeof ideaService>;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /ideas', () => {
    it('應該成功獲取想法列表', async () => {
      const mockIdeas = {
        ideas: [
          {
            id: 'idea-uuid-1',
            content: '測試想法1',
            user: { id: 'user-uuid-1', name: '測試用戶' },
            tags: ['標籤1', '標籤2'],
            likeCount: 5,
            commentCount: 3,
            viewCount: 20,
            shareCount: 1,
            hasResources: true,
            resourceCount: 2,
            status: 'active' as IdeaStatus,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      };

      mockIdeaService.getIdeas.mockResolvedValue(mockIdeas);

      const response = await request(app)
        .get('/ideas')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockIdeas.ideas,
        pagination: mockIdeas.pagination
      });
      expect(mockIdeaService.getIdeas).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'createdAt',
          order: 'desc'
        }),
        expect.objectContaining({
          page: 1,
          limit: 20,
          sort: 'createdAt',
          order: 'desc'
        }),
        undefined // 未登入用戶
      );
    });

    it('應該支援標籤篩選', async () => {
      mockIdeaService.getIdeas.mockResolvedValue({ ideas: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });

      const response = await request(app)
        .get('/ideas')
        .query({ tags: 'React,TypeScript' });

      expect(response.status).toBe(200);
      expect(mockIdeaService.getIdeas).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['React', 'TypeScript']
        }),
        expect.any(Object),
        undefined
      );
    });
  });

  describe('GET /ideas/:id', () => {
    it('應該成功獲取想法詳情', async () => {
      const mockIdea = {
        id: 'idea-uuid-1',
        content: '測試想法詳情',
        user: { id: 'user-uuid-1', name: '測試用戶' },
        tags: ['標籤1'],
        likeCount: 10,
        commentCount: 5,
        viewCount: 50,
        shareCount: 2,
        hasResources: false,
        resourceCount: 0,
        status: 'active' as IdeaStatus,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockIdeaService.getIdeaById.mockResolvedValue(mockIdea);

      const response = await request(app)
        .get('/ideas/idea-uuid-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockIdea
      });
      expect(mockIdeaService.getIdeaById).toHaveBeenCalledWith('idea-uuid-1', undefined);
    });

    it('應該處理找不到想法的情況', async () => {
      mockIdeaService.getIdeaById.mockRejectedValue(new Error('找不到指定的想法'));

      const response = await request(app)
        .get('/ideas/non-existent-id');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /ideas', () => {
    it('應該成功創建想法', async () => {
      const createData = {
        content: '這是一個新的想法',
        tags: ['新標籤1', '新標籤2']
      };

      const mockCreatedIdea = {
        idea: {
          id: 'new-idea-uuid',
          content: createData.content,
          user: { id: 'user-uuid-1', name: 'testuser' },
          tags: createData.tags,
          likeCount: 0,
          commentCount: 0,
          viewCount: 0,
          shareCount: 0,
          hasResources: false,
          resourceCount: 0,
          status: 'active' as IdeaStatus,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        resources: []
      };

      mockIdeaService.createIdea.mockResolvedValue(mockCreatedIdea);

      const response = await request(app)
        .post('/ideas')
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: mockCreatedIdea,
        message: '想法已成功建立'
      });
      expect(mockIdeaService.createIdea).toHaveBeenCalledWith(createData, 1);
    });

    it('應該支援創建帶有資源的想法', async () => {
      const createData = {
        content: '學習資源分享',
        tags: ['學習'],
        resources: [
          {
            name: '官方文檔',
            url: 'https://example.com/docs',
            description: '很棒的文檔'
          }
        ]
      };

      const mockCreatedIdea = {
        idea: {
          id: 'new-idea-uuid',
          content: createData.content,
          user: { id: 'user-uuid-1', name: 'testuser' },
          tags: createData.tags,
          likeCount: 0,
          commentCount: 0,
          viewCount: 0,
          shareCount: 0,
          hasResources: true,
          resourceCount: 1,
          status: 'active' as IdeaStatus,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        resources: [
          {
            id: 'resource-uuid-1',
            name: '官方文檔',
            url: 'https://example.com/docs',
            description: '很棒的文檔',
            status: 'draft' as ResourceStatus,
            createdFromType: 'idea' as const,
            createdFromId: 'new-idea-uuid',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ]
      };

      mockIdeaService.createIdea.mockResolvedValue(mockCreatedIdea);

      const response = await request(app)
        .post('/ideas')
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body.data.resources).toHaveLength(1);
      expect(response.body.data.resources[0].status).toBe('draft');
    });
  });

  describe('PATCH /ideas/:id', () => {
    it('應該成功更新想法', async () => {
      const updateData = {
        content: '更新後的內容',
        tags: ['更新標籤']
      };

      const mockUpdatedIdea = {
        id: 'idea-uuid-1',
        content: updateData.content,
        user: { id: 'user-uuid-1', name: 'testuser' },
        tags: updateData.tags,
        likeCount: 5,
        commentCount: 3,
        viewCount: 20,
        shareCount: 1,
        hasResources: false,
        resourceCount: 0,
        status: 'active' as IdeaStatus,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      mockIdeaService.updateIdea.mockResolvedValue(mockUpdatedIdea);

      const response = await request(app)
        .patch('/ideas/idea-uuid-1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedIdea,
        message: '想法已更新'
      });
      expect(mockIdeaService.updateIdea).toHaveBeenCalledWith('idea-uuid-1', updateData, 1);
    });

    it('應該處理權限不足的情況', async () => {
      mockIdeaService.updateIdea.mockRejectedValue(new Error('沒有權限更新此想法'));

      const response = await request(app)
        .patch('/ideas/idea-uuid-1')
        .send({ content: '嘗試更新' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /ideas/:id', () => {
    it('應該成功刪除想法', async () => {
      mockIdeaService.deleteIdea.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/ideas/idea-uuid-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: '想法已刪除'
      });
      expect(mockIdeaService.deleteIdea).toHaveBeenCalledWith('idea-uuid-1', 1);
    });
  });

  describe('GET /me/ideas', () => {
    it('應該獲取當前用戶的想法', async () => {
      const mockMyIdeas = {
        ideas: [
          {
            id: 'my-idea-uuid',
            content: '我的想法',
            user: { id: 'user-uuid-1', name: 'testuser' },
            tags: ['個人'],
            likeCount: 0,
            commentCount: 0,
            viewCount: 5,
            shareCount: 0,
            hasResources: false,
            resourceCount: 0,
            status: 'active' as IdeaStatus,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      };

      mockIdeaService.getIdeas.mockResolvedValue(mockMyIdeas);

      const response = await request(app)
        .get('/me/ideas');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockMyIdeas.ideas,
        pagination: mockMyIdeas.pagination
      });
      expect(mockIdeaService.getIdeas).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '1' // 用戶 ID 被強制設定為當前用戶
        }),
        expect.any(Object),
        1
      );
    });
  });
});