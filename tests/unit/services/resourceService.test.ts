/**
 * 資源服務測試
 */

import resourceService from '../../../src/services/resourceService';
import Resource from '../../../src/models/resource';
import ResourceReview from '../../../src/models/resourceReview';
import sequelize from '../../../src/config/database';
import { 
  NotFoundError, 
  ForbiddenError, 
  ConflictError 
} from '../../../src/utils/errorHandler';
import tagService from '../../../src/services/tagService';

// 模擬 Sequelize 模型
jest.mock('../../../src/models/resource');
jest.mock('../../../src/models/resourceReview');
jest.mock('../../../src/config/database');
jest.mock('../../../src/services/tagService');

describe('Resource Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getResourceById', () => {
    it('應成功獲取資源詳情', async () => {
      // 模擬資源數據
      const mockResource = {
        id: 1,
        name: '測試資源',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: '測試資源',
          url: 'https://example.com',
          image_url: 'https://example.com/image.jpg',
          description: '這是一個測試資源',
          type: 'books_articles',
          cost: 'free',
          level: 'beginner',
          created_by: 100,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        })
      };

      // 模擬評分統計
      const mockReviewStats = {
        getDataValue: jest.fn().mockReturnValue(4.5)
      };

      // 模擬 Sequelize 查詢結果
      (Resource.findByPk as jest.Mock).mockResolvedValue(mockResource);
      (ResourceReview.findOne as jest.Mock).mockResolvedValue(mockReviewStats);

      // 執行測試
      const result = await resourceService.getResourceById(1);

      // 驗證結果
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('測試資源');
      expect(result.avgRating).toBe(4.5);
      expect(Resource.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('應在資源不存在時拋出 NotFoundError', async () => {
      // 模擬資源不存在
      (Resource.findByPk as jest.Mock).mockResolvedValue(null);

      // 執行測試並驗證結果
      await expect(resourceService.getResourceById(999)).rejects.toThrow(NotFoundError);
      expect(Resource.findByPk).toHaveBeenCalledWith(999, expect.any(Object));
    });
  });

  describe('createResource', () => {
    it('應成功創建資源', async () => {
      // 模擬事務
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // 模擬創建資源
      const mockResource = { id: 1, name: '測試資源' };
      (Resource.create as jest.Mock).mockResolvedValue(mockResource);

      // 模擬標籤處理
      (tagService.setEntityTags as jest.Mock).mockResolvedValue([]);

      // 模擬獲取資源詳情
      jest.spyOn(resourceService, 'getResourceById').mockResolvedValue({
        id: 1,
        name: '測試資源',
        url: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
        description: '這是一個測試資源',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        status: 'active'
      });

      // 執行測試
      const resourceData = {
        name: '測試資源',
        url: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
        description: '這是一個測試資源',
        type: 'books_articles' as const,
        cost: 'free' as const,
        level: 'beginner' as const,
        tags: ['tag1', 'tag2']
      };

      const result = await resourceService.createResource(resourceData, 100);

      // 驗證結果
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('測試資源');
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Resource.create).toHaveBeenCalled();
      expect(tagService.setEntityTags).toHaveBeenCalledWith(1, 'resource', ['tag1', 'tag2'], mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(resourceService.getResourceById).toHaveBeenCalledWith(1);
    });

    it('應在創建資源時處理評論', async () => {
      // 模擬事務
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // 模擬創建資源
      const mockResource = { id: 1, name: '測試資源' };
      (Resource.create as jest.Mock).mockResolvedValue(mockResource);

      // 模擬標籤處理
      (tagService.setEntityTags as jest.Mock).mockResolvedValue([]);

      // 模擬創建評論
      (ResourceReview.create as jest.Mock).mockResolvedValue({ id: 1 });

      // 模擬獲取資源詳情
      jest.spyOn(resourceService, 'getResourceById').mockResolvedValue({
        id: 1,
        name: '測試資源',
        url: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
        description: '這是一個測試資源',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        status: 'active'
      });

      // 執行測試
      const resourceData = {
        name: '測試資源',
        url: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
        description: '這是一個測試資源',
        type: 'books_articles' as const,
        cost: 'free' as const,
        level: 'beginner' as const,
        tags: ['tag1', 'tag2'],
        review: {
          content: '這是一個測試評論',
          overallImpact: 4.5,
          changeMindset: 4.0,
          solveProblems: 3.5,
          gainPerspectives: 4.0,
          achieveGoals: 5.0
        }
      };

      const result = await resourceService.createResource(resourceData, 100);

      // 驗證結果
      expect(result).toBeDefined();
      expect(ResourceReview.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('應在發生錯誤時回滾事務', async () => {
      // 模擬事務
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // 模擬創建資源失敗
      const mockError = new Error('模擬錯誤');
      (Resource.create as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      const resourceData = {
        name: '測試資源',
        url: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
        description: '這是一個測試資源',
        type: 'books_articles' as const,
        cost: 'free' as const,
        level: 'beginner' as const
      };

      await expect(resourceService.createResource(resourceData, 100)).rejects.toThrow(mockError);

      // 驗證結果
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  // 測試更新資源
  describe('updateResource', () => {
    it('應成功更新資源', async () => {
      // 模擬事務
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // 模擬查詢資源
      const mockResource = {
        id: 1,
        name: '舊名稱',
        created_by: 100,
        update: jest.fn().mockResolvedValue(true)
      };
      (Resource.findByPk as jest.Mock).mockResolvedValue(mockResource);

      // 模擬標籤處理
      (tagService.setEntityTags as jest.Mock).mockResolvedValue([]);

      // 模擬獲取資源詳情
      jest.spyOn(resourceService, 'getResourceById').mockResolvedValue({
        id: 1,
        name: '新名稱',
        url: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
        description: '更新後的描述',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        status: 'active'
      });

      // 執行測試
      const updateData = {
        name: '新名稱',
        description: '更新後的描述',
        tags: ['tag1', 'tag2']
      };

      const result = await resourceService.updateResource(1, updateData, 100);

      // 驗證結果
      expect(result).toBeDefined();
      expect(result.name).toBe('新名稱');
      expect(result.description).toBe('更新後的描述');
      expect(mockResource.update).toHaveBeenCalled();
      expect(tagService.setEntityTags).toHaveBeenCalledWith(1, 'resource', ['tag1', 'tag2'], mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('應在資源不存在時拋出 NotFoundError', async () => {
      // 模擬事務
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // 模擬資源不存在
      (Resource.findByPk as jest.Mock).mockResolvedValue(null);

      // 執行測試
      const updateData = {
        name: '新名稱',
        description: '更新後的描述'
      };

      await expect(resourceService.updateResource(999, updateData, 100)).rejects.toThrow(NotFoundError);

      // 驗證結果
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('應在沒有權限時拋出 ForbiddenError', async () => {
      // 模擬事務
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // 模擬資源存在但不是創建者
      const mockResource = {
        id: 1,
        name: '舊名稱',
        created_by: 200,  // 不是當前用戶
        update: jest.fn()
      };
      (Resource.findByPk as jest.Mock).mockResolvedValue(mockResource);

      // 執行測試
      const updateData = {
        name: '新名稱',
        description: '更新後的描述'
      };

      await expect(resourceService.updateResource(1, updateData, 100)).rejects.toThrow(ForbiddenError);

      // 驗證結果
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  // 測試刪除資源
  describe('deleteResource', () => {
    it('應成功刪除資源', async () => {
      // 模擬查詢資源
      const mockResource = {
        id: 1,
        name: '測試資源',
        created_by: 100,
        destroy: jest.fn().mockResolvedValue(true)
      };
      (Resource.findByPk as jest.Mock).mockResolvedValue(mockResource);

      // 執行測試
      const result = await resourceService.deleteResource(1, 100);

      // 驗證結果
      expect(result).toEqual({ success: true });
      expect(mockResource.destroy).toHaveBeenCalled();
    });

    it('應在資源不存在時拋出 NotFoundError', async () => {
      // 模擬資源不存在
      (Resource.findByPk as jest.Mock).mockResolvedValue(null);

      // 執行測試
      await expect(resourceService.deleteResource(999, 100)).rejects.toThrow(NotFoundError);
    });

    it('應在沒有權限時拋出 ForbiddenError', async () => {
      // 模擬資源存在但不是創建者
      const mockResource = {
        id: 1,
        name: '測試資源',
        created_by: 200,  // 不是當前用戶
        destroy: jest.fn()
      };
      (Resource.findByPk as jest.Mock).mockResolvedValue(mockResource);

      // 執行測試
      await expect(resourceService.deleteResource(1, 100)).rejects.toThrow(ForbiddenError);
    });
  });
});
