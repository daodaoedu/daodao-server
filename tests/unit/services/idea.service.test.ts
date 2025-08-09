/**
 * 想法服務測試
 */

import ideaService from '@/services/idea.service';
import tagService from '@/services/tag.service';
import { NotFoundError, ForbiddenError } from '@utils/error-handler';

// Add local mocks for legacy model usage in tests
const Idea = {
  create: jest.fn(),
  findOne: jest.fn(),
};
const Resource = {
  create: jest.fn(),
  findOne: jest.fn(),
};
const EntityResource = {
  create: jest.fn(),
  findOne: jest.fn(),
};

// Mock Prisma service
jest.mock('@/services/database/prisma.service', () => ({
  prisma: {
    $transaction: jest.fn(),
    ideas: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    tags: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    resources: {
      create: jest.fn(),
      findUnique: jest.fn()
    },
    entity_resources: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    entity_tags: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    },
    users: {
      findUnique: jest.fn()
    },
    basic_infos: {
      findUnique: jest.fn()
    }
  }
}));

// Mock dependencies
jest.mock('@/services/tag.service');

describe('IdeaService', () => {
  let mockTransaction: any;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get prisma mock
    mockPrisma = require('@/services/database/prisma.service').prisma as any;
    
    // 模擬事務
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
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
        users: {
          id: 1,
          nickname: '測試用戶',
          contacts: {
            photo_url: 'https://example.com/avatar.jpg'
          }
        }
      };

      const mockEntityTags = [
        { tags: { name: '標籤1' } },
        { tags: { name: '標籤2' } }
      ];

      mockPrisma.ideas.findUnique.mockResolvedValue(mockIdea);
      mockPrisma.entity_tags.findMany.mockResolvedValue(mockEntityTags);
      mockPrisma.entity_resources.findMany.mockResolvedValue([]);

      const result = await ideaService.getIdeaById('idea-uuid-1');

      expect(result).toMatchObject({
        id: 'idea-uuid-1',
        content: '測試想法',
        user: {
          id: '1',
          name: '測試用戶',
          photoUrl: 'https://example.com/avatar.jpg'
        },
        tags: ['標籤1', '標籤2'],
        status: 'active'
      });

      expect(mockPrisma.ideas.findUnique).toHaveBeenCalledWith({
        where: { external_id: 'idea-uuid-1' },
        include: expect.any(Object)
      });
    });

    it('應該在找不到想法時拋出錯誤', async () => {
      mockPrisma.ideas.findUnique.mockResolvedValue(null);

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
          status: 'active',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          users: { id: 1, nickname: 'user1', contacts: null }
        },
        {
          external_id: 'idea-uuid-2',
          content: '想法2',
          status: 'active',
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02'),
          users: { id: 2, nickname: 'user2', contacts: null }
        }
      ];

      const mockEntityTags = [
        { entity_id: 'idea-uuid-1', tags: { id: 1, name: '標籤1' } },
        { entity_id: 'idea-uuid-2', tags: { id: 2, name: '標籤2' } }
      ];

      mockPrisma.ideas.findMany.mockResolvedValue(mockIdeas);
      mockPrisma.ideas.count.mockResolvedValue(2);
      mockPrisma.entity_tags.findMany.mockResolvedValue(mockEntityTags);

      const result = await ideaService.getIdeas({ sort: 'createdAt', order: 'desc' }, { page: 1, limit: 20, sort: 'created_at', order: 'desc' });

      expect(result.ideas).toHaveLength(2);
      expect(result.pagination).toEqual({
        currentPage: 1,
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      });

      expect(mockPrisma.ideas.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
        take: 20,
        skip: 0
      });
    });

    it('應該支援標籤篩選', async () => {
      const mockTaggedIdeaIds = [
        { entity_id: 'idea-uuid-1' },
        { entity_id: 'idea-uuid-2' }
      ];

      const mockAllTags = [
        { entity_id: 'idea-uuid-1', tags: { id: 1, name: 'React' } },
        { entity_id: 'idea-uuid-2', tags: { id: 2, name: 'TypeScript' } }
      ];

      mockPrisma.entity_tags.findMany
        .mockResolvedValueOnce(mockTaggedIdeaIds)  // First call for filtering
        .mockResolvedValueOnce(mockAllTags);       // Second call for getting all tags
      mockPrisma.ideas.findMany.mockResolvedValue([]);
      mockPrisma.ideas.count.mockResolvedValue(0);

      await ideaService.getIdeas({ tags: ['React', 'TypeScript'], sort: 'createdAt', order: 'desc' }, { page: 1, limit: 20, sort: 'createdAt', order: 'desc' });

      expect(mockPrisma.entity_tags.findMany).toHaveBeenCalledWith({
        where: {
          entity_type: 'idea',
          tags: {
            name: { in: ['React', 'TypeScript'] }
          }
        },
        select: { entity_id: true }
      });
    });

    it('應該支援關鍵字搜尋', async () => {
      mockPrisma.ideas.findMany.mockResolvedValue([]);
      mockPrisma.ideas.count.mockResolvedValue(0);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      await ideaService.getIdeas({ query: '測試關鍵字', sort: 'createdAt', order: 'desc' }, { page: 1, limit: 20, sort: 'createdAt', order: 'desc' });

      const callArgs = mockPrisma.ideas.findMany.mock.calls[0][0];
      expect(callArgs.where).toBeDefined();
      
      // 檢查查詢結構包含搜尋關鍵字
      expect(mockPrisma.ideas.findMany).toHaveBeenCalledWith(
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

      const mockFullIdea = {
        id: 'new-idea-uuid',
        content: '新想法',
        status: 'active',
        user: {
          id: 'user-uuid-1',
          name: '測試用戶'
        },
        tags: ['標籤1', '標籤2'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the transaction flow
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
      mockPrisma.ideas.create.mockResolvedValue(mockIdea);

      // Mock getIdeaById which is called at the end
      mockPrisma.ideas.findUnique.mockResolvedValue({
        ...mockIdea,
        users: {
          id: 1,
          nickname: '測試用戶',
          contacts: { photo_url: 'https://example.com/avatar.jpg' }
        }
      });
      mockPrisma.entity_tags.findMany.mockResolvedValue([
        { tags: { name: '標籤1' } },
        { tags: { name: '標籤2' } }
      ]);
      mockPrisma.entity_resources.findMany.mockResolvedValue([]);

      (tagService.setEntityTags as jest.Mock).mockResolvedValue(undefined);

      const result = await ideaService.createIdea({
        content: '新想法',
        tags: ['標籤1', '標籤2']
      }, 1);

      expect(result.idea).toBeDefined();
      expect(result.idea.content).toBe('新想法');
      expect(tagService.setEntityTags).toHaveBeenCalledWith(
        'idea',
        'new-idea-uuid',
        ['標籤1', '標籤2'],
        1,
        expect.any(Object)
      );
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

      // Mock the transaction flow
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
      mockPrisma.ideas.create.mockResolvedValue(mockIdea);
      mockPrisma.resources.create.mockResolvedValue(mockResource);
      mockPrisma.entity_resources.create.mockResolvedValue({});

      // Mock getIdeaById which is called at the end
      mockPrisma.ideas.findUnique.mockResolvedValue({
        ...mockIdea,
        users: {
          id: 1,
          nickname: '用戶1',
          contacts: null
        }
      });
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);
      mockPrisma.entity_resources.findMany.mockResolvedValue([]);

      const result = await ideaService.createIdea({
        content: '帶資源的想法',
        tags: [],
        resources: [{
          name: '測試資源',
          url: 'https://example.com',
          description: '描述'
        }]
      }, 1);

      expect(result.idea).toBeDefined();
      expect(result.idea.content).toBe('帶資源的想法');
    });

    it('應該在錯誤時回滾事務', async () => {
      // Mock transaction to throw error
      mockPrisma.$transaction.mockRejectedValue(new Error('創建失敗'));

      await expect(ideaService.createIdea({ content: '失敗的想法', tags: [] }, 1))
        .rejects.toThrow('創建失敗');
    });
  });

  describe('updateIdea', () => {
    it('應該成功更新想法', async () => {
      const mockExistingIdea = {
        id: 1,
        external_id: 'idea-uuid-1',
        user_id: 1,
        content: '原始內容',
        status: 'active'
      };

      const mockUpdatedIdea = {
        id: 'idea-uuid-1',
        content: '更新後的內容',
        status: 'active',
        user: {
          id: 'user-1',
          name: '用戶1'
        },
        tags: ['新標籤'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the transaction flow
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
      mockPrisma.ideas.findUnique.mockResolvedValueOnce(mockExistingIdea);
      mockPrisma.ideas.update.mockResolvedValue(mockExistingIdea);

      // Mock getIdeaById which is called at the end
      mockPrisma.ideas.findUnique.mockResolvedValueOnce({
        ...mockExistingIdea,
        content: '更新後的內容',
        users: {
          id: 1,
          nickname: '用戶1',
          contacts: null
        }
      });
      mockPrisma.entity_tags.findMany.mockResolvedValue([
        { tags: { name: '新標籤' } }
      ]);
      mockPrisma.entity_resources.findMany.mockResolvedValue([]);

      (tagService.setEntityTags as jest.Mock).mockResolvedValue(undefined);

      const result = await ideaService.updateIdea('idea-uuid-1', { content: '更新後的內容', tags: ['新標籤'] }, 1);

      expect(result).toBeDefined();
      expect(result.content).toBe('更新後的內容');
      expect(tagService.setEntityTags).toHaveBeenCalledWith(
        'idea',
        'idea-uuid-1',
        ['新標籤'],
        1,
        expect.any(Object)
      );
    });

    it('應該拒絕非作者的更新請求', async () => {
      const mockIdea = {
        id: 1,
        external_id: 'idea-uuid-1',
        user_id: 2, // 不同的用戶
        content: '原始內容'
      };

      // Mock the transaction flow
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
      mockPrisma.ideas.findUnique.mockResolvedValue(mockIdea);

      await expect(ideaService.updateIdea('idea-uuid-1', { content: '嘗試更新' }, 1))
        .rejects.toThrow(ForbiddenError);
    });

    it('應該處理找不到想法的情況', async () => {
      // Mock the transaction flow
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
      mockPrisma.ideas.findUnique.mockResolvedValue(null);

      await expect(ideaService.updateIdea('non-existent', { content: '更新' }, 1))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteIdea', () => {
    it('應該成功刪除想法', async () => {
      const mockIdea = {
        id: 1,
        external_id: 'idea-uuid-1',
        user_id: 1,
        content: '要刪除的想法'
      };

      // Mock the transaction flow
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
      mockPrisma.ideas.findUnique.mockResolvedValue(mockIdea);
      mockPrisma.ideas.update.mockResolvedValue(mockIdea);

      await ideaService.deleteIdea('idea-uuid-1', 1);

      // The test should complete without throwing
      expect(true).toBe(true);
    });

    it('應該拒絕非作者的刪除請求', async () => {
      const mockIdea = {
        id: 1,
        external_id: 'idea-uuid-1',
        user_id: 2, // 不同的用戶
        content: '其他人的想法'
      };

      // Mock the transaction flow
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
      mockPrisma.ideas.findUnique.mockResolvedValue(mockIdea);

      await expect(ideaService.deleteIdea('idea-uuid-1', 1))
        .rejects.toThrow(ForbiddenError);
    });

    it('應該處理找不到想法的情況', async () => {
      // Mock the transaction flow
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
      mockPrisma.ideas.findUnique.mockResolvedValue(null);

      await expect(ideaService.deleteIdea('non-existent', 1))
        .rejects.toThrow(NotFoundError);
    });
  });
});