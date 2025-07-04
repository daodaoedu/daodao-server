/**
 * 資源評論控制器測試
 */

import request from 'supertest';
import express from 'express';
import resourceReviewController from '../../../src/controllers/resource-review-controller';
import resourceReviewService from '../../../src/services/resource-review-service';

// 模擬服務
jest.mock('../../../src/services/resource-review-service', () => ({
  __esModule: true,
  default: {
    getReviews: jest.fn(),
    getReviewById: jest.fn(),
    createReview: jest.fn(),
    updateReview: jest.fn(),
    deleteReview: jest.fn()
  }
}));

// 創建測試用的 Express 應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 設置路由（模擬嵌套路由）
  app.get('/resources/:resourceId/reviews', resourceReviewController.getReviewsByResource);
  app.get('/reviews', resourceReviewController.getReviews);
  
  return app;
};

describe('ResourceReviewController', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /resources/:resourceId/reviews', () => {
    it('應該使用預設分頁參數（每頁2筆）', async () => {
      // 模擬服務返回
      const mockResponse = {
        reviews: [
          {
            id: '1',
            content: '很棒的資源',
            overallImpact: 5,
            changeMindset: 4,
            solveProblems: 5,
            gainPerspectives: 4,
            achieveGoals: 5,
            avgRating: 4.6,
            timeUsage: '1_2_hours_daily',
            contentFeatures: {
              wellStructured: true,
              practiceFocused: true,
              wellRoundedConcepts: false,
              thoughtProvoking: true,
              progressiveLearning: false,
              problemBased: false,
              realWorldExamples: true,
              interactive: false,
              visuallyRich: true
            },
            resourceUsage: {
              withOnlineCourses: true,
              withBooks: false,
              withOtherTools: true,
              withCommunity: false,
              onlyThisResource: false,
              notApplicableResource: false
            },
            status: 'published',
            likeCount: 12,
            user: {
              id: 100,
              name: 'Alice Chen',
              _id: 'user-uuid',
              roleList: ['citizen'],
              photoURL: 'https://example.com/avatar.jpg'
            },
            resourceId: '550e8400-e29b-41d4-a716-446655440000',
            tags: ['實用', '清晰易懂'],
            createdAt: '2024-01-18T16:45:00Z',
            updatedAt: '2024-01-19T10:20:00Z'
          }
        ],
        pagination: {
          limit: 2,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
          totalEstimate: 1
        }
      };
      (resourceReviewService.getReviews as jest.Mock).mockResolvedValue(mockResponse);

      // 發送請求
      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000/reviews')
        .expect(200);

      // 驗證服務調用
      expect(resourceReviewService.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: '550e8400-e29b-41d4-a716-446655440000'
        }),
        {} // 沒有分頁參數時傳遞空物件
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
        reviews: [],
        pagination: {
          limit: 1,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
          totalEstimate: 0
        }
      };
      (resourceReviewService.getReviews as jest.Mock).mockResolvedValue(mockResponse);

      // 發送請求
      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000/reviews?limit=1&sort=created_at&order=asc')
        .expect(200);

      // 驗證服務調用
      expect(resourceReviewService.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: '550e8400-e29b-41d4-a716-446655440000'
        }),
        expect.objectContaining({
          limit: 1,
          sort: 'created_at',
          order: 'asc'
        })
      );
    });

    it('應該正確處理篩選參數', async () => {
      // 模擬服務返回
      const mockResponse = {
        reviews: [],
        pagination: {
          limit: 2,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
          totalEstimate: 0
        }
      };
      (resourceReviewService.getReviews as jest.Mock).mockResolvedValue(mockResponse);

      // 發送請求
      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000/reviews?status=published&minScore=4.0&maxScore=5.0&tags=實用,清晰')
        .expect(200);

      // 驗證服務調用
      expect(resourceReviewService.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'published',
          minScore: 4.0,
          maxScore: 5.0,
          tags: ['實用', '清晰']
        }),
        expect.any(Object)
      );
    });

    it('應該正確處理游標分頁', async () => {
      // 模擬服務返回
      const mockResponse = {
        reviews: [],
        pagination: {
          limit: 2,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
          totalEstimate: 0
        }
      };
      (resourceReviewService.getReviews as jest.Mock).mockResolvedValue(mockResponse);

      const cursor = 'eyJpZCI6MTAsInRpbWVzdGFtcCI6IjIwMjQtMDEtMDFUMDA6MDA6MDBaIn0=';

      // 發送請求
      const response = await request(app)
        .get(`/resources/550e8400-e29b-41d4-a716-446655440000/reviews?cursor=${cursor}`)
        .expect(200);

      // 驗證服務調用
      expect(resourceReviewService.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: '550e8400-e29b-41d4-a716-446655440000'
        }),
        expect.objectContaining({
          cursor: cursor
        })
      );
    });

    it('應該驗證評論包含正確的字段結構', async () => {
      // 模擬服務返回
      const mockResponse = {
        reviews: [
          {
            id: '1',
            content: '測試評論',
            overallImpact: 5,
            changeMindset: 4,
            solveProblems: 5,
            gainPerspectives: 4,
            achieveGoals: 5,
            avgRating: 4.6,
            timeUsage: '1_2_hours_daily',
            contentFeatures: {
              wellStructured: true,
              practiceFocused: true
            },
            resourceUsage: {
              withOnlineCourses: true,
              withBooks: false
            },
            status: 'published',
            likeCount: 5, // 確保使用 likeCount 而不是 likesCount
            user: {
              id: 100,
              name: 'Test User',
              _id: 'user-uuid',
              roleList: ['citizen'],
              photoURL: 'https://example.com/avatar.jpg'
            },
            resourceId: '550e8400-e29b-41d4-a716-446655440000',
            tags: ['測試'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          limit: 2,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
          totalEstimate: 1
        }
      };
      (resourceReviewService.getReviews as jest.Mock).mockResolvedValue(mockResponse);

      // 發送請求
      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000/reviews')
        .expect(200);

      // 驗證回應結構
      const review = response.body.data.reviews[0];
      
      // 驗證必要字段
      expect(review).toHaveProperty('id');
      expect(review).toHaveProperty('content');
      expect(review).toHaveProperty('likeCount'); // 確保是 likeCount
      expect(review).toHaveProperty('user');
      expect(review).toHaveProperty('resourceId');
      expect(review).toHaveProperty('avgRating');
      expect(review).toHaveProperty('contentFeatures');
      expect(review).toHaveProperty('resourceUsage');
      
      // 驗證用戶物件結構
      expect(review.user).toHaveProperty('id');
      expect(review.user).toHaveProperty('name');
      expect(review.user).toHaveProperty('_id');
      expect(review.user).toHaveProperty('roleList');
      expect(review.user).toHaveProperty('photoURL');
      
      // 確保沒有舊的字段名稱
      expect(review).not.toHaveProperty('likesCount');
      expect(review).not.toHaveProperty('helpfulCount');
    });
  });
});