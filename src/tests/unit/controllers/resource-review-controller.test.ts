/**
 * 資源評論控制器完整測試
 * 包含原有的集成測試和新增的單元測試
 */

import request from 'supertest';
import express from 'express';
import { Request, Response } from 'express';
import resourceReviewController, {
  getReviewsByResource,
  getReviewsByUser,
  getReviewById,
  createReview,
  updateReview,
  updateReviewStatus,
  deleteReview,
  likeReview,
  unlikeReview,
  getReviewTags,
  getReviews
} from '../../../controllers/resource-review-controller';
import resourceReviewService from '../../../services/resource-review-service';
import tagService from '../../../services/tag-service';
import { BadRequestError } from '../../../utils/error-handler';
import { AuthRequest } from '../../../types/auth.types';

// Mock dependencies
jest.mock('../../../services/resource-review-service');
jest.mock('../../../services/tag-service');
jest.mock('../../../validators/resource-review.validator');

// 創建測試用的 Express 應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 設置路由（模擬嵌套路由）
  app.get('/resources/:resourceId/reviews', resourceReviewController.getReviewsByResource);
  app.get('/reviews', resourceReviewController.getReviews);
  
  return app;
};

describe('Resource Review Controller Tests', () => {
  let app: express.Application;
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let mockResourceReviewService: jest.Mocked<typeof resourceReviewService>;
  let mockTagService: jest.Mocked<typeof tagService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockReview = {
    id: 1,
    resourceId: 'resource-123',
    userId: 1,
    content: '很棒的資源',
    score: {
      overall_impact: 5,
      thinking_change: 4,
      life_change: 3,
      behavior_change: 4,
      skill_development: 5
    },
    tags: ['JavaScript', '前端開發'],
    status: 'published',
    created_at: new Date(),
    updated_at: new Date(),
    stats: {
      likes_count: 10
    }
  };

  const mockReviewList = {
    reviews: [mockReview],
    pagination: {
      current_cursor: null,
      next_cursor: 'next-cursor',
      has_more: false,
      total_estimate: 1
    }
  };

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();

    // Setup unit test mocks
    req = {
      user: mockUser,
      params: {},
      query: {},
      body: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    // Mock services
    mockResourceReviewService = resourceReviewService as jest.Mocked<typeof resourceReviewService>;
    mockTagService = tagService as jest.Mocked<typeof tagService>;

    // Mock validators
    const validators = require('../../../validators/resource-review.validator');
    validators.validateCreateResourceReview = jest.fn().mockReturnValue(mockReview);
    validators.validateUpdateResourceReview = jest.fn().mockReturnValue(mockReview);
    validators.validateUpdateReviewStatus = jest.fn().mockReturnValue({ status: 'published' });
  });

  // ===== 集成測試（原有的測試保留） =====
  describe('Integration Tests - GET /resources/:resourceId/reviews', () => {
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

  // ===== 單元測試（新增的測試） =====
  describe('Unit Tests - getReviewsByResource', () => {
    beforeEach(() => {
      req.params = { resourceId: 'resource-123' };
    });

    it('should successfully get reviews for a resource', async () => {
      mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);

      await getReviewsByResource(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.getReviews).toHaveBeenCalledWith(
        {
          resourceId: 'resource-123',
          status: 'published'
        },
        {}
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReviewList
      });
    });

    it('should handle query parameters', async () => {
      req.query = {
        cursor: 'test-cursor',
        limit: '10',
        tags: 'JavaScript,React',
        sort: 'createdAt',
        order: 'asc',
        minScore: '3',
        maxScore: '5'
      };

      mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);

      await getReviewsByResource(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.getReviews).toHaveBeenCalledWith(
        {
          resourceId: 'resource-123',
          status: 'published',
          tags: ['JavaScript', 'React'],
          minScore: 3,
          maxScore: 5
        },
        {
          cursor: 'test-cursor',
          limit: 10,
          sort: 'createdAt',
          order: 'asc'
        }
      );
    });
  });

  describe('Unit Tests - getReviewsByUser', () => {
    beforeEach(() => {
      req.params = { userId: '1' };
    });

    it('should get reviews for current user (all statuses)', async () => {
      mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);

      await getReviewsByUser(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.getReviews).toHaveBeenCalledWith(
        {
          userId: 1
        },
        {}
      );
    });

    it('should get reviews for different user (published only)', async () => {
      req.params = { userId: '2' };

      mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);

      await getReviewsByUser(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.getReviews).toHaveBeenCalledWith(
        {
          userId: 2,
          status: 'published'
        },
        {}
      );
    });
  });

  describe('Unit Tests - createReview', () => {
    const createReviewData = {
      content: '很棒的資源',
      score: {
        overall_impact: 5,
        thinking_change: 4,
        life_change: 3,
        behavior_change: 4,
        skill_development: 5
      },
      tags: ['JavaScript', '前端開發']
    };

    beforeEach(() => {
      req.params = { resourceId: '123' };
      req.body = createReviewData;
    });

    it('should successfully create a review', async () => {
      mockResourceReviewService.createReview.mockResolvedValue(mockReview);

      await createReview(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.createReview).toHaveBeenCalledWith(
        123,
        mockReview,
        1
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReview
      });
    });

    it('should handle unauthenticated user', async () => {
      req.user = undefined;

      await expect(createReview(req as AuthRequest, res as Response))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('Unit Tests - updateReview', () => {
    const updateData = {
      content: '更新後的評價',
      score: { overall_impact: 4 }
    };

    beforeEach(() => {
      req.params = { id: '1' };
      req.body = updateData;
    });

    it('should successfully update a review', async () => {
      const updatedReview = { ...mockReview, ...updateData };
      mockResourceReviewService.updateReview.mockResolvedValue(updatedReview);

      await updateReview(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.updateReview).toHaveBeenCalledWith(
        1,
        mockReview,
        1
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedReview
      });
    });

    it('should handle unauthenticated user', async () => {
      req.user = undefined;

      await expect(updateReview(req as AuthRequest, res as Response))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('Unit Tests - deleteReview', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('should successfully delete a review', async () => {
      mockResourceReviewService.deleteReview.mockResolvedValue({ success: true });

      await deleteReview(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.deleteReview).toHaveBeenCalledWith(1, 1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '心得評價已成功刪除'
      });
    });

    it('should handle unauthenticated user', async () => {
      req.user = undefined;

      await expect(deleteReview(req as AuthRequest, res as Response))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('Unit Tests - likeReview', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('should successfully like a review', async () => {
      mockResourceReviewService.toggleLikeReview.mockResolvedValue({ success: true });

      await likeReview(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.toggleLikeReview).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '已成功點讚心得評價'
      });
    });

    it('should handle unauthenticated user', async () => {
      req.user = undefined;

      await expect(likeReview(req as AuthRequest, res as Response))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('Unit Tests - getReviewTags', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('should successfully get review tags', async () => {
      const mockTags = [
        { name: 'JavaScript' },
        { name: 'React' }
      ] as any;

      mockTagService.getEntityTags.mockResolvedValue(mockTags);

      await getReviewTags(req as AuthRequest, res as Response);

      expect(mockTagService.getEntityTags).toHaveBeenCalledWith(1, 'resource_review');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: ['JavaScript', 'React']
      });
    });
  });

  describe('Unit Tests - getReviews (general)', () => {
    it('should successfully get all reviews', async () => {
      mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);

      await getReviews(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.getReviews).toHaveBeenCalledWith({}, {});
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReviewList
      });
    });

    it('should handle all query parameters', async () => {
      req.query = {
        cursor: 'all-cursor',
        limit: '15',
        tags: 'Backend,Database',
        sort: 'score',
        order: 'desc',
        status: 'published',
        minScore: '2',
        maxScore: '5'
      };

      mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);

      await getReviews(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.getReviews).toHaveBeenCalledWith(
        {
          status: 'published',
          minScore: 2,
          maxScore: 5,
          tags: ['Backend', 'Database']
        },
        {
          cursor: 'all-cursor',
          limit: 15,
          sort: 'score',
          order: 'desc'
        }
      );
    });
  });

  describe('Unit Tests - Error Handling', () => {
    it('should handle service errors', async () => {
      req.params = { resourceId: 'resource-123' };
      mockResourceReviewService.getReviews.mockRejectedValue(new Error('Service error'));

      await expect(getReviewsByResource(req as AuthRequest, res as Response))
        .rejects.toThrow('Service error');
    });

    it('should handle malformed query parameters', async () => {
      req.query = {
        limit: 'not-a-number',
        minScore: 'invalid',
        maxScore: 'also-invalid'
      };

      mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);

      await getReviews(req as AuthRequest, res as Response);

      expect(mockResourceReviewService.getReviews).toHaveBeenCalledWith(
        {
          minScore: NaN,
          maxScore: NaN
        },
        {
          limit: NaN
        }
      );
    });
  });
});