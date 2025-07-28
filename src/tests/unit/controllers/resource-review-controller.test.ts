/**
 * 資源心得評價控制器測試
 * 基於 Prisma 架構的現代化 TypeScript 測試
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
} from '../../../controllers/resource-review.controller';
import resourceReviewService from '../../../services/resource-review.service';
import tagService from '../../../services/tag.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../utils/error-handler';
import { AuthRequest } from '../../../types/auth.types';
import type { ResourceReviewResponse } from '../../../types/resource-review.types';

// Mock dependencies
jest.mock('../../../services/resource-review.service');
jest.mock('../../../services/tag.service');
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
  let next: jest.Mock;
  let mockResourceReviewService: jest.Mocked<typeof resourceReviewService>;
  let mockTagService: jest.Mocked<typeof tagService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockReview = {
    id: '1',
    content: '很棒的資源',
    overallImpact: 5,
    changeMindset: 4,
    solveProblems: 3,
    gainPerspectives: 4,
    achieveGoals: 5,
    avgRating: 4.2,
    timeUsage: null,
    contentFeatures: {
      wellStructured: true,
      practiceFocused: true,
      wellRoundedConcepts: false,
      thoughtProvoking: true,
      progressiveLearning: false,
      problemBased: true,
      realWorldExamples: true,
      interactive: false,
      visuallyRich: false
    },
    resourceUsage: {
      withOnlineCourses: false,
      withBooks: true,
      withOtherTools: false,
      withCommunity: false,
      onlyThisResource: true,
      notApplicableResource: false
    },
    status: 'published',
    likeCount: 0,
    user: {
      id: 1,
      name: 'Test User',
      _id: 'user-test-id',
      roleList: ['user'],
      photoURL: null,
      educationStage: null,
      tagList: [],
      selfIntroduction: null
    },
    resourceId: 'resource-123',
    resource: {
      id: 'resource-123',
      name: '測試資源',
      url: 'https://example.com'
    },
    tags: ['JavaScript', '前端開發'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  } as ResourceReviewResponse;

  const mockReviewList = {
    reviews: [mockReview],
    pagination: {
      cursors: { start: null, end: null },
      hasMore: false,
      count: 1
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

    next = jest.fn();

    // Mock services
    mockResourceReviewService = resourceReviewService as jest.Mocked<typeof resourceReviewService>;
    mockTagService = tagService as jest.Mocked<typeof tagService>;
    
    // Setup default mock responses
    mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);
    mockResourceReviewService.getReviewById.mockResolvedValue(mockReview);
    mockResourceReviewService.createReview.mockResolvedValue(mockReview);
    mockResourceReviewService.updateReview.mockResolvedValue(mockReview);
    mockResourceReviewService.updateReviewStatus.mockResolvedValue(mockReview);
    mockResourceReviewService.deleteReview.mockResolvedValue({ success: true });
    mockResourceReviewService.toggleLikeReview.mockResolvedValue({ success: true });

    // Mock validators
    const validators = require('../../../validators/resource-review.validator');
    validators.validateCreateResourceReview = jest.fn().mockReturnValue({
      content: '很棒的資源',
      score_impact: 5,
      score_mindset: 4,
      score_problems: 3,
      score_perspectives: 4,
      score_goals: 5,
      tags: ['JavaScript', '前端開發']
    });
    validators.validateUpdateResourceReview = jest.fn().mockReturnValue({
      content: '更新後的評價',
      score_impact: 4
    });
    validators.validateUpdateReviewStatus = jest.fn().mockReturnValue({ status: 'published' });
  });

  // ===== 集成測試（更新為符合當前實作） =====
  describe('Integration Tests - GET /resources/:resourceId/reviews', () => {
    it('應該成功獲取特定資源的心得評價列表', async () => {
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
            timeUsage: null,
            contentFeatures: {
              wellStructured: true,
              practiceFocused: true,
              wellRoundedConcepts: true,
              thoughtProvoking: false,
              progressiveLearning: false,
              problemBased: false,
              realWorldExamples: true,
              interactive: false,
              visuallyRich: false
            },
            resourceUsage: {
              withOnlineCourses: false,
              withBooks: false,
              withOtherTools: false,
              withCommunity: false,
              onlyThisResource: true,
              notApplicableResource: false
            },
            status: 'published',
            likeCount: 5,
            user: {
              id: 100,
              name: 'Alice Chen',
              _id: 'user-alice-id',
              roleList: ['user'],
              photoURL: 'https://example.com/avatar.jpg',
              educationStage: null,
              tagList: [],
              selfIntroduction: null
            },
            resourceId: '550e8400-e29b-41d4-a716-446655440000',
            resource: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: '測試資源',
              url: 'https://example.com'
            },
            tags: ['實用', '清晰易懂'],
            createdAt: '2024-01-18T16:45:00Z',
            updatedAt: '2024-01-19T10:20:00Z'
          }
        ],
        pagination: {
          cursors: { start: null, end: null },
          hasMore: false,
          count: 1
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
          resourceId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'published'
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
          cursors: { start: null, end: null },
          hasMore: false,
          count: 0
        }
      };
      (resourceReviewService.getReviews as jest.Mock).mockResolvedValue(mockResponse);

      // 發送請求
      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000/reviews?limit=1&sort=createdAt&order=asc')
        .expect(200);

      // 驗證服務調用
      expect(resourceReviewService.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'published'
        }),
        expect.objectContaining({
          limit: 1,
          sort: 'createdAt',
          order: 'asc'
        })
      );
    });

    it('應該正確處理篩選參數', async () => {
      // 模擬服務返回
      const mockResponse = {
        reviews: [],
        pagination: {
          cursors: { start: null, end: null },
          hasMore: false,
          count: 0
        }
      };
      (resourceReviewService.getReviews as jest.Mock).mockResolvedValue(mockResponse);

      // 發送請求
      const response = await request(app)
        .get('/resources/550e8400-e29b-41d4-a716-446655440000/reviews?minScore=4.0&maxScore=5.0&tags=實用,清晰')
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
          cursors: { start: null, end: null },
          hasMore: false,
          count: 0
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
          resourceId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'published'
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
            timeUsage: null,
            contentFeatures: {
              wellStructured: true,
              practiceFocused: false,
              wellRoundedConcepts: true,
              thoughtProvoking: true,
              progressiveLearning: false,
              problemBased: false,
              realWorldExamples: false,
              interactive: false,
              visuallyRich: false
            },
            resourceUsage: {
              withOnlineCourses: false,
              withBooks: false,
              withOtherTools: false,
              withCommunity: false,
              onlyThisResource: true,
              notApplicableResource: false
            },
            status: 'published',
            likeCount: 2,
            user: {
              id: 100,
              name: 'Test User',
              _id: 'user-test-id',
              roleList: ['user'],
              photoURL: 'https://example.com/avatar.jpg',
              educationStage: null,
              tagList: [],
              selfIntroduction: null
            },
            resourceId: '550e8400-e29b-41d4-a716-446655440000',
            resource: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: '測試資源',
              url: 'https://example.com'
            },
            tags: ['測試'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          cursors: { start: null, end: null },
          hasMore: false,
          count: 1
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
      expect(review).toHaveProperty('overallImpact');
      expect(review).toHaveProperty('changeMindset');
      expect(review).toHaveProperty('solveProblems');
      expect(review).toHaveProperty('gainPerspectives');
      expect(review).toHaveProperty('achieveGoals');
      expect(review).toHaveProperty('status');
      expect(review).toHaveProperty('user');
      expect(review).toHaveProperty('resource');
      expect(review).toHaveProperty('tags');
      
      // 驗證用戶物件結構
      expect(review.user).toHaveProperty('id');
      expect(review.user).toHaveProperty('name');
      expect(review.user).toHaveProperty('photoURL');
      
      // 驗證資源 ID
      expect(review).toHaveProperty('resourceId');
      expect(review.resourceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  // ===== 單元測試（新增的測試） =====
  describe('Unit Tests - getReviewsByResource', () => {
    beforeEach(() => {
      req.params = { resourceId: 'resource-123' };
    });

    it('should successfully get reviews for a resource', async () => {
      mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);

      await getReviewsByResource(req as Request, res as Response, next);

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

      await getReviewsByResource(req as Request, res as Response, next);

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

      await getReviewsByUser(req as Request, res as Response, next);

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

      await getReviewsByUser(req as Request, res as Response, next);

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
      score_impact: 5,
      score_mindset: 4,
      score_problems: 3,
      score_perspectives: 4,
      score_goals: 5,
      tags: ['JavaScript', '前端開發']
    };

    beforeEach(() => {
      req.params = { resourceId: 'resource-123' };
      req.body = createReviewData;
    });

    it('should successfully create a review', async () => {
      mockResourceReviewService.createReview.mockResolvedValue(mockReview);

      await createReview(req as Request, res as Response, next);

      expect(mockResourceReviewService.createReview).toHaveBeenCalledWith(
        'resource-123',
        expect.objectContaining({
          content: '很棒的資源',
          score_impact: 5,
          score_mindset: 4,
          score_problems: 3,
          score_perspectives: 4,
          score_goals: 5,
          tags: ['JavaScript', '前端開發']
        }),
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

      await createReview(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '必須登入才能創建心得評價',
          statusCode: 400
        })
      );
    });
  });

  describe('Unit Tests - updateReview', () => {
    const updateData = {
      content: '更新後的評價',
      score_impact: 4
    };

    beforeEach(() => {
      req.params = { reviewId: '1' };
      req.body = updateData;
    });

    it('should successfully update a review', async () => {
      const updatedReview = { ...mockReview, content: '更新後的評價', overallImpact: 4 };
      mockResourceReviewService.updateReview.mockResolvedValue(updatedReview);

      await updateReview(req as Request, res as Response, next);

      expect(mockResourceReviewService.updateReview).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          content: '更新後的評價',
          score_impact: 4
        }),
        1
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedReview
      });
    });

    it('should handle unauthenticated user', async () => {
      req.user = undefined;

      await updateReview(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '必須登入才能更新心得評價',
          statusCode: 400
        })
      );
    });
  });

  describe('Unit Tests - deleteReview', () => {
    beforeEach(() => {
      req.params = { reviewId: '1' };
    });

    it('should successfully delete a review', async () => {
      mockResourceReviewService.deleteReview.mockResolvedValue({ success: true });

      await deleteReview(req as Request, res as Response, next);

      expect(mockResourceReviewService.deleteReview).toHaveBeenCalledWith(1, 1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '心得評價已成功刪除'
      });
    });

    it('should handle unauthenticated user', async () => {
      req.user = undefined;

      await deleteReview(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '必須登入才能刪除心得評價',
          statusCode: 400
        })
      );
    });
  });

  describe('Unit Tests - likeReview', () => {
    beforeEach(() => {
      req.params = { reviewId: '1' };
    });

    it('should successfully like a review', async () => {
      mockResourceReviewService.toggleLikeReview.mockResolvedValue({ success: true });

      await likeReview(req as Request, res as Response, next);

      expect(mockResourceReviewService.toggleLikeReview).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '已成功點讚心得評價'
      });
    });

    it('should handle unauthenticated user', async () => {
      req.user = undefined;

      await likeReview(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '必須登入才能點讚心得評價',
          statusCode: 400
        })
      );
    });
  });

  describe('Unit Tests - getReviewTags', () => {
    beforeEach(() => {
      req.params = { reviewId: '1' };
    });

    it('should successfully get review tags', async () => {
      const mockTags = [
        { id: 1, name: 'JavaScript' },
        { id: 2, name: 'React' }
      ] as any;

      mockTagService.getEntityTags.mockResolvedValue(mockTags);

      await getReviewTags(req as Request, res as Response, next);

      expect(mockTagService.getEntityTags).toHaveBeenCalledWith('resource_review', '1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: ['JavaScript', 'React']
      });
    });
  });

  describe('Unit Tests - getReviews (general)', () => {
    it('should successfully get all reviews', async () => {
      mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);

      await getReviews(req as Request, res as Response, next);

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

      await getReviews(req as Request, res as Response, next);

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
      const serviceError = new Error('Service error');
      mockResourceReviewService.getReviews.mockRejectedValue(serviceError);

      // 由於 asyncWrapper 會捕獲異步錯誤，我們需要等待 Promise 解決
      const result = getReviewsByResource(req as Request, res as Response, next);
      await new Promise(resolve => setTimeout(resolve, 0)); // 等待下一個事件循環

      expect(next).toHaveBeenCalledWith(serviceError);
    });

    it('should handle malformed query parameters', async () => {
      req.query = {
        limit: 'not-a-number',
        minScore: 'invalid',
        maxScore: 'also-invalid'
      };

      mockResourceReviewService.getReviews.mockResolvedValue(mockReviewList);

      await getReviews(req as Request, res as Response, next);

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