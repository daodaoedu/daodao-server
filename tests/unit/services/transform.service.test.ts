/**
 * 轉換服務測試
 */

import {
  transformResourceToApi,
  transformResourceToDb,
  transformReviewToApi,
  transformReviewToDb
} from '@/services/transform.service';
import { contentFeaturesMappings, resourceUsageMappings } from '@/constants/mappings';
import type { categories } from '@generated/prisma';

// Add missing Category mock for legacy tests
const Category = {
  findOne: jest.fn()
};

// Mock Prisma category model
jest.mock('@/services/database/prisma.service', () => ({
  prisma: {
    categories: {
      findFirst: jest.fn()
    }
  }
}));

import { prisma } from '@/services/database/prisma.service';

describe('Transform Service Tests', () => {

  describe('transformResourceToApi', () => {
    it('應正確轉換資源資料為 API 格式', () => {
      // 模擬資料庫返回的資源記錄
      const dbResource = {
        id: 1,
        name: '測試資源',
        url: 'https://example.com',
        image_url: 'https://example.com/image.jpg',
        description: '這是一個測試資源',
        video_url: 'https://example.com/video.mp4',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        major_category_id: 1,
        sub_category_id: 2,
        created_by: 100,
        status: 'active',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        // 關聯資料
        User: {
          id: 100,
          username: 'testuser',
          display_name: '測試用戶',
          avatar_url: 'https://example.com/avatar.jpg'
        },
        majorCategory: {
          id: 1,
          name: '主分類'
        },
        subCategory: {
          id: 2,
          name: '子分類'
        },
        tags: [
          { id: 1, name: 'tag1' },
          { id: 2, name: 'tag2' }
        ],
        stats: {
          view_count: 100,
          favorite_count: 50,
          share_count: 20,
          review_count: 10,
          like_count: 75
        },
        avgRating: 4.5
      };

      // 執行轉換
      const result = transformResourceToApi(dbResource);

      // 驗證結果
      expect(result).toMatchObject({
        id: '1',
        name: '測試資源',
        url: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
        description: '這是一個測試資源',
        videoUrl: 'https://example.com/video.mp4',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        majorCategory: '主分類',
        subCategory: '子分類',
        status: 'active',
        avgRating: 4.5,
        tags: ['tag1', 'tag2'],
        user: {
          id: 100,
          name: '測試用戶',
          _id: '',
          roleList: [],
          photoURL: 'https://example.com/avatar.jpg'
        },
        createdAt: dbResource.created_at.toISOString(),
        updatedAt: dbResource.updated_at.toISOString(),
        viewCount: 100,
        favoriteCount: 50,
        shareCount: 20,
        reviewCount: 10,
        likeCount: 75
      });
    });

    it('應處理缺少關聯資料的情況', () => {
      // 沒有關聯資料的資源記錄
      const dbResource = {
        id: 1,
        name: '測試資源',
        url: 'https://example.com',
        image_url: null,
        description: '這是一個測試資源',
        video_url: null,
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        major_category_id: null,
        sub_category_id: null,
        created_by: 100,
        status: 'active',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02')
      };

      // 執行轉換，不包含關聯資料
      const result = transformResourceToApi(dbResource, false);

      // 驗證結果
      expect(result).toMatchObject({
        id: '1',
        name: '測試資源',
        url: 'https://example.com',
        imageUrl: null,
        description: '這是一個測試資源',
        videoUrl: null,
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        majorCategory: null,
        subCategory: null,
        status: 'active',
        tags: [],
        createdAt: dbResource.created_at.toISOString(),
        updatedAt: dbResource.updated_at.toISOString()
      });
    });
  });

  describe('transformResourceToDb', () => {
    beforeEach(() => {
      // Mock prisma.categories.findFirst to return mock category data
      (prisma.categories.findFirst as jest.Mock).mockImplementation(({ where }) => {
        if (where.name === 'frontend_development') {
          return Promise.resolve({ id: 1, name: 'frontend_development' });
        } else if (where.name === 'javascript_frameworks') {
          return Promise.resolve({ id: 2, name: 'javascript_frameworks' });
        }
        return Promise.resolve(null);
      });
    });

    it('應正確轉換 API 資料為資料庫格式', async () => {
      // 模擬 API 請求資料
      const apiResource = {
        name: '測試資源',
        url: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
        description: '這是一個測試資源',
        videoUrl: 'https://example.com/video.mp4',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        majorCategory: 'frontend_development',
        subCategory: 'javascript_frameworks',
        tags: ['tag1', 'tag2']
      };

      // 執行轉換
      const result = await transformResourceToDb(apiResource, 100);

      // 驗證結果
      expect(result).toMatchObject({
        name: '測試資源',
        url: 'https://example.com',
        image_url: 'https://example.com/image.jpg',
        description: '這是一個測試資源',
        video_url: 'https://example.com/video.mp4',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        major_category_id: 1,
        sub_category_id: 2,
        created_by: 100,
        status: 'active'
      });
    });
  });

  describe('transformReviewToApi', () => {
    it('應正確轉換心得評價資料為 API 格式', () => {
      // 模擬資料庫返回的心得評價記錄
      const dbReview = {
        id: 1,
        user_id: 100,
        resource_id: 200,
        content: '這是一個測試心得評價',
        score_impact: 4.5,
        score_mindset: 4.0,
        score_problems: 3.5,
        score_perspectives: 4.0,
        score_goals: 5.0,
        well_structured: true,
        practice_focused: false,
        well_rounded_concepts: true,
        thought_provoking: true,
        progressive_learning: false,
        problem_based: true,
        real_world_examples: true,
        interactive: false,
        visually_rich: true,
        time_usage: '1_2_hours_daily',
        with_online_courses: true,
        with_books: false,
        with_other_tools: true,
        with_community: false,
        only_this_resource: false,
        not_applicable_resource: false,
        status: 'published',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        // 關聯資料
        User: {
          id: 100,
          username: 'testuser',
          display_name: '測試用戶',
          avatar_url: 'https://example.com/avatar.jpg'
        },
        Resource: {
          id: 200,
          name: '測試資源'
        },
        tags: [
          { id: 1, name: 'tag1' },
          { id: 2, name: 'tag2' }
        ],
        stats: {
          likes_count: 30
        }
      };

      // 執行轉換
      const result = transformReviewToApi(dbReview);

      // 驗證結果
      expect(result).toMatchObject({
        id: '1',
        content: '這是一個測試心得評價',
        overallImpact: 4.5,
        changeMindset: 4.0,
        solveProblems: 3.5,
        gainPerspectives: 4.0,
        achieveGoals: 5.0,
        avgRating: 4.2, // (4.5 + 4.0 + 3.5 + 4.0 + 5.0) / 5 = 4.2
        timeUsage: '1_2_hours_daily',
        contentFeatures: {
          wellStructured: true,
          practiceFocused: false,
          wellRoundedConcepts: true,
          thoughtProvoking: true,
          progressiveLearning: false,
          problemBased: true,
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
        likeCount: 30,
        tags: ['tag1', 'tag2'],
        user: {
          id: 100,
          name: '測試用戶',
          _id: '',
          roleList: [],
          photoURL: 'https://example.com/avatar.jpg'
        },
        resourceId: '200',
        createdAt: dbReview.created_at.toISOString(),
        updatedAt: dbReview.updated_at.toISOString()
      });
    });
  });

  describe('transformReviewToDb', () => {
    it('應正確轉換 API 心得評價資料為資料庫格式', () => {
      // 模擬 API 請求資料
      const apiReview = {
        content: '這是一個測試心得評價',
        overallImpact: 4.5,
        changeMindset: 4.0,
        solveProblems: 3.5,
        gainPerspectives: 4.0,
        achieveGoals: 5.0,
        timeUsage: '1_2_hours_daily',
        contentFeatures: {
          wellStructured: true,
          practiceFocused: false,
          wellRoundedConcepts: true,
          thoughtProvoking: true,
          progressiveLearning: false,
          problemBased: true,
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
        tags: ['tag1', 'tag2']
      };

      // 執行轉換
      const result = transformReviewToDb(apiReview, 100, 200);

      // 驗證結果 - 首先檢查基本欄位
      expect(result).toMatchObject({
        user_id: 100,
        resource_id: 200,
        content: '這是一個測試心得評價',
        time_usage: '1_2_hours_daily',
        status: 'published'
      });

      // 驗證評分欄位 - 在測試環境中是數字，運行時會被轉換為 Decimal
      expect(result.score_impact).toBe(4.5);
      expect(result.score_mindset).toBe(4.0);
      expect(result.score_problems).toBe(3.5);
      expect(result.score_perspectives).toBe(4.0);
      expect(result.score_goals).toBe(5.0);

      // 檢查 Boolean 欄位
      // 內容特色
      Object.entries(contentFeaturesMappings).forEach(([apiField, dbField]) => {
        const value = apiReview.contentFeatures[apiField as keyof typeof apiReview.contentFeatures];
        expect(result).toHaveProperty(dbField as string, value);
      });

      // 資源使用
      Object.entries(resourceUsageMappings).forEach(([apiField, dbField]) => {
        const value = apiReview.resourceUsage[apiField as keyof typeof apiReview.resourceUsage];
        expect(result).toHaveProperty(dbField as string, value);
      });
    });

    it('應處理缺少 contentFeatures 和 resourceUsage 的情況', () => {
      // 沒有 contentFeatures 和 resourceUsage 的 API 請求資料
      const apiReview = {
        content: '這是一個測試心得評價',
        overallImpact: 4.5,
        changeMindset: 4.0,
        solveProblems: 3.5,
        gainPerspectives: 4.0,
        achieveGoals: 5.0,
        timeUsage: '1_2_hours_daily'
      };

      // 執行轉換
      const result = transformReviewToDb(apiReview, 100, 200);

      // 驗證結果 - 檢查是否設置了默認值
      // 內容特色
      Object.values(contentFeaturesMappings).forEach(dbField => {
        expect(result).toHaveProperty(dbField as string, false);
      });

      // 資源使用
      Object.values(resourceUsageMappings).forEach(dbField => {
        expect(result).toHaveProperty(dbField as string, false);
      });
    });
  });
});
