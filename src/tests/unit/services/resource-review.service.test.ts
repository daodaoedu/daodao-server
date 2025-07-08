/**
 * 資源評審服務層完整測試
 * 包含原有測試和新增的comprehensive測試
 */

import { Op } from 'sequelize';
import resourceReviewService, {
  getReviewById,
  getReviews,
  createReview,
  updateReview,
  updateReviewStatus,
  deleteReview,
  toggleLikeReview
} from '../../../services/resource-review.service';
import tagService from '../../../services/tag.service';
import { transformReviewToApi, transformReviewToDb } from '../../../services/transform.service';
import { 
  NotFoundError, 
  ConflictError, 
  ForbiddenError 
} from '../../../utils/error-handler';
import { decodeCursor, generatePaginationMetadata } from '../../../utils/transform-utils';

// Mock Prisma service
jest.mock('../../../services/database/prisma.service', () => ({
  prisma: {
    $transaction: jest.fn(),
    resource_review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    resources: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    users: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    tags: {
      findMany: jest.fn(),
      findUnique: jest.fn()
    }
  }
}));

// Mock dependencies for comprehensive tests
jest.mock('../../../services/tag.service');
jest.mock('../../../services/transform.service');
jest.mock('../../../utils/transform-utils');

describe('Resource Review Service Tests', () => {
  let mockReview: any;
  let mockResource: any;
  let mockUser: any;
  let mockTransaction: any;
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get prisma mock
    prisma = require('../../../services/database/prisma.service').prisma;

    // Setup mocks for comprehensive tests
    mockReview = {
      id: 1,
      user_id: 1,
      resource_id: 1,
      content: '很棒的資源',
      score_impact: 5,
      status: 'published',
      created_at: new Date(),
      updated_at: new Date()
    };

    mockResource = {
      id: 1,
      external_id: 'resource-123',
      title: '測試資源'
    };

    mockUser = {
      id: 1,
      username: 'testuser',
      name: 'Test User'
    };

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };

    // Setup default mock implementations for comprehensive tests
    prisma.resource_review.findUnique.mockResolvedValue(mockReview);
    prisma.resource_review.findFirst.mockResolvedValue(null);
    prisma.resource_review.findMany.mockResolvedValue([mockReview]);
    prisma.resource_review.count.mockResolvedValue(1);
    prisma.resource_review.create.mockResolvedValue(mockReview);
    prisma.resources.findUnique.mockResolvedValue(mockResource);
    prisma.$transaction.mockImplementation(async (fn) => fn(prisma));

    // Mock transform functions
    (transformReviewToApi as jest.Mock).mockImplementation((data) => ({
      id: data.id,
      content: data.content,
      score: { overall_impact: data.score_impact },
      status: data.status,
      ...data
    }));
    (transformReviewToDb as jest.Mock).mockImplementation((data, userId, resourceId) => ({
      user_id: userId,
      resource_id: resourceId,
      content: data.content,
      score_impact: data.score?.overall_impact || 5,
      status: data.status || 'draft'
    }));

    // Mock utils
    (decodeCursor as jest.Mock).mockReturnValue({
      timestamp: new Date(),
      id: 1
    });
    (generatePaginationMetadata as jest.Mock).mockReturnValue({
      current_cursor: null,
      next_cursor: 'next-cursor',
      has_more: false,
      total_estimate: 1
    });

    // Mock tag service
    (tagService.getEntityTags as jest.Mock).mockResolvedValue([]);
    (tagService.setEntityTags as jest.Mock).mockResolvedValue(true);
  });

  // 輔助函數：創建模擬的 Sequelize 實例
  const createMockSequelizeInstance = (data: any) => ({
    ...data,
    toJSON: () => data,
    get: (key: string) => data[key],
    set: (key: string, value: any) => { data[key] = value; },
    save: jest.fn().mockResolvedValue(data),
    destroy: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue({ ...data }),
    getDataValue: jest.fn((key: string) => data[key])
  });

  // ===== 原有測試（保留） =====
  describe('Legacy Tests - getReviews', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('應該使用預設分頁參數（每頁2筆）', async () => {
      // 模擬 Prisma 查詢返回值
      const mockReviews = [
        {
          id: 1,
          content: '很棒的資源',
          score_impact: 5,
          score_mindset: 4,
          score_problems: 5,
          score_perspectives: 4,
          score_goals: 5,
          time_usage: '1_2_hours_daily',
          user_id: 100,
          resource_id: 1,
          status: 'published',
          created_at: new Date(),
          updated_at: new Date(),
          well_structured: true,
          practice_focused: true,
          well_rounded_concepts: false,
          thought_provoking: true,
          progressive_learning: false,
          problem_based: false,
          real_world_examples: true,
          interactive: false,
          visually_rich: true,
          with_online_courses: true,
          with_books: false,
          with_other_tools: true,
          with_community: false,
          only_this_resource: false,
          not_applicable_resource: false
        }
      ];
      
      prisma.resource_review.findMany.mockResolvedValue(mockReviews);
      prisma.resource_review.count.mockResolvedValue(5);

      // 執行測試，不提供 limit 參數
      const result = await resourceReviewService.getReviews({}, {});

      // 驗證調用參數 - 實際使用 cursor-based pagination
      expect(prisma.resource_review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3, // DEFAULT_REVIEW_PAGE_LIMIT + 1 (2 + 1)
          orderBy: { created_at: 'desc' },
          where: expect.objectContaining({
            status: 'published'
          })
        })
      );
    });

    it('應該限制最大分頁數量為10筆', async () => {
      // 模擬 Prisma 查詢返回值
      prisma.resource_review.findMany.mockResolvedValue([]);
      prisma.resource_review.count.mockResolvedValue(0);

      // 執行測試，提供超過最大限制的 limit
      const result = await resourceReviewService.getReviews({}, { limit: 25 });

      // 驗證調用參數
      expect(prisma.resource_review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11, // MAX_REVIEW_PAGE_LIMIT + 1 (10 + 1)
          orderBy: { created_at: 'desc' },
          where: expect.objectContaining({
            status: 'published'
          })
        })
      );
    });

    it('應該正確處理游標分頁', async () => {
      // 模擬 Prisma 查詢返回值
      prisma.resource_review.findMany.mockResolvedValue([]);
      prisma.resource_review.count.mockResolvedValue(0);

      // 創建有效的游標
      const cursor = Buffer.from(JSON.stringify({
        id: 10,
        timestamp: '2024-01-01T00:00:00Z'
      })).toString('base64');

      // 執行測試
      const result = await resourceReviewService.getReviews({}, { 
        cursor,
        limit: 2
      });

      // 驗證調用參數包含游標條件
      expect(prisma.resource_review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            OR: expect.any(Array) // 游標條件 (OR)
          }),
          take: 3 // limit + 1 (2 + 1)
        })
      );
    });

    it('應該正確處理排序參數', async () => {
      // 模擬 Prisma 查詢返回值
      prisma.resource_review.findMany.mockResolvedValue([]);
      prisma.resource_review.count.mockResolvedValue(0);

      // 執行測試
      const result = await resourceReviewService.getReviews({}, { 
        sort: 'created_at',
        order: 'asc'
      });

      // 驗證調用參數
      expect(prisma.resource_review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { created_at: 'asc' }
        })
      );
    });

    it('應該正確處理篩選參數', async () => {
      // 模擬 findAndCountAll 返回值
      const mockResult = {
        rows: [],
        count: 0
      };
      (ResourceReview.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      // 執行測試
      const result = await resourceReviewService.getReviews({
        resourceId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 100
      }, {});

      // 驗證調用參數
      expect(ResourceReview.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            '$resource.external_id$': '550e8400-e29b-41d4-a716-446655440000',
            user_id: 100,
            status: 'published' // 預設只顯示已發布的評論
          })
        })
      );
    });

    it('應該正確處理評分範圍篩選', async () => {
      // 模擬 findAndCountAll 返回值
      const mockResult = {
        rows: [],
        count: 0
      };
      (ResourceReview.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      // 執行測試
      const result = await resourceReviewService.getReviews({
        minScore: 3.0,
        maxScore: 5.0
      }, {});

      // 驗證調用參數
      expect(ResourceReview.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            score_impact: expect.any(Object), // 包含 Op.gte 和 Op.lte 符號
            status: 'published'
          })
        })
      );
    });

    it('應該正確返回分頁元數據', async () => {
      // 模擬 findAndCountAll 返回值
      const mockResult = {
        rows: [
          createMockSequelizeInstance({
            id: 1,
            content: '測試評論',
            score_impact: 5,
            score_mindset: 4,
            score_problems: 5,
            score_perspectives: 4,
            score_goals: 5,
            user_id: 100,
            resource_id: 1,
            status: 'published',
            created_at: new Date('2024-01-01T10:00:00Z'),
            updated_at: new Date('2024-01-01T10:00:00Z'),
            well_structured: true,
            practice_focused: true,
            well_rounded_concepts: false,
            thought_provoking: true,
            progressive_learning: false,
            problem_based: false,
            real_world_examples: true,
            interactive: false,
            visually_rich: true,
            with_online_courses: true,
            with_books: false,
            with_other_tools: true,
            with_community: false,
            only_this_resource: false,
            not_applicable_resource: false
          })
        ],
        count: 10
      };
      (ResourceReview.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      // 執行測試
      const result = await resourceReviewService.getReviews({}, { limit: 2 });

      // 驗證返回結果結構
      expect(result).toEqual(
        expect.objectContaining({
          reviews: expect.any(Array),
          pagination: expect.objectContaining({
            hasNext: false, // 只有 1 筆記錄，沒有下一頁
            nextCursor: null,
            totalEstimate: 10, // 總記錄數
            parentTotalEstimate: null // 評論不需要父分類計數
          })
        })
      );
    });
  });

  // ===== 新增的comprehensive測試 =====
  describe('Comprehensive Tests - getReviewById', () => {
    it('should successfully get review by ID', async () => {
      const result = await getReviewById(1);

      expect(prisma.resource_review.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          User: true,
          Resource: true,
          tags: {
            where: { entity_type: 'resource_review' }
          }
        }
      });
      expect(transformReviewToApi).toHaveBeenCalledWith({
        ...mockReview,
        stats: { likes_count: 0 }
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundError when review not found', async () => {
      prisma.resource_review.findUnique.mockResolvedValue(null);

      await expect(getReviewById(999)).rejects.toThrow(NotFoundError);
      await expect(getReviewById(999)).rejects.toThrow('找不到 ID 為 999 的心得評價');
    });
  });

  describe('Comprehensive Tests - createReview', () => {
    const reviewData = {
      content: '很棒的資源',
      score: { overall_impact: 5 },
      tags: ['JavaScript', 'React']
    };

    it('should successfully create a review', async () => {
      const result = await createReview(1, reviewData, 1);

      expect(prisma.resources.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.resource_review.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          resource_id: 1
        }
      });
      expect(transformReviewToDb).toHaveBeenCalledWith(reviewData, 1, 1);
      expect(prisma.resource_review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 1,
          resource_id: 1
        })
      });
      expect(tagService.setEntityTags).toHaveBeenCalledWith(
        1,
        'resource_review',
        ['JavaScript', 'React'],
        prisma
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundError when resource not found', async () => {
      prisma.resources.findUnique.mockResolvedValue(null);

      await expect(createReview(999, reviewData, 1)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when user already reviewed resource', async () => {
      prisma.resource_review.findFirst.mockResolvedValue(mockReview);

      await expect(createReview(1, reviewData, 1)).rejects.toThrow(ConflictError);
    });
  });

  describe('Comprehensive Tests - updateReview', () => {
    const updateData = {
      content: '更新的評價',
      score: { overall_impact: 4 },
      tags: ['Updated', 'Tags']
    };

    it('should successfully update a review', async () => {
      const result = await updateReview(1, updateData, 1);

      expect(ResourceReview.findByPk).toHaveBeenCalledWith(1);
      expect(mockReview.update).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          resource_id: 1
        }),
        { transaction: mockTransaction }
      );
      expect(tagService.setEntityTags).toHaveBeenCalledWith(
        1,
        'resource_review',
        ['Updated', 'Tags'],
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenError when user is not owner', async () => {
      mockReview.get.mockImplementation((key: string) => {
        if (key === 'user_id') return 2; // Different user
        return mockReview.get.mockReturnValue;
      });

      await expect(updateReview(1, updateData, 1)).rejects.toThrow(ForbiddenError);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('Comprehensive Tests - deleteReview', () => {
    it('should successfully delete a review', async () => {
      const result = await deleteReview(1, 1);

      expect(ResourceReview.findByPk).toHaveBeenCalledWith(1);
      expect(mockReview.destroy).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should throw ForbiddenError when user is not owner', async () => {
      mockReview.get.mockImplementation((key: string) => {
        if (key === 'user_id') return 2; // Different user
        return mockReview.get.mockReturnValue;
      });

      await expect(deleteReview(1, 1)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Comprehensive Tests - toggleLikeReview', () => {
    it('should successfully toggle like on a review', async () => {
      const result = await toggleLikeReview(1);

      expect(ResourceReview.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundError when review not found', async () => {
      (ResourceReview.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(toggleLikeReview(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Service Export Tests', () => {
    it('should export resourceReviewService with all methods', () => {
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

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors', async () => {
      (ResourceReview.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getReviewById(1)).rejects.toThrow('Database error');
    });

    it('should handle transaction rollback on errors', async () => {
      (ResourceReview.create as jest.Mock).mockRejectedValue(new Error('Create failed'));
      const reviewData = { content: 'Test', score: { overall_impact: 5 } };

      await expect(createReview(1, reviewData, 1)).rejects.toThrow('Create failed');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});