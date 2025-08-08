/**
 * Practice validators unit tests
 * Testing all Zod schemas for practice functionality
 */

import {
  createPracticeSchema,
  updatePracticeSchema,
  checkInSchema,
  practiceQuerySchema,
  checkInQuerySchema,
  eventViewSchema,
  eventClickSchema,
  eventShareSchema,
  eventFavoriteSchema,
  practiceParamsSchema,
  practiceCommentParamsSchema,
  myPracticesQuerySchema,
  reactionSchema,
  dailyGoalSchema,
  practiceResourceInputSchema
} from '@/validators/practice.validators';

describe('Practice Validators', () => {
  describe('createPracticeSchema', () => {
    const validPracticeData = {
      title: '學習 TypeScript',
      contentType: 'course' as const,
      totalAmount: 40,
      dailyGoal: {
        type: 'completion' as const,
        amount: 2,
        unit: '堂'
      },
      tags: ['程式設計', '前端開發'],
      resources: [
        {
          name: 'TypeScript 官方文檔',
          url: 'https://www.typescriptlang.org/docs/'
        }
      ]
    };

    it('should validate valid practice data', () => {
      expect(() => createPracticeSchema.parse(validPracticeData)).not.toThrow();
    });

    it('should require title', () => {
      const invalidData = { ...validPracticeData };
      delete (invalidData as any).title;
      
      expect(() => createPracticeSchema.parse(invalidData)).toThrow('請輸入標題');
    });

    it('should validate content type', () => {
      const invalidData = { ...validPracticeData, contentType: 'invalid' };
      
      expect(() => createPracticeSchema.parse(invalidData)).toThrow();
    });

    it('should require customContentType when contentType is custom', () => {
      const customData = { 
        ...validPracticeData, 
        contentType: 'custom' as const 
      };
      
      expect(() => createPracticeSchema.parse(customData)).toThrow('選擇自定義類型時，請填寫自定義內容類型');
    });

    it('should limit tags to maximum 3', () => {
      const invalidData = { ...validPracticeData, tags: ['1', '2', '3', '4'] };
      
      expect(() => createPracticeSchema.parse(invalidData)).toThrow('標籤最多3個');
    });

    it('should limit resources to maximum 5', () => {
      const invalidData = { 
        ...validPracticeData, 
        resources: Array(6).fill({
          name: 'Resource',
          url: 'https://example.com'
        })
      };
      
      expect(() => createPracticeSchema.parse(invalidData)).toThrow('資源最多5個');
    });
  });

  describe('dailyGoalSchema', () => {
    it('should validate time goal', () => {
      const timeGoal = {
        type: 'time' as const,
        timeMinutes: 60
      };
      
      expect(() => dailyGoalSchema.parse(timeGoal)).not.toThrow();
    });

    it('should validate completion goal', () => {
      const completionGoal = {
        type: 'completion' as const,
        amount: 2,
        unit: '章'
      };
      
      expect(() => dailyGoalSchema.parse(completionGoal)).not.toThrow();
    });

    it('should require timeMinutes for time type', () => {
      const invalidGoal = {
        type: 'time' as const
      };
      
      expect(() => dailyGoalSchema.parse(invalidGoal)).toThrow();
    });

    it('should require amount and unit for completion type', () => {
      const invalidGoal = {
        type: 'completion' as const,
        amount: 2
      };
      
      expect(() => dailyGoalSchema.parse(invalidGoal)).toThrow();
    });

    it('should validate time range', () => {
      const invalidGoal = {
        type: 'time' as const,
        timeMinutes: 300 // exceeds 240 max
      };
      
      expect(() => dailyGoalSchema.parse(invalidGoal)).toThrow('時間目標最多240分鐘');
    });
  });

  describe('checkInSchema', () => {
    const validCheckIn = {
      progress: 1.5,
      note: '今天學了 TypeScript 基礎',
      mood: 'happy' as const,
      isPublic: true,
      tags: ['TypeScript']
    };

    it('should validate valid check-in data', () => {
      expect(() => checkInSchema.parse(validCheckIn)).not.toThrow();
    });

    it('should require positive progress', () => {
      const invalidData = { ...validCheckIn, progress: 0 };
      
      expect(() => checkInSchema.parse(invalidData)).toThrow('進度必須大於0');
    });

    it('should validate mood enum', () => {
      const invalidData = { ...validCheckIn, mood: 'invalid' };
      
      expect(() => checkInSchema.parse(invalidData)).toThrow();
    });

    it('should limit note length', () => {
      const invalidData = { 
        ...validCheckIn, 
        note: 'a'.repeat(501) 
      };
      
      expect(() => checkInSchema.parse(invalidData)).toThrow('筆記不可超過500字');
    });

    it('should limit tags to maximum 5', () => {
      const invalidData = { 
        ...validCheckIn, 
        tags: ['1', '2', '3', '4', '5', '6'] 
      };
      
      expect(() => checkInSchema.parse(invalidData)).toThrow('標籤最多5個');
    });
  });

  describe('practiceQuerySchema', () => {
    it('should provide default values', () => {
      const result = practiceQuerySchema.parse({});
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.status).toBe('active');
      expect(result.sort).toBe('createdAt');
      expect(result.order).toBe('desc');
    });

    it('should validate page minimum', () => {
      expect(() => practiceQuerySchema.parse({ page: 0 })).toThrow('Page must be at least 1');
    });

    it('should validate limit range', () => {
      expect(() => practiceQuerySchema.parse({ limit: 101 })).toThrow('Limit cannot exceed 100');
    });

    it('should validate sort enum', () => {
      expect(() => practiceQuerySchema.parse({ sort: 'invalid' })).toThrow();
    });
  });

  describe('eventSchemas', () => {
    const baseEvent = {
      entityType: 'practice' as const,
      entityId: 'practice-123'
    };

    it('should validate view event', () => {
      const viewEvent = {
        ...baseEvent,
        duration: 45
      };
      
      expect(() => eventViewSchema.parse(viewEvent)).not.toThrow();
    });

    it('should validate click event', () => {
      const clickEvent = {
        ...baseEvent,
        clickPosition: 'title'
      };
      
      expect(() => eventClickSchema.parse(clickEvent)).not.toThrow();
    });

    it('should validate share event', () => {
      const shareEvent = {
        ...baseEvent,
        shareChannel: 'facebook'
      };
      
      expect(() => eventShareSchema.parse(shareEvent)).not.toThrow();
    });

    it('should require shareChannel for share event', () => {
      expect(() => eventShareSchema.parse(baseEvent)).toThrow('請指定分享渠道');
    });

    it('should validate favorite event', () => {
      expect(() => eventFavoriteSchema.parse(baseEvent)).not.toThrow();
    });

    it('should require entityType to be practice', () => {
      const invalidEvent = {
        entityType: 'invalid',
        entityId: 'practice-123'
      };
      
      expect(() => eventViewSchema.parse(invalidEvent)).toThrow();
    });
  });

  describe('paramsSchemas', () => {
    it('should validate practice params', () => {
      const params = { id: 'practice-123' };
      
      expect(() => practiceParamsSchema.parse(params)).not.toThrow();
    });

    it('should require practice ID', () => {
      expect(() => practiceParamsSchema.parse({})).toThrow('Practice ID is required');
    });

    it('should validate comment params', () => {
      const params = { id: 123 };
      
      expect(() => practiceCommentParamsSchema.parse(params)).not.toThrow();
    });

    it('should validate comment ID as positive number', () => {
      expect(() => practiceCommentParamsSchema.parse({ id: -1 })).toThrow('Comment ID must be positive');
    });
  });

  describe('practiceResourceInputSchema', () => {
    it('should validate valid resource', () => {
      const resource = {
        name: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org/docs/'
      };
      
      expect(() => practiceResourceInputSchema.parse(resource)).not.toThrow();
    });

    it('should allow resource without URL', () => {
      const resource = {
        name: 'TypeScript Handbook'
      };
      
      expect(() => practiceResourceInputSchema.parse(resource)).not.toThrow();
    });

    it('should require resource name', () => {
      const resource = {
        url: 'https://www.typescriptlang.org/docs/'
      };
      
      expect(() => practiceResourceInputSchema.parse(resource)).toThrow('請輸入資源名稱');
    });

    it('should validate URL format', () => {
      const resource = {
        name: 'TypeScript Handbook',
        url: 'invalid-url'
      };
      
      expect(() => practiceResourceInputSchema.parse(resource)).toThrow('請輸入有效的網址');
    });

    it('should limit name length', () => {
      const resource = {
        name: 'a'.repeat(101)
      };
      
      expect(() => practiceResourceInputSchema.parse(resource)).toThrow('資源名稱不可超過100字');
    });
  });

  describe('updatePracticeSchema', () => {
    it('should allow partial updates', () => {
      const update = {
        title: '新標題'
      };
      
      expect(() => updatePracticeSchema.parse(update)).not.toThrow();
    });

    it('should require at least one field', () => {
      expect(() => updatePracticeSchema.parse({})).toThrow('至少需要提供一個要更新的欄位');
    });

    it('should validate status enum', () => {
      const update = {
        status: 'invalid'
      };
      
      expect(() => updatePracticeSchema.parse(update)).toThrow();
    });
  });

  describe('reactionSchema', () => {
    it('should provide default reaction type', () => {
      const result = reactionSchema.parse({});
      
      expect(result.reactionType).toBe('like');
    });

    it('should allow custom reaction type', () => {
      const reaction = { reactionType: 'love' };
      
      expect(() => reactionSchema.parse(reaction)).not.toThrow();
    });
  });
});