/**
 * Resource Review API 整合測試
 * 測試資源心得評價相關的巢狀 API 端點
 */

import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '@/types/auth.types';

// 模擬認證中間件
jest.mock('@/middleware/auth', () => ({
  authenticate: (req: AuthRequest, res: Response, next: NextFunction) => {
    req.user = { 
      id: 1, 
      username: 'testuser', 
      email: 'test@example.com',
      external_id: 'user-1'
    };
    next();
  },
  optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => {
    req.user = { 
      id: 1, 
      username: 'testuser', 
      email: 'test@example.com',
      external_id: 'user-1'
    };
    next();
  },
  requireRole: () => (req: AuthRequest, res: Response, next: NextFunction) => next()
}));

// 模擬驗證中間件
jest.mock('@/validators/validation.middleware', () => ({
  validate: () => (req: Request, res: Response, next: NextFunction) => next()
}));

// 模擬資源評價服務 - 使用實際的函數簽名
const mockGetReviews = jest.fn();
const mockGetReviewById = jest.fn();
const mockCreateReview = jest.fn();
const mockUpdateReview = jest.fn();
const mockUpdateReviewStatus = jest.fn();
const mockDeleteReview = jest.fn();
const mockToggleLikeReview = jest.fn();

jest.mock('@/services/resource-review.service', () => ({
  getReviews: mockGetReviews,
  getReviewById: mockGetReviewById,
  createReview: mockCreateReview,
  updateReview: mockUpdateReview,
  updateReviewStatus: mockUpdateReviewStatus,
  deleteReview: mockDeleteReview,
  toggleLikeReview: mockToggleLikeReview,
  default: {
    getReviews: mockGetReviews,
    getReviewById: mockGetReviewById,
    createReview: mockCreateReview,
    updateReview: mockUpdateReview,
    updateReviewStatus: mockUpdateReviewStatus,
    deleteReview: mockDeleteReview,
    toggleLikeReview: mockToggleLikeReview
  }
}));

// 模擬驗證函數
jest.mock('@/validators/resource-review.validator', () => ({
  validateCreateResourceReview: jest.fn((data) => ({
    content: data.content || 'Test content',
    overallImpact: data.overallImpact || 5,
    changeMindset: data.changeMindset || 4,
    solveProblems: data.solveProblems || 5,
    gainPerspectives: data.gainPerspectives || 4,
    achieveGoals: data.achieveGoals || 5,
    timeUsage: data.timeUsage || null,
    contentFeatures: data.contentFeatures || {},
    resourceUsage: data.resourceUsage || {},
    tags: data.tags || []
  })),
  validateUpdateResourceReview: jest.fn((data) => data),
  validateUpdateReviewStatus: jest.fn((data) => ({ status: data.status }))
}));

import resourceReviewRoutes from '@/routes/resource-review.routes';

describe('Resource Review API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    // 設置測試環境
    process.env.NODE_ENV = 'test';
    
    app = express();
    app.use(express.json());
    
    // 設置巢狀路由
    app.use('/api/v1/resources/:resourceId/reviews', resourceReviewRoutes);
    
    // 錯誤處理中間件
    app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
      const error = err as { statusCode?: number; message?: string; code?: string };
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message || 'Internal Server Error',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 設置默認的服務模擬行為
    mockGetReviews.mockResolvedValue({
      reviews: [
        {
          id: 'review-1',
          content: '這是一個很好的資源，推薦給大家！',
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
            wellRoundedConcepts: false,
            thoughtProvoking: true,
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
          likeCount: 10,
          user: {
            id: 'user-1',
            name: '評價者1',
            avatar: null
          },
          resourceId: 'resource-1',
          tags: ['Excellent', 'Helpful'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      pagination: {
        cursors: { start: null, end: null },
        hasMore: false,
        count: 1,
        limit: 20,
        hasNext: false,
        hasPrev: false,
        nextCursor: null,
        prevCursor: null
      }
    });

    mockGetReviewById.mockImplementation((reviewId: number) => {
      if (reviewId === 1) {
        return Promise.resolve({
          id: 'review-1',
          content: '這是一個詳細的評價內容，包含了對資源的深入分析。',
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
            wellRoundedConcepts: false,
            thoughtProvoking: true,
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
          likeCount: 15,
          user: {
            id: 'user-1',
            name: '評價者1',
            avatar: 'https://example.com/avatar1.jpg'
          },
          resourceId: 'resource-1',
          tags: ['Excellent', 'Helpful', 'Comprehensive'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        return Promise.reject(new Error('評價不存在'));
      }
    });

    mockCreateReview.mockResolvedValue({
      id: 'new-review-id',
      content: '新的評價內容',
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
        wellRoundedConcepts: false,
        thoughtProvoking: true,
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
      likeCount: 0,
      user: {
        id: 'user-1',
        name: '測試用戶',
        avatar: null
      },
      resourceId: 'resource-1',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    mockUpdateReview.mockResolvedValue({
      id: 'review-1',
      content: '更新後的評價內容',
      overallImpact: 4,
      changeMindset: 4,
      solveProblems: 4,
      gainPerspectives: 4,
      achieveGoals: 4,
      avgRating: 4.0,
      timeUsage: null,
      contentFeatures: {
        wellStructured: true,
        practiceFocused: true,
        wellRoundedConcepts: false,
        thoughtProvoking: true,
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
      likeCount: 10,
      user: {
        id: 'user-1',
        name: '測試用戶',
        avatar: null
      },
      resourceId: 'resource-1',
      tags: ['Updated'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    mockUpdateReviewStatus.mockResolvedValue({
      id: 'review-1',
      status: 'archived',
      updatedAt: new Date().toISOString()
    });

    mockDeleteReview.mockResolvedValue({ success: true });

    mockToggleLikeReview.mockResolvedValue({ success: true });
  });

  describe('GET /api/v1/resources/:resourceId/reviews', () => {
    it('should return reviews list for specific resource', async () => {
      const response = await request(app)
        .get('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object)
      });

      expect(response.body.data.reviews).toHaveLength(1);
      expect(response.body.data.reviews[0]).toMatchObject({
        id: 'review-1',
        content: expect.any(String),
        overallImpact: 5,
        resourceId: 'resource-1'
      });
      
      expect(mockGetReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: '123e4567-e89b-12d3-a456-426614174000',
          status: 'published'
        }),
        expect.any(Object)
      );
    });

    it('should handle query parameters for reviews filtering', async () => {
      await request(app)
        .get('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews')
        .query({
          cursor: 'cursor-value',
          limit: 10,
          sort: 'created_at',
          order: 'desc',
          minScore: 4,
          maxScore: 5,
          tags: 'Excellent,Helpful'
        })
        .expect(200);

      expect(mockGetReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: '123e4567-e89b-12d3-a456-426614174000',
          status: 'published',
          tags: ['Excellent', 'Helpful'],
          minScore: 4,
          maxScore: 5
        }),
        expect.objectContaining({
          cursor: 'cursor-value',
          limit: 10,
          sort: 'created_at',
          order: 'desc'
        })
      );
    });

    it('should handle empty reviews list', async () => {
      mockGetReviews.mockResolvedValue({
        reviews: [],
        pagination: {
          cursors: { start: null, end: null },
          hasMore: false,
          count: 0,
          limit: 20,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null
        }
      });

      const response = await request(app)
        .get('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews')
        .expect(200);

      expect(response.body.data.reviews).toHaveLength(0);
      expect(response.body.data.pagination.count).toBe(0);
    });
  });

  describe('GET /api/v1/resources/:resourceId/reviews/:reviewId', () => {
    it('should return specific review details', async () => {
      const response = await request(app)
        .get('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews/1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: 'review-1',
          content: expect.any(String),
          overallImpact: 5,
          likeCount: expect.any(Number),
          resourceId: 'resource-1'
        }
      });
      
      expect(mockGetReviewById).toHaveBeenCalledWith(1);
    });

    it('should return 500 for non-existent review', async () => {
      mockGetReviewById.mockRejectedValue(new Error('評價不存在'));

      const response = await request(app)
        .get('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews/999')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '評價不存在'
        }
      });
    });
  });

  describe('POST /api/v1/resources/:resourceId/reviews', () => {
    it('should create new review successfully', async () => {
      const reviewData = {
        content: '這是一個新的評價，內容詳細且有用。',
        overallImpact: 4,
        changeMindset: 4,
        solveProblems: 4,
        gainPerspectives: 4,
        achieveGoals: 4,
        tags: ['Good', 'Useful', 'Detailed']
      };

      const response = await request(app)
        .post('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews')
        .send(reviewData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          content: '新的評價內容',
          overallImpact: 5,
          resourceId: 'resource-1'
        }
      });
      
      expect(mockCreateReview).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000', // resourceExternalId as string
        expect.objectContaining({
          content: expect.any(String),
          overallImpact: expect.any(Number),
          changeMindset: expect.any(Number),
          solveProblems: expect.any(Number),
          gainPerspectives: expect.any(Number),
          achieveGoals: expect.any(Number)
        }),
        1 // user id
      );
    });

    it('should handle service errors gracefully', async () => {
      mockCreateReview.mockRejectedValue(new Error('您已經對此資源發表過評價'));

      const response = await request(app)
        .post('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews')
        .send({
          content: '重複評價',
          overallImpact: 3,
          changeMindset: 3,
          solveProblems: 3,
          gainPerspectives: 3,
          achieveGoals: 3
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '您已經對此資源發表過評價'
        }
      });
    });
  });

  describe('PATCH /api/v1/resources/:resourceId/reviews/:reviewId', () => {
    it('should update review successfully', async () => {
      const updateData = {
        content: '更新後的評價內容，更加詳細。',
        overallImpact: 5,
        changeMindset: 5,
        solveProblems: 5,
        gainPerspectives: 5,
        achieveGoals: 5,
        tags: ['Updated', 'Excellent']
      };

      const response = await request(app)
        .patch('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: 'review-1',
          content: '更新後的評價內容',
          overallImpact: 4,
          tags: ['Updated']
        }
      });
      
      expect(mockUpdateReview).toHaveBeenCalledWith(
        1, // review id
        expect.objectContaining({
          content: updateData.content,
          overallImpact: updateData.overallImpact,
          changeMindset: updateData.changeMindset,
          solveProblems: updateData.solveProblems,
          gainPerspectives: updateData.gainPerspectives,
          achieveGoals: updateData.achieveGoals,
          tags: updateData.tags
        }),
        1 // user id
      );
    });

    it('should handle permission errors', async () => {
      mockUpdateReview.mockRejectedValue(new Error('無權限修改此評價'));

      const response = await request(app)
        .patch('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews/1')
        .send({ content: '嘗試更新' })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '無權限修改此評價'
        }
      });
    });
  });

  describe('PATCH /api/v1/resources/:resourceId/reviews/:reviewId/status', () => {
    it('should update review status successfully', async () => {
      const statusUpdate = {
        status: 'archived'
      };

      const response = await request(app)
        .patch('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews/1/status')
        .send(statusUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: 'review-1',
          status: 'archived'
        }
      });
      
      expect(mockUpdateReviewStatus).toHaveBeenCalledWith(
        1, // review id
        'archived',
        1 // user id
      );
    });
  });

  describe('DELETE /api/v1/resources/:resourceId/reviews/:reviewId', () => {
    it('should delete review successfully', async () => {
      const response = await request(app)
        .delete('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews/1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: '心得評價已成功刪除'
      });
      
      expect(mockDeleteReview).toHaveBeenCalledWith(1, 1);
    });

    it('should handle permission errors when deleting', async () => {
      mockDeleteReview.mockRejectedValue(new Error('無權限刪除此評價'));

      const response = await request(app)
        .delete('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews/1')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '無權限刪除此評價'
        }
      });
    });
  });

  describe('POST /api/v1/resources/:resourceId/reviews/:reviewId/like', () => {
    it('should like review successfully', async () => {
      const response = await request(app)
        .post('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews/1/like')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: '已成功點讚心得評價'
      });
      
      expect(mockToggleLikeReview).toHaveBeenCalledWith(1);
    });

    it('should handle service errors', async () => {
      mockToggleLikeReview.mockRejectedValue(new Error('您已經讚過此評價'));

      const response = await request(app)
        .post('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews/1/like')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '您已經讚過此評價'
        }
      });
    });
  });

  describe('DELETE /api/v1/resources/:resourceId/reviews/:reviewId/like', () => {
    it('should unlike review successfully', async () => {
      const response = await request(app)
        .delete('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews/1/like')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: '已成功取消點讚心得評價'
      });
      
      expect(mockToggleLikeReview).toHaveBeenCalledWith(1);
    });
  });

  describe('Nested Route Behavior', () => {
    it('should properly handle resource ID parameter in all nested routes', async () => {
      const resourceId = '456e7890-f12a-34b5-c678-901234567890';
      
      // 測試所有巢狀路由都能正確接收 resourceId
      await request(app)
        .get(`/api/v1/resources/${resourceId}/reviews`)
        .expect(200);

      await request(app)
        .get(`/api/v1/resources/${resourceId}/reviews/1`)
        .expect(200);

      await request(app)
        .post(`/api/v1/resources/${resourceId}/reviews`)
        .send({ 
          content: '測試', 
          overallImpact: 5,
          changeMindset: 5,
          solveProblems: 5,
          gainPerspectives: 5,
          achieveGoals: 5
        })
        .expect(201);

      // 驗證所有調用都接收到正確的 resourceId
      expect(mockGetReviews).toHaveBeenCalledWith(
        expect.objectContaining({ resourceId }),
        expect.any(Object)
      );
      expect(mockGetReviewById).toHaveBeenCalled();
      expect(mockCreateReview).toHaveBeenCalledWith(
        resourceId, // 確認 resourceId 作為字串正確傳遞
        expect.any(Object),
        1
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockGetReviews.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews')
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
        .post('/api/v1/resources/123e4567-e89b-12d3-a456-426614174000/reviews')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBeFalsy();
    });
  });

  afterAll(() => {
    delete process.env.NODE_ENV;
  });
});