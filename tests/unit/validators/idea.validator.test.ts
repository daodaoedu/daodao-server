/**
 * 想法驗證器測試
 */

import {
  ideaStatusSchema,
  ideaResourceSchema,
  createIdeaSchema,
  updateIdeaSchema,
  ideaQuerySchema,
  eventViewSchema,
  eventClickSchema,
  eventShareSchema,
  eventFavoriteSchema,
  ideaParamsSchema
} from '../../../src/validators/idea.validators';

describe('Idea Validators', () => {
  describe('ideaStatusSchema', () => {
    it('應該接受有效的狀態', () => {
      expect(ideaStatusSchema.parse('active')).toBe('active');
      expect(ideaStatusSchema.parse('draft')).toBe('draft');
      expect(ideaStatusSchema.parse('archived')).toBe('archived');
    });

    it('應該拒絕無效的狀態', () => {
      expect(() => ideaStatusSchema.parse('invalid')).toThrow();
      expect(() => ideaStatusSchema.parse('')).toThrow();
    });
  });

  describe('ideaResourceSchema', () => {
    it('應該驗證有效的資源', () => {
      const validResource = {
        name: 'TypeScript 官方文檔',
        url: 'https://www.typescriptlang.org/docs/',
        description: '官方文檔'
      };

      const result = ideaResourceSchema.parse(validResource);
      expect(result).toEqual(validResource);
    });

    it('應該接受沒有描述的資源', () => {
      const resource = {
        name: '學習資源',
        url: 'https://example.com'
      };

      const result = ideaResourceSchema.parse(resource);
      expect(result.description).toBeUndefined();
    });

    it('應該拒絕缺少必要欄位的資源', () => {
      expect(() => ideaResourceSchema.parse({ name: '資源' })).toThrow();
      expect(() => ideaResourceSchema.parse({ url: 'https://example.com' })).toThrow();
    });

    it('應該拒絕非 HTTPS 的 URL', () => {
      const resource = {
        name: '資源',
        url: 'http://example.com' // 非 HTTPS
      };

      expect(() => ideaResourceSchema.parse(resource)).toThrow('URL 必須以 https:// 開頭');
    });

    it('應該拒絕無效的 URL', () => {
      const resource = {
        name: '資源',
        url: 'not-a-url'
      };

      expect(() => ideaResourceSchema.parse(resource)).toThrow('請輸入有效的網址');
    });

    it('應該拒絕超長的名稱', () => {
      const resource = {
        name: 'a'.repeat(256), // 超過 255 字符
        url: 'https://example.com'
      };

      expect(() => ideaResourceSchema.parse(resource)).toThrow();
    });
  });

  describe('createIdeaSchema', () => {
    it('應該驗證有效的創建請求', () => {
      const validData = {
        content: '這是一個新的想法',
        tags: ['標籤1', '標籤2'],
        resources: [
          {
            name: '資源1',
            url: 'https://example.com/1',
            description: '描述1'
          }
        ]
      };

      const result = createIdeaSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('應該提供預設值', () => {
      const data = {
        content: '只有內容的想法'
      };

      const result = createIdeaSchema.parse(data);
      expect(result.tags).toEqual([]);
      expect(result.resources).toBeUndefined();
    });

    it('應該拒絕空內容', () => {
      expect(() => createIdeaSchema.parse({ content: '' })).toThrow('請輸入內容');
    });

    it('應該拒絕超長內容', () => {
      const data = {
        content: 'a'.repeat(5001) // 超過 5000 字符
      };

      expect(() => createIdeaSchema.parse(data)).toThrow('內容不能超過5000字');
    });

    it('應該拒絕超過 10 個標籤', () => {
      const data = {
        content: '想法',
        tags: Array(11).fill('標籤')
      };

      expect(() => createIdeaSchema.parse(data)).toThrow('標籤最多10個');
    });

    it('應該拒絕超過 5 個資源', () => {
      const data = {
        content: '想法',
        resources: Array(6).fill({
          name: '資源',
          url: 'https://example.com'
        })
      };

      expect(() => createIdeaSchema.parse(data)).toThrow('資源最多5個');
    });
  });

  describe('updateIdeaSchema', () => {
    it('應該驗證有效的更新請求', () => {
      const validData = {
        content: '更新的內容',
        tags: ['新標籤'],
        status: 'draft'
      };

      const result = updateIdeaSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('應該接受部分更新', () => {
      expect(updateIdeaSchema.parse({ content: '只更新內容' }))
        .toEqual({ content: '只更新內容' });
      
      expect(updateIdeaSchema.parse({ tags: ['只更新標籤'] }))
        .toEqual({ tags: ['只更新標籤'] });
      
      expect(updateIdeaSchema.parse({ status: 'archived' }))
        .toEqual({ status: 'archived' });
    });

    it('應該接受空物件', () => {
      const result = updateIdeaSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('ideaQuerySchema', () => {
    it('應該驗證有效的查詢參數', () => {
      const validQuery = {
        page: '2',
        limit: '30',
        query: '搜尋關鍵字',
        tags: 'React,TypeScript',
        userId: 'user-uuid',
        status: 'active',
        sort: 'likeCount',
        order: 'asc'
      };

      const result = ideaQuerySchema.parse(validQuery);
      expect(result).toEqual({
        page: 2,
        limit: 30,
        query: '搜尋關鍵字',
        tags: 'React,TypeScript',
        userId: 'user-uuid',
        status: 'active',
        sort: 'likeCount',
        order: 'asc'
      });
    });

    it('應該提供預設值', () => {
      const result = ideaQuerySchema.parse({});
      expect(result).toEqual({
        page: 1,
        limit: 20,
        sort: 'createdAt',
        order: 'desc'
      });
    });

    it('應該強制數字轉換', () => {
      const result = ideaQuerySchema.parse({ page: '5', limit: '50' });
      expect(result.page).toBe(5);
      expect(result.limit).toBe(50);
    });

    it('應該限制 limit 最大值', () => {
      expect(() => ideaQuerySchema.parse({ limit: '200' })).toThrow();
    });
  });

  describe('eventViewSchema', () => {
    it('應該驗證有效的瀏覽事件', () => {
      const validEvent = {
        entityType: 'idea',
        entityId: '550e8400-e29b-41d4-a716-446655440000',
        duration: 45
      };

      const result = eventViewSchema.parse(validEvent);
      expect(result).toEqual(validEvent);
    });

    it('應該接受沒有 duration 的事件', () => {
      const event = {
        entityType: 'idea',
        entityId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = eventViewSchema.parse(event);
      expect(result.duration).toBeUndefined();
    });

    it('應該拒絕無效的 UUID', () => {
      const event = {
        entityType: 'idea',
        entityId: 'not-a-uuid'
      };

      expect(() => eventViewSchema.parse(event)).toThrow('請提供有效的想法ID');
    });

    it('應該拒絕錯誤的 entityType', () => {
      const event = {
        entityType: 'wrong',
        entityId: '550e8400-e29b-41d4-a716-446655440000'
      };

      expect(() => eventViewSchema.parse(event)).toThrow();
    });
  });

  describe('eventShareSchema', () => {
    it('應該驗證有效的分享事件', () => {
      const validEvent = {
        entityType: 'idea',
        entityId: '550e8400-e29b-41d4-a716-446655440000',
        shareChannel: 'facebook'
      };

      const result = eventShareSchema.parse(validEvent);
      expect(result).toEqual(validEvent);
    });

    it('應該拒絕缺少 shareChannel', () => {
      const event = {
        entityType: 'idea',
        entityId: '550e8400-e29b-41d4-a716-446655440000'
      };

      expect(() => eventShareSchema.parse(event)).toThrow();
    });

    it('應該拒絕空的 shareChannel', () => {
      const event = {
        entityType: 'idea',
        entityId: '550e8400-e29b-41d4-a716-446655440000',
        shareChannel: ''
      };

      expect(() => eventShareSchema.parse(event)).toThrow('請指定分享渠道');
    });
  });

  describe('ideaParamsSchema', () => {
    it('應該驗證有效的路徑參數', () => {
      const validParams = {
        id: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = ideaParamsSchema.parse(validParams);
      expect(result).toEqual(validParams);
    });

    it('應該拒絕無效的 UUID', () => {
      expect(() => ideaParamsSchema.parse({ id: '123' })).toThrow('請提供有效的想法ID');
      expect(() => ideaParamsSchema.parse({ id: 'not-uuid' })).toThrow('請提供有效的想法ID');
    });
  });
});