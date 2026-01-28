/**
 * 資源評論服務測試
 */

import resourceReviewService from '../../../src/services/resource-review-service';
import ResourceReview from '../../../src/models/resource-review';
import sequelize from '../../../src/config/database';
import { NotFoundError } from '../../../src/utils/error-handler';
import { Op } from 'sequelize';

// 模擬 Sequelize 模型
jest.mock('../../../src/models/resource-review', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn()
  }
}));

jest.mock('../../../src/config/database', () => {
  const mockSequelize = {
    transaction: jest.fn(),
    define: jest.fn(),
    col: jest.fn((name: string) => `col:${name}`),
    fn: jest.fn((fn: string, ...args: any[]) => ({ fn, args })),
    literal: jest.fn((sql: string) => ({ literal: sql }))
  };
  return {
    __esModule: true,
    default: mockSequelize
  };
});

// 模擬 tagService
jest.mock('../../../src/services/tag-service', () => ({
  __esModule: true,
  default: {
    setEntityTags: jest.fn()
  }
}));

describe('ResourceReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('getReviews', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('應該使用預設分頁參數（每頁2筆）', async () => {
      // 模擬 findAndCountAll 返回值
      const mockResult = {
        rows: [
          createMockSequelizeInstance({
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
          })
        ],
        count: 5
      };
      (ResourceReview.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      // 執行測試，不提供 limit 參數
      const result = await resourceReviewService.getReviews({}, {});

      // 驗證調用參數 - 實際使用 cursor-based pagination
      expect(ResourceReview.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 3, // DEFAULT_REVIEW_PAGE_LIMIT + 1 (2 + 1)
          order: [['created_at', 'desc']],
          where: expect.objectContaining({
            status: 'published'
          })
        })
      );
    });

    it('應該限制最大分頁數量為10筆', async () => {
      // 模擬 findAndCountAll 返回值
      const mockResult = {
        rows: [],
        count: 0
      };
      (ResourceReview.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      // 執行測試，提供超過最大限制的 limit
      const result = await resourceReviewService.getReviews({}, { limit: 25 });

      // 驗證調用參數
      expect(ResourceReview.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 11, // MAX_REVIEW_PAGE_LIMIT + 1 (10 + 1)
          order: [['created_at', 'desc']],
          where: expect.objectContaining({
            status: 'published'
          })
        })
      );
    });

    it('應該正確處理游標分頁', async () => {
      // 模擬 findAndCountAll 返回值
      const mockResult = {
        rows: [],
        count: 0
      };
      (ResourceReview.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

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
      expect(ResourceReview.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            [Op.or]: expect.any(Array) // 游標條件 (Op.or)
          }),
          limit: 3 // limit + 1 (2 + 1)
        })
      );
    });

    it('應該正確處理排序參數', async () => {
      // 模擬 findAndCountAll 返回值
      const mockResult = {
        rows: [],
        count: 0
      };
      (ResourceReview.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      // 執行測試
      const result = await resourceReviewService.getReviews({}, { 
        sort: 'created_at',
        order: 'asc'
      });

      // 驗證調用參數
      expect(ResourceReview.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['created_at', 'asc']]
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
});