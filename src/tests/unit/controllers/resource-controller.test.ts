/**
 * 資源控制器測試
 */

import request from 'supertest';
import express from 'express';
import resourceController from '../../../controllers/resource-controller';
import resourceService from '../../../services/resource-service';

// 模擬服務
jest.mock('../../../src/services/resource-service', () => ({
  __esModule: true,
  default: {
    getResources: jest.fn(),
    getResourceById: jest.fn(),
    createResource: jest.fn(),
    updateResource: jest.fn(),
    deleteResource: jest.fn()
  }
}));

// 創建測試用的 Express 應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 設置路由
  app.get('/resources', resourceController.getResources);
  app.get('/resources/:id', resourceController.getResourceById);
  
  // 添加錯誤處理中間件
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  });
  
  return app;
};

describe('ResourceController', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /resources', () => {
    it('應該使用預設分頁參數（每頁5筆）', async () => {
      // 模擬服務返回
      const mockResponse = {
        resources: [
          {
            id: 'uuid-1',
            name: '測試資源1',
            url: 'https://example.com/1'
          }
        ],
        pagination: {
          limit: 5,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
          totalEstimate: 1
        }
      };
      (resourceService.getResources as jest.Mock).mockResolvedValue(mockResponse);

      // 發送請求
      const response = await request(app)
        .get('/resources')
        .expect(200);

      // 驗證服務調用
      expect(resourceService.getResources).toHaveBeenCalledWith(
        {},
        {} // 沒有分頁參數時傳遞空物件，服務層會使用預設值
      );

      // 驗證回應
      expect(response.body).toEqual({
        success: true,
        data: mockResponse
      });
    });

    it('應該正確處理自定義分頁參數', async () => {
      // 模擬服務返回
      const mockResponse = {
        resources: [],
        pagination: {
          limit: 3,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
          totalEstimate: 0
        }
      };
      (resourceService.getResources as jest.Mock).mockResolvedValue(mockResponse);

      // 發送請求
      const response = await request(app)
        .get('/resources?limit=3&sort=name&order=asc')
        .expect(200);

      // 驗證服務調用
      expect(resourceService.getResources).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          limit: 3,
          sort: 'name',
          order: 'asc'
        })
      );
    });

    it('應該正確處理篩選參數', async () => {
      // 模擬服務返回
      const mockResponse = {
        resources: [],
        pagination: {
          limit: 5,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
          totalEstimate: 0
        }
      };
      (resourceService.getResources as jest.Mock).mockResolvedValue(mockResponse);

      // 發送請求
      const response = await request(app)
        .get('/resources?type=books_articles&cost=free&majorCategory=frontend_development')
        .expect(200);

      // 驗證服務調用
      expect(resourceService.getResources).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'books_articles',
          cost: 'free',
          majorCategory: 'frontend_development'
        }),
        expect.any(Object)
      );
    });

    it('應該正確處理游標分頁', async () => {
      // 模擬服務返回
      const mockResponse = {
        resources: [],
        pagination: {
          limit: 5,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
          totalEstimate: 0
        }
      };
      (resourceService.getResources as jest.Mock).mockResolvedValue(mockResponse);

      const cursor = 'eyJpZCI6MTAsInRpbWVzdGFtcCI6IjIwMjQtMDEtMDFUMDA6MDA6MDBaIn0=';

      // 發送請求
      const response = await request(app)
        .get(`/resources?cursor=${cursor}`)
        .expect(200);

      // 驗證服務調用
      expect(resourceService.getResources).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          cursor: cursor
        })
      );
    });

    it('應該處理服務錯誤', async () => {
      // 模擬服務拋出錯誤
      (resourceService.getResources as jest.Mock).mockRejectedValue(new Error('Database error'));

      // 發送請求
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
    it('應該正確返回資源詳情（不包含評論）', async () => {
      // 模擬服務返回
      const mockResource = {
        id: 'uuid-1',
        name: '測試資源',
        url: 'https://example.com',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        status: 'active',
        avgRating: 4.5,
        viewCount: 100,
        favoriteCount: 50,
        shareCount: 20,
        reviewCount: 10,
        likeCount: 75,
        majorCategory: 'frontend_development',
        subCategory: 'javascript_frameworks',
        user: {
          id: 100,
          name: '測試用戶',
          _id: 'user-uuid',
          roleList: ['citizen'],
          photoURL: 'https://example.com/avatar.jpg'
        },
        tags: ['javascript', 'react'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };
      (resourceService.getResourceById as jest.Mock).mockResolvedValue(mockResource);

      // 發送請求
      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000')
        .expect(200);

      // 驗證回應結構
      expect(response.body).toEqual({
        success: true,
        data: mockResource
      });

      // 驗證不包含評論內容
      expect(response.body.data.reviews).toBeUndefined();
      expect(response.body.data.recentReviews).toBeUndefined();

      // 驗證包含統計資訊
      expect(response.body.data.reviewCount).toBe(10);
      expect(response.body.data.avgRating).toBe(4.5);
      expect(response.body.data.likeCount).toBe(75);
    });
  });
});