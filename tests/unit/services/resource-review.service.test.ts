/**
 * 資源心得評價服務測試
 * 基於 Prisma 架構的現代化 TypeScript 測試
 */

import { mockPrisma } from '@/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: mockPrisma
}));

jest.mock('@/services/tag.service', () => ({
  __esModule: true,
  default: {
    setEntityTags: jest.fn().mockResolvedValue([]),
    getEntityTags: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('@/services/transform.service', () => ({
  transformReviewToApi: jest.fn().mockImplementation((data) => data),
  transformReviewToDb: jest.fn().mockImplementation((data, userId, resourceId) => ({
    user_id: userId,
    resource_id: resourceId,
    content: data.content,
    score_impact: data.score_impact || 5,
    score_mindset: data.score_mindset || 4,
    score_problems: data.score_problems || 3,
    score_perspectives: data.score_perspectives || 4,
    score_goals: data.score_goals || 5,
    status: data.status || 'published'
  }))
}));

jest.mock('@/utils/transform-utils', () => ({
  decodeCursor: jest.fn().mockReturnValue({ id: 10, timestamp: '2024-01-01T00:00:00Z' }),
  generatePaginationMetadata: jest.fn().mockReturnValue({
    cursors: { start: null, end: null },
    hasMore: false,
    count: 1
  })
}));

import resourceReviewService, {
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  toggleLikeReview
} from '@/services/resource-review.service';
import tagService from '@/services/tag.service';
import { transformReviewToApi, transformReviewToDb } from '@/services/transform.service';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError
} from '@/utils/error-handler';
import { decodeCursor, generatePaginationMetadata } from '@/utils/transform-utils';
import type { ResourceReviewResponse } from '@/types/resource-review.types';

describe('Resource Review Service Tests', () => {
  const mockReviewData = {
    id: 1,
    user_id: 1,
    resource_id: 1,
    content: '很棒的資源',
    score_impact: 5,
    score_mindset: 4,
    score_problems: 3,
    score_perspectives: 4,
    score_goals: 5,
    status: 'published',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null,
    users: {
      id: 1,
      nickname: 'TestUser',
      contacts: {
        photo_url: 'https://example.com/avatar.jpg'
      }
    },
    resources: {
      id: 1,
      external_id: 'resource-123',
      name: '測試資源',
      url: 'https://example.com'
    }
  };

  const mockResource = {
    id: 1,
    external_id: 'resource-123',
    name: '測試資源'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReviews', () => {
    it('應該使用預設分頁參數獲取心得評價列表', async () => {
      const mockReviews = [mockReviewData];

      mockPrisma.resource_review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      const result = await resourceReviewService.getReviews({}, {});

      expect(mockPrisma.resource_review.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          status: 'published'
        },
        include: expect.objectContaining({
          users: expect.any(Object),
          resources: expect.any(Object)
        }),
        orderBy: { created_at: 'desc' },
        take: 3 // DEFAULT_REVIEW_PAGE_LIMIT + 1
      });

      expect(result).toEqual({
        reviews: expect.any(Array),
        pagination: expect.any(Object)
      });
    });

    it('應該限制最大分頁數量為10筆', async () => {
      mockPrisma.resource_review.findMany.mockResolvedValue([]);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      await resourceReviewService.getReviews({}, { limit: 25 });

      expect(mockPrisma.resource_review.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          status: 'published'
        },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
        take: 11 // MAX_REVIEW_PAGE_LIMIT + 1 (10 + 1)
      });
    });

    it('應該正確處理游標分頁', async () => {
      mockPrisma.resource_review.findMany.mockResolvedValue([]);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      const cursor = Buffer.from(JSON.stringify({
        id: 10,
        timestamp: '2024-01-01T00:00:00Z'
      })).toString('base64');

      await resourceReviewService.getReviews({}, {
        cursor,
        limit: 2
      });

      expect(mockPrisma.resource_review.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          status: 'published',
          created_at: {
            lt: '2024-01-01T00:00:00Z'
          }
        },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
        take: 3 // limit + 1 (2 + 1)
      });
    });

    it('應該正確處理排序參數', async () => {
      mockPrisma.resource_review.findMany.mockResolvedValue([]);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      await resourceReviewService.getReviews({}, {
        sort: 'createdAt',
        order: 'asc'
      });

      expect(mockPrisma.resource_review.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: expect.any(Object),
        orderBy: { created_at: 'asc' },
        take: expect.any(Number)
      });
    });

    it('應該正確處理篩選參數', async () => {
      mockPrisma.resource_review.findMany.mockResolvedValue([]);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      await resourceReviewService.getReviews({
        resourceId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 100
      }, {});

      expect(mockPrisma.resource_review.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          status: 'published',
          user_id: 100,
          resources: {
            external_id: '550e8400-e29b-41d4-a716-446655440000'
          }
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: expect.any(Number)
      });
    });

    it('應該正確處理評分範圍篩選', async () => {
      mockPrisma.resource_review.findMany.mockResolvedValue([]);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      await resourceReviewService.getReviews({
        minScore: 3.0,
        maxScore: 5.0
      }, {});

      expect(mockPrisma.resource_review.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          status: 'published',
          score_impact: {
            gte: 3.0,
            lte: 5.0
          }
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: expect.any(Number)
      });
    });

    it('應該正確處理標籤篩選', async () => {
      const mockTaggedReviewIds = [
        { entity_id: '1' },
        { entity_id: '2' }
      ];

      mockPrisma.entity_tags.findMany.mockResolvedValue(mockTaggedReviewIds);
      mockPrisma.resource_review.findMany.mockResolvedValue([]);

      await resourceReviewService.getReviews({
        tags: ['javascript', 'react']
      }, {});

      expect(mockPrisma.entity_tags.findMany).toHaveBeenCalledWith({
        where: {
          entity_type: 'resource_review',
          tags: {
            name: {
              in: ['javascript', 'react']
            }
          }
        },
        select: {
          entity_id: true
        }
      });

      expect(mockPrisma.resource_review.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          status: 'published',
          id: {
            in: [1, 2] // entity_id 轉為 number
          }
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: expect.any(Number)
      });
    });
  });

  describe('getReviewById', () => {
    it('應該成功獲取心得評價詳情', async () => {
      mockPrisma.resource_review.findUnique.mockResolvedValue(mockReviewData);
      mockPrisma.entity_tags.findMany.mockResolvedValue([
        {
          entity_id: '1',
          tags: { id: 1, name: 'javascript' }
        }
      ]);

      const result = await getReviewById(1);

      expect(mockPrisma.resource_review.findUnique).toHaveBeenCalledWith({
        where: { id: 1, deleted_at: null },
        include: {
          users: {
            select: {
              id: true,
              nickname: true,
              contacts: {
                select: {
                  photo_url: true
                }
              }
            }
          },
          resources: {
            select: {
              id: true,
              external_id: true,
              name: true,
              url: true
            }
          }
        }
      });

      expect(transformReviewToApi).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('應該在心得評價不存在時拋出 NotFoundError', async () => {
      mockPrisma.resource_review.findUnique.mockResolvedValue(null);

      await expect(getReviewById(999)).rejects.toThrow(NotFoundError);
      await expect(getReviewById(999)).rejects.toThrow('找不到 ID 為 999 的心得評價');
    });
  });

  describe('createReview', () => {
    const reviewData = {
      content: '很棒的資源',
      score_impact: 5,
      score_mindset: 4,
      score_problems: 3,
      score_perspectives: 4,
      score_goals: 5,
      tags: ['JavaScript', 'React']
    };

    it('應該成功創建心得評價', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.findUnique.mockResolvedValue(mockResource);
      mockPrisma.resource_review.findFirst.mockResolvedValue(null);
      mockPrisma.resource_review.create.mockResolvedValue(mockReviewData);

      // Mock getReviewById 中的 Prisma 查詢
      mockPrisma.resource_review.findUnique.mockResolvedValue({
        ...mockReviewData,
        users: {
          id: 1,
          nickname: 'TestUser',
          contacts: {
            photo_url: null
          }
        },
        resources: {
          id: 1,
          external_id: 'resource-123',
          name: 'Test Resource',
          url: 'https://example.com'
        }
      });
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      const result = await createReview('resource-123', reviewData as any, 1);

      expect(mockPrisma.resources.findUnique).toHaveBeenCalledWith({
        where: { external_id: 'resource-123' }
      });
      expect(mockPrisma.resource_review.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          resource_id: 1,
          deleted_at: null
        }
      });
      expect(transformReviewToDb).toHaveBeenCalledWith(reviewData, 1, 1);
      expect(mockPrisma.resource_review.create).toHaveBeenCalled();
      expect(tagService.setEntityTags).toHaveBeenCalledWith(
        'resource_review',
        '1',
        ['JavaScript', 'React'],
        1,
        mockPrisma
      );
      expect(result).toBeDefined();

    });

    it('應該在資源不存在時拋出 NotFoundError', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.findUnique.mockResolvedValue(null);

      await expect(createReview('999', reviewData as any, 1)).rejects.toThrow(NotFoundError);
    });

    it('應該在用戶已評價過該資源時拋出 ConflictError', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.findUnique.mockResolvedValue(mockResource);
      mockPrisma.resource_review.findFirst.mockResolvedValue(mockReviewData);

      await expect(createReview('resource-123', reviewData as any, 1)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateReview', () => {
    const updateData = {
      content: '更新的評價',
      score_impact: 4,
      tags: ['Updated', 'Tags']
    };

    it('應該成功更新心得評價', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resource_review.findUnique.mockResolvedValue(mockReviewData);
      mockPrisma.resource_review.update.mockResolvedValue({
        ...mockReviewData,
        content: '更新的評價'
      });

      const getReviewByIdSpy = jest.spyOn(resourceReviewService, 'getReviewById')
        .mockResolvedValue(mockReviewData as any);

      const result = await updateReview(1, updateData as any, 1);

      expect(mockPrisma.resource_review.findUnique).toHaveBeenCalledWith({
        where: { id: 1, deleted_at: null }
      });
      expect(transformReviewToDb).toHaveBeenCalledWith(
        updateData,
        1,
        mockReviewData.resource_id
      );
      expect(mockPrisma.resource_review.update).toHaveBeenCalled();
      expect(tagService.setEntityTags).toHaveBeenCalledWith(
        'resource_review',
        '1',
        ['Updated', 'Tags'],
        1,
        mockPrisma
      );
      expect(result).toBeDefined();

    });

    it('應該在用戶不是擁有者時拋出 ForbiddenError', async () => {
      const differentUserReview = { ...mockReviewData, user_id: 2 };
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resource_review.findUnique.mockResolvedValue(differentUserReview);

      await expect(updateReview(1, updateData as any, 1)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteReview', () => {
    it('應該成功軟刪除心得評價', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resource_review.findUnique.mockResolvedValue(mockReviewData);
      mockPrisma.resource_review.update.mockResolvedValue({
        ...mockReviewData,
        deleted_at: new Date()
      });

      const result = await deleteReview(1, 1);

      expect(mockPrisma.resource_review.findUnique).toHaveBeenCalledWith({
        where: { id: 1, deleted_at: null }
      });
      expect(mockPrisma.resource_review.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deleted_at: expect.any(Date) }
      });
      expect(result).toEqual({ success: true });
    });

    it('應該在用戶不是擁有者時拋出 ForbiddenError', async () => {
      const differentUserReview = { ...mockReviewData, user_id: 2 };
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resource_review.findUnique.mockResolvedValue(differentUserReview);

      await expect(deleteReview(1, 1)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('toggleLikeReview', () => {
    it('應該成功切換心得評價的點讚狀態', async () => {
      mockPrisma.resource_review.findUnique.mockResolvedValue(mockReviewData);

      const result = await toggleLikeReview(1);

      expect(mockPrisma.resource_review.findUnique).toHaveBeenCalledWith({
        where: { id: 1, deleted_at: null }
      });
      expect(result).toEqual({ success: true });
    });

    it('應該在心得評價不存在時拋出 NotFoundError', async () => {
      mockPrisma.resource_review.findUnique.mockResolvedValue(null);

      await expect(toggleLikeReview(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('服務導出測試', () => {
    it('應該導出所有方法的 resourceReviewService', () => {
      expect(resourceReviewService).toBeDefined();
      expect(typeof resourceReviewService.getReviewById).toBe('function');
      expect(typeof resourceReviewService.getReviews).toBe('function');
      expect(typeof resourceReviewService.createReview).toBe('function');
      expect(typeof resourceReviewService.updateReview).toBe('function');
      expect(typeof resourceReviewService.updateReviewStatus).toBe('function');
      expect(typeof resourceReviewService.deleteReview).toBe('function');
      expect(typeof resourceReviewService.toggleLikeReview).toBe('function');
    });
  });

  describe('邊界情況和錯誤處理', () => {
    it('應該處理資料庫錯誤', async () => {
      mockPrisma.resource_review.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(getReviewById(1)).rejects.toThrow('Database error');
    });

    it('應該處理事務回滾錯誤', async () => {
      const error = new Error('Transaction failed');
      mockPrisma.$transaction.mockRejectedValue(error);

      const reviewData = {
        content: 'Test',
        score_impact: 5,
        score_mindset: 4,
        score_problems: 3,
        score_perspectives: 4,
        score_goals: 5
      };

      await expect(createReview('resource-123', reviewData as any, 1)).rejects.toThrow(error);
    });

    it('應該處理空的標籤列表', async () => {
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);
      mockPrisma.resource_review.findMany.mockResolvedValue([]);

      const result = await resourceReviewService.getReviews({ tags: ['non-existent'] }, {});

      expect(result.reviews).toEqual([]);
    });
  });
});

// 測試 updateReviewStatus 方法
describe('updateReviewStatus', () => {
  const mockReviewData = {
    id: 1,
    user_id: 1,
    resource_id: 1,
    content: '很棒的資源',
    score_impact: 5,
    score_mindset: 4,
    score_problems: 3,
    score_perspectives: 4,
    score_goals: 5,
    status: 'published',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應該成功更新心得評價狀態', async () => {
    mockPrisma.resource_review.findUnique.mockResolvedValue(mockReviewData);
    mockPrisma.resource_review.update.mockResolvedValue({
      ...mockReviewData,
      status: 'archived'
    });

    const getReviewByIdSpy = jest.spyOn(resourceReviewService, 'getReviewById')
      .mockResolvedValue(mockReviewData as any);

    const result = await resourceReviewService.updateReviewStatus(1, 'archived', 1);

    expect(mockPrisma.resource_review.findUnique).toHaveBeenCalledWith({
      where: { id: 1, deleted_at: null }
    });
    expect(mockPrisma.resource_review.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'archived' }
    });
    expect(result).toBeDefined();

    getReviewByIdSpy.mockRestore();
  });

  it('應該在用戶不是擁有者時拋出 ForbiddenError', async () => {
    const differentUserReview = { ...mockReviewData, user_id: 2 };
    mockPrisma.resource_review.findUnique.mockResolvedValue(differentUserReview);

    await expect(resourceReviewService.updateReviewStatus(1, 'archived', 1))
      .rejects.toThrow(ForbiddenError);
  });
});