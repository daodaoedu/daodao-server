/**
 * ResourceReview 驗證器單元測試
 */
import {
  resourceReviewSchema,
  updateResourceReviewSchema,
  validateCreateResourceReview,
  validateUpdateResourceReview
} from '../../../validators/resource-review.validator';

describe('ResourceReview Validator Tests', () => {
  describe('resourceReviewSchema', () => {
    it('應該驗證有效的資源評論', () => {
      const validReview = {
        content: '這是一個很棒的資源！',
        overallImpact: 5,
        changeMindset: 4.5,
        solveProblems: 4,
        gainPerspectives: 4.5,
        achieveGoals: 5,
        timeUsage: '1_2_hours_daily',
        contentFeatures: {
          wellStructured: true,
          practiceFocused: true,
          wellRoundedConcepts: false,
          thoughtProvoking: true,
          progressiveLearning: true,
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
        tags: ['推薦', '初學者友好']
      };

      const result = resourceReviewSchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it('應該拒絕評分超出範圍的評論', () => {
      const invalidReview = {
        content: '這是一個很棒的資源！',
        overallImpact: 5.5, // 超出範圍
        changeMindset: 4.5,
        solveProblems: 4,
        gainPerspectives: 4.5,
        achieveGoals: 5
      };

      const result = resourceReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('overallImpact');
      }
    });

    it('應該拒絕評分間距不為0.5的評論', () => {
      const invalidReview = {
        content: '這是一個很棒的資源！',
        overallImpact: 4.2, // 間距不為0.5
        changeMindset: 4.5,
        solveProblems: 4,
        gainPerspectives: 4.5,
        achieveGoals: 5
      };

      const result = resourceReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('overallImpact');
      }
    });

    it('應該允許部分內容特色和資源使用欄位', () => {
      const partialReview = {
        content: '這是一個很棒的資源！',
        overallImpact: 5,
        changeMindset: 4.5,
        solveProblems: 4,
        gainPerspectives: 4.5,
        achieveGoals: 5,
        contentFeatures: {
          wellStructured: true,
          practiceFocused: true
          // 其他欄位為預設值
        },
        resourceUsage: {
          withOnlineCourses: true
          // 其他欄位為預設值
        }
      };

      const result = resourceReviewSchema.safeParse(partialReview);
      expect(result.success).toBe(true);
      if (result.success) {
        // 檢查所有默認值是否已經填充
        expect(result.data.contentFeatures?.wellRoundedConcepts).toBe(false);
        expect(result.data.resourceUsage?.withBooks).toBe(false);
      }
    });
  });

  describe('updateResourceReviewSchema', () => {
    it('應該允許部分更新評論', () => {
      const partialUpdate = {
        content: '更新後的評論內容',
        overallImpact: 4.5,
        status: 'published'
      };

      const result = updateResourceReviewSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('應該拒絕無效的狀態更新', () => {
      const invalidUpdate = {
        status: 'invalid_status' // 無效的狀態
      };

      const result = updateResourceReviewSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status');
      }
    });

    it('應該允許只更新內容特色', () => {
      const featureUpdate = {
        contentFeatures: {
          wellStructured: true,
          practiceFocused: false,
          wellRoundedConcepts: true,
          thoughtProvoking: true
        }
      };

      const result = updateResourceReviewSchema.safeParse(featureUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('validateCreateResourceReview', () => {
    it('應該成功驗證並返回有效評論', () => {
      const validReview = {
        content: '這是一個很棒的資源！',
        overallImpact: 5,
        changeMindset: 4.5,
        solveProblems: 4,
        gainPerspectives: 4.5,
        achieveGoals: 5
      };

      const result = validateCreateResourceReview(validReview);
      expect(result).toEqual(expect.objectContaining(validReview));
    });

    it('應該在無效評論時拋出錯誤', () => {
      const invalidReview = {
        // 缺少必要的 content
        overallImpact: 5,
        changeMindset: 4.5,
        solveProblems: 4,
        gainPerspectives: 4.5,
        achieveGoals: 5
      };

      expect(() => validateCreateResourceReview(invalidReview)).toThrow();
    });
  });
});
