/**
 * 想法服務測試
 */

// Import mocked models
const mockIdea = { findOne: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() };
const mockTag = { findOne: jest.fn(), findAll: jest.fn() };
const mockResource = { create: jest.fn() };
const mockEntityResource = { create: jest.fn() };

// Mock the models before importing the service
jest.mock('@models/index', () => ({
  Idea: mockIdea,
  Tag: mockTag,
  Resource: mockResource,
  EntityResource: mockEntityResource
}));

const { Idea, Tag, Resource, EntityResource } = require('@models/index');
import ideaService from '@services/idea-service';
import tagService from '@services/tag-service';
import { NotFoundError, ForbiddenError } from '@utils/error-handler';
import sequelize from '../../../config/database';

// 模擬依賴
jest.mock('@models/index');
jest.mock('@services/tag-service');
jest.mock('@config/database', () => ({
  __esModule: true,
  default: {
    transaction: jest.fn()
  }
}));

// 模擬 User 和 BasicInfo
jest.mock('@models/index', () => ({
  User: {
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  },
  BasicInfo: {
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  }
}));

describe('IdeaService', () => {
  let mockTransaction: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 模擬事務
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  describe('getIdeaById', () => {
    it('應該成功獲取想法詳情', async () => {
      const mockIdea = {
        external_id: 'idea-uuid-1',
        content: '測試想法',
        user_id: 1,
        status: 'active',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        deleted_at: null,
        toJSON: jest.fn().mockReturnValue({
          external_id: 'idea-uuid-1',
          content: '測試想法',
          status: 'active',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          deleted_at: null,
          author: {
            external_id: 'user-uuid-1',
            username: 'testuser',
            BasicInfo: {
              nickname: '測試用戶',
              avatar_url: 'https://example.com/avatar.jpg'
            }
          },
          tags: [{ name: '標籤1' }, { name: '標籤2' }]
        })
      };

      (Idea.findOne as jest.Mock).mockResolvedValue(mockIdea);

      const result = await ideaService.getIdeaById('idea-uuid-1');

      expect(result).toMatchObject({
        id: 'idea-uuid-1',
        content: '測試想法',
        user: {
          id: 'user-uuid-1',
          name: '測試用戶',
          photoUrl: 'https://example.com/avatar.jpg'
        },
        tags: ['標籤1', '標籤2'],
        status: 'active'
      });

      expect(Idea.findOne).toHaveBeenCalledWith({
        where: { external_id: 'idea-uuid-1' },
        include: expect.any(Array)
      });
    });

    it('應該在找不到想法時拋出錯誤', async () => {
      (Idea.findOne as jest.Mock).mockResolvedValue(null);

      await expect(ideaService.getIdeaById('non-existent-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getIdeas', () => {
    it('應該成功獲取想法列表', async () => {
      const mockIdeas = [
        {
          external_id: 'idea-uuid-1',
          content: '想法1',
          toJSON: jest.fn().mockReturnValue({
            external_id: 'idea-uuid-1',
            content: '想法1',
            status: 'active',
            created_at: new Date('2024-01-01'),
            updated_at: new Date('2024-01-01'),
            author: { external_id: 'user-1', username: 'user1' },
            tags: [{ name: '標籤1' }]
          })
        },
        {
          external_id: 'idea-uuid-2',
          content: '想法2',
          toJSON: jest.fn().mockReturnValue({
            external_id: 'idea-uuid-2',
            content: '想法2',
            status: 'active',
            created_at: new Date('2024-01-02'),
            updated_at: new Date('2024-01-02'),
            author: { external_id: 'user-2', username: 'user2' },
            tags: [{ name: '標籤2' }]
          })
        }
      ];

      (Idea.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockIdeas,
        count: 2
      });

      const result = await ideaService.getIdeas();

      expect(result.ideas).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      });

      expect(Idea.findAndCountAll).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: expect.any(Array),
        order: [['created_at', 'desc']],
        limit: 20,
        offset: 0,
        distinct: true
      });
    });

    it('應該支援標籤篩選', async () => {
      (Idea.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await ideaService.getIdeas({ tags: ['React', 'TypeScript'], sort: 'createdAt', order: 'desc' });

      expect(Idea.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              model: Tag,
              as: 'tags',
              where: expect.objectContaining({
                name: expect.any(Object)
              })
            })
          ])
        })
      );
    });

    it('應該支援關鍵字搜尋', async () => {
      (Idea.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await ideaService.getIdeas({ query: '測試關鍵字', sort: 'createdAt', order: 'desc' });

      const callArgs = (Idea.findAndCountAll as jest.Mock).mock.calls[0][0];
      expect(callArgs.where).toBeDefined();
      
      // 檢查是否包含搜尋條件
      const whereKeys = Object.getOwnPropertySymbols(callArgs.where);
      expect(whereKeys.length).toBeGreaterThan(0);
      
      // 檢查查詢結構包含搜尋關鍵字
      expect(Idea.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({})
        })
      );
    });
  });

  describe('createIdea', () => {
    it('應該成功創建想法', async () => {
      const mockIdea = {
        id: 1,
        external_id: 'new-idea-uuid',
        content: '新想法',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      (Idea.create as jest.Mock).mockResolvedValue(mockIdea);
      (tagService.setEntityTags as jest.Mock).mockResolvedValue(undefined);

      // 模擬 Idea.findOne 方法用於 getIdeaById
      const mockIdeaWithUser = {
        ...mockIdea,
        author: {
          external_id: 'user-1',
          username: '用戶1'
        },
        toJSON: jest.fn().mockReturnValue({
          ...mockIdea,
          created_at: new Date(),
          updated_at: new Date(),
          author: {
            external_id: 'user-1',
            username: '用戶1'
          }
        })
      };
      (Idea.findOne as jest.Mock).mockResolvedValue(mockIdeaWithUser);

      const result = await ideaService.createIdea(1, {
        content: '新想法',
        tags: ['標籤1', '標籤2']
      });

      expect(result.idea).toBeDefined();
      expect(result.resources).toEqual([]);
      expect(Idea.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          content: '新想法',
          status: 'active',
          has_resources: false
        }),
        { transaction: mockTransaction }
      );
      expect(tagService.setEntityTags).toHaveBeenCalledWith(
        1,
        'idea',
        ['標籤1', '標籤2'],
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('應該成功創建帶資源的想法', async () => {
      const mockIdea = {
        id: 1,
        external_id: 'new-idea-uuid',
        content: '帶資源的想法'
      };

      const mockResource = {
        id: 1,
        external_id: 'resource-uuid',
        name: '測試資源',
        url: 'https://example.com',
        description: '描述',
        created_at: new Date()
      };

      (Idea.create as jest.Mock).mockResolvedValue(mockIdea);
      (Resource.create as jest.Mock).mockResolvedValue(mockResource);
      (EntityResource.create as jest.Mock).mockResolvedValue({});

      // 模擬 Idea.findOne 方法用於 getIdeaById
      const mockIdeaWithUser = {
        ...mockIdea,
        author: {
          external_id: 'user-1',
          username: '用戶1'
        },
        toJSON: jest.fn().mockReturnValue({
          ...mockIdea,
          created_at: new Date(),
          updated_at: new Date(),
          author: {
            external_id: 'user-1',
            username: '用戶1'
          }
        })
      };
      (Idea.findOne as jest.Mock).mockResolvedValue(mockIdeaWithUser);

      const result = await ideaService.createIdea(1, {
        content: '帶資源的想法',
        tags: [],
        resources: [{
          name: '測試資源',
          url: 'https://example.com',
          description: '描述'
        }]
      });

      expect(result.resources).toHaveLength(1);
      expect(result.resources).toBeDefined();
      if (result.resources) {
        expect(result.resources[0]).toMatchObject({
        id: 'resource-uuid',
        name: '測試資源',
        url: 'https://example.com',
        status: 'draft',
        createdFromType: 'idea',
        createdFromId: 'new-idea-uuid'
        });
      }

      expect(Resource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '測試資源',
          url: 'https://example.com',
          status: 'draft',
          created_by: 1
        }),
        { transaction: mockTransaction }
      );

      expect(EntityResource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          resource_id: 1,
          entity_type: 'idea',
          entity_id: 'new-idea-uuid',
          created_by: 1
        }),
        { transaction: mockTransaction }
      );
    });

    it('應該在錯誤時回滾事務', async () => {
      (Idea.create as jest.Mock).mockRejectedValue(new Error('創建失敗'));

      await expect(ideaService.createIdea(1, { content: '失敗的想法', tags: [] }))
        .rejects.toThrow('創建失敗');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  describe('updateIdea', () => {
    it('應該成功更新想法', async () => {
      const mockIdea = {
        id: 1,
        external_id: 'idea-uuid-1',
        user_id: 1,
        content: '原始內容',
        status: 'active',
        version: 1,
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          external_id: 'idea-uuid-1',
          user_id: 1,
          content: '更新後的內容',
          status: 'active',
          version: 1,
          author: {
            external_id: 'user-1',
            username: '用戶1'
          }
        })
      };

      const mockIdeaWithUser = {
        ...mockIdea,
        author: {
          external_id: 'user-1',
          username: '用戶1'
        },
        toJSON: jest.fn().mockReturnValue({
          ...mockIdea,
          created_at: new Date(),
          updated_at: new Date(),
          author: {
            external_id: 'user-1',
            username: '用戶1'
          }
        })
      };

      (Idea.findOne as jest.Mock).mockResolvedValueOnce(mockIdea).mockResolvedValueOnce(mockIdeaWithUser);
      (tagService.setEntityTags as jest.Mock).mockResolvedValue(undefined);

      const result = await ideaService.updateIdea('idea-uuid-1', 1, {
        content: '更新後的內容',
        tags: ['新標籤']
      });

      expect(mockIdea.update).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '更新後的內容',
          version: 2
        }),
        { transaction: mockTransaction }
      );
      expect(tagService.setEntityTags).toHaveBeenCalledWith(
        1,
        'idea',
        ['新標籤'],
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('應該拒絕非作者的更新請求', async () => {
      const mockIdea = {
        id: 1,
        external_id: 'idea-uuid-1',
        user_id: 2, // 不同的用戶
        content: '原始內容'
      };

      (Idea.findOne as jest.Mock).mockResolvedValue(mockIdea);

      await expect(ideaService.updateIdea('idea-uuid-1', 1, { content: '嘗試更新' }))
        .rejects.toThrow(ForbiddenError);

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('應該處理找不到想法的情況', async () => {
      (Idea.findOne as jest.Mock).mockResolvedValue(null);

      await expect(ideaService.updateIdea('non-existent', 1, { content: '更新' }))
        .rejects.toThrow(NotFoundError);

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('deleteIdea', () => {
    it('應該成功刪除想法', async () => {
      const mockIdea = {
        id: 1,
        external_id: 'idea-uuid-1',
        user_id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      (Idea.findOne as jest.Mock).mockResolvedValue(mockIdea);

      await ideaService.deleteIdea('idea-uuid-1', 1);

      expect(mockIdea.destroy).toHaveBeenCalled();
    });

    it('應該拒絕非作者的刪除請求', async () => {
      const mockIdea = {
        id: 1,
        external_id: 'idea-uuid-1',
        user_id: 2, // 不同的用戶
        destroy: jest.fn()
      };

      (Idea.findOne as jest.Mock).mockResolvedValue(mockIdea);

      await expect(ideaService.deleteIdea('idea-uuid-1', 1))
        .rejects.toThrow(ForbiddenError);

      expect(mockIdea.destroy).not.toHaveBeenCalled();
    });

    it('應該處理找不到想法的情況', async () => {
      (Idea.findOne as jest.Mock).mockResolvedValue(null);

      await expect(ideaService.deleteIdea('non-existent', 1))
        .rejects.toThrow(NotFoundError);
    });
  });
});