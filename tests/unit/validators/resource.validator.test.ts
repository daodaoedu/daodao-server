/**
 * Resource 驗證器單元測試
 */
import {
  createResourceSchema,
  updateResourceSchema,
  validateCreateResource,
  validateUpdateResource
} from '../../../src/validators/resource.validator';

describe('Resource Validator Tests', () => {
  describe('createResourceSchema', () => {
    it('應該驗證有效的資源', () => {
      const validResource = {
        name: '學習TypeScript的最佳課程',
        url: 'https://example.com/typescript-course',
        description: '一個全面的TypeScript課程，適合初學者和進階使用者',
        type: 'workshops_courses',
        cost: 'free',
        level: 'all_levels',
        tags: ['typescript', 'programming', 'web development']
      };

      const result = createResourceSchema.safeParse(validResource);
      expect(result.success).toBe(true);
    });

    it('應該拒絕名稱為空的資源', () => {
      const invalidResource = {
        name: '',
        url: 'https://example.com/typescript-course',
        description: '一個全面的TypeScript課程，適合初學者和進階使用者',
        type: 'workshops_courses',
        cost: 'free',
        level: 'all_levels'
      };

      const result = createResourceSchema.safeParse(invalidResource);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('應該拒絕無效URL的資源', () => {
      const invalidResource = {
        name: '學習TypeScript的最佳課程',
        url: 'not-a-valid-url',
        description: '一個全面的TypeScript課程，適合初學者和進階使用者',
        type: 'workshops_courses',
        cost: 'free',
        level: 'all_levels'
      };

      const result = createResourceSchema.safeParse(invalidResource);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('url');
      }
    });

    it('應該拒絕無效類型的資源', () => {
      const invalidResource = {
        name: '學習TypeScript的最佳課程',
        url: 'https://example.com/typescript-course',
        description: '一個全面的TypeScript課程，適合初學者和進階使用者',
        type: 'invalid_type', // 無效的類型
        cost: 'free',
        level: 'all_levels'
      };

      const result = createResourceSchema.safeParse(invalidResource);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
      }
    });

    it('應該支援包含評論的資源創建', () => {
      const resourceWithReview = {
        name: '學習TypeScript的最佳課程',
        url: 'https://example.com/typescript-course',
        description: '一個全面的TypeScript課程，適合初學者和進階使用者',
        type: 'workshops_courses',
        cost: 'free',
        level: 'all_levels',
        status: 'active',
        review: {
          title: '這個課程非常棒！',
          content: '這個課程內容詳細，非常適合初學者學習',
          score_impact: 5,
          score_comprehensiveness: 4.5,
          score_implementation: 4,
          recommendation: '強烈推薦給想學習TypeScript的開發者',
          tags: ['typescript', 'programming', 'beginner']
        }
      };

      const result = createResourceSchema.safeParse(resourceWithReview);
      expect(result.success).toBe(true);
    });
  });

  describe('updateResourceSchema', () => {
    it('應該允許部分更新資源', () => {
      const partialUpdate = {
        name: '更新後的課程名稱',
        description: '更新後的描述'
      };

      const result = updateResourceSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('應該拒絕無效的部分更新', () => {
      const invalidUpdate = {
        name: '',  // 無效的名稱
        type: 'invalid_type'  // 無效的類型
      };

      const result = updateResourceSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('validateCreateResource', () => {
    it('應該成功驗證並返回有效資源', () => {
      const validResource = {
        name: '學習TypeScript的最佳課程',
        url: 'https://example.com/typescript-course',
        description: '一個全面的TypeScript課程，適合初學者和進階使用者',
        type: 'workshops_courses',
        cost: 'free',
        level: 'all_levels'
      };

      const result = validateCreateResource(validResource);
      expect(result).toEqual(expect.objectContaining(validResource));
    });

    it('應該在無效資源時拋出錯誤', () => {
      const invalidResource = {
        name: '學習TypeScript的最佳課程',
        // 缺少必要的 url
        description: '一個全面的TypeScript課程，適合初學者和進階使用者',
        type: 'workshops_courses',
        cost: 'free',
        level: 'all_levels'
      };

      expect(() => validateCreateResource(invalidResource)).toThrow();
    });
  });
});
