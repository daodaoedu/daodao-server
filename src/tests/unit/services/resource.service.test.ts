/**
 * 資源服務測試
 * 完整測試資源相關業務邏輯
 */

import { mockPrisma } from '../../utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: mockPrisma
}));

jest.mock('@/services/transform.service', () => ({
  transformResourceToApi: jest.fn().mockImplementation((data) => data),
  transformResourceToDb: jest.fn().mockImplementation(async (data, userId) => ({
    name: data.name,
    url: data.url,
    image_url: data.imageUrl || null,
    description: data.description,
    video_url: data.videoUrl || null,
    type: data.type,
    cost: data.cost,
    level: data.level,
    major_category_id: data.majorCategory ? 1 : null,
    sub_category_id: data.subCategory ? 2 : null
  }))
}));

jest.mock('@/services/tag.service', () => ({
  __esModule: true,
  default: {
    setEntityTags: jest.fn().mockResolvedValue([]),
    getEntityTags: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('@/utils/transform-utils', () => ({
  decodeCursor: jest.fn().mockReturnValue({ id: 10, timestamp: '2024-01-01T00:00:00Z' }),
  generatePaginationMetadata: jest.fn().mockImplementation((data, count, limit, sort, hasMore) => ({
    cursors: { start: null, end: null },
    hasMore: hasMore || false,
    count: count
  }))
}));

import resourceService from '@/services/resource.service';
import tagService from '@/services/tag.service';
import { NotFoundError, ForbiddenError } from '@/utils/error-handler';
import { TestDataGenerator } from '../../utils/test-helpers';

describe('Resource Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getResourceById', () => {
    const resourceId = '550e8400-e29b-41d4-a716-446655440000';

    it('應該成功獲取資源詳情', async () => {
      const mockResource = {
        id: 1,
        external_id: resourceId,
        name: '測試資源',
        url: 'https://example.com',
        image_url: 'https://example.com/image.jpg',
        description: '這是一個測試資源',
        video_url: null,
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        status: 'active',
        created_by: 1,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        users: {
          id: 1,
          nickname: 'TestUser',
          contacts: {
            photo_url: null
          }
        },
        categories_resources_major_category_idTocategories: {
          id: 1,
          name: 'Programming'
        },
        categories_resources_sub_category_idTocategories: {
          id: 2,
          name: 'JavaScript'
        }
      };

      const mockTags = [
        {
          entity_id: resourceId,
          tags: { id: 1, name: 'javascript' }
        },
        {
          entity_id: resourceId,
          tags: { id: 2, name: 'react' }
        }
      ];

      const mockReviewStats = {
        _avg: {
          score_impact: 4.5,
          score_mindset: 4.0,
          score_problems: 4.2,
          score_perspectives: 4.1,
          score_goals: 4.3
        },
        _count: { id: 10 }
      };

      mockPrisma.resources.findUnique.mockResolvedValue(mockResource);
      mockPrisma.entity_tags.findMany.mockResolvedValue(mockTags);
      mockPrisma.resource_review.aggregate.mockResolvedValue(mockReviewStats);

      const result = await resourceService.getResourceById(resourceId);

      expect(mockPrisma.resources.findUnique).toHaveBeenCalledWith({
        where: { 
          external_id: resourceId,
          deleted_at: null 
        },
        include: expect.objectContaining({
          users: expect.any(Object),
          categories_resources_major_category_idTocategories: expect.any(Object),
          categories_resources_sub_category_idTocategories: expect.any(Object)
        })
      });

      expect(mockPrisma.entity_tags.findMany).toHaveBeenCalledWith({
        where: {
          entity_type: 'resource',
          entity_id: resourceId
        },
        include: {
          tags: true
        }
      });

      expect(mockPrisma.resource_review.aggregate).toHaveBeenCalledWith({
        where: {
          resource_id: 1,
          deleted_at: null
        },
        _avg: expect.any(Object),
        _count: expect.any(Object)
      });

      expect(result).toBeDefined();
    });

    it('應該在資源不存在時拋出 NotFoundError', async () => {
      mockPrisma.resources.findUnique.mockResolvedValue(null);

      await expect(resourceService.getResourceById(resourceId))
        .rejects
        .toThrow(NotFoundError);

      expect(mockPrisma.resources.findUnique).toHaveBeenCalledWith({
        where: { 
          external_id: resourceId,
          deleted_at: null 
        },
        include: expect.any(Object)
      });
    });

    it('應該處理資源沒有分類的情況', async () => {
      const mockResource = {
        id: 1,
        external_id: resourceId,
        name: '測試資源',
        url: 'https://example.com',
        image_url: null,
        description: '這是一個測試資源',
        video_url: null,
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        status: 'active',
        created_by: 1,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        users: {
          id: 1,
          nickname: 'TestUser',
          contacts: {
            photo_url: null
          }
        },
        categories_resources_major_category_idTocategories: null,
        categories_resources_sub_category_idTocategories: null
      };

      mockPrisma.resources.findUnique.mockResolvedValue(mockResource);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);
      mockPrisma.resource_review.aggregate.mockResolvedValue({
        _avg: {
          score_impact: null,
          score_mindset: null,
          score_problems: null,
          score_perspectives: null,
          score_goals: null
        },
        _count: { id: 0 }
      });

      const result = await resourceService.getResourceById(resourceId);

      expect(result).toBeDefined();
    });
  });

  describe('getResources', () => {
    it('應該使用預設分頁參數獲取資源列表', async () => {
      const mockResources = [
        {
          id: 1,
          external_id: '550e8400-e29b-41d4-a716-446655440000',
          name: '測試資源1',
          url: 'https://example.com/1',
          image_url: null,
          description: '描述1',
          video_url: null,
          type: 'books_articles',
          cost: 'free',
          level: 'beginner',
          status: 'active',
          created_by: 1,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          users: {
            id: 1,
            nickname: 'TestUser'
          },
          categories_resources_major_category_idTocategories: {
            id: 1,
            name: 'Programming'
          },
          categories_resources_sub_category_idTocategories: {
            id: 2,
            name: 'JavaScript'
          }
        }
      ];

      mockPrisma.resources.findMany.mockResolvedValue(mockResources);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      const result = await resourceService.getResources({}, {});

      expect(mockPrisma.resources.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null
        },
        include: expect.any(Object),
        orderBy: {
          created_at: 'desc'
        },
        take: 6 // DEFAULT_RESOURCE_PAGE_LIMIT + 1
      });

      expect(result).toEqual({
        resources: expect.any(Array),
        pagination: expect.any(Object)
      });
    });

    it('應該正確處理分頁參數', async () => {
      mockPrisma.resources.findMany.mockResolvedValue([]);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      const paginationParams = {
        cursor: 'test-cursor',
        limit: 10,
        sort: 'updated_at',
        order: 'asc' as const
      };

      await resourceService.getResources({}, paginationParams);

      expect(mockPrisma.resources.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null
          // 注意：當 sort 是 'updated_at' 時，不會有 created_at 條件
        },
        include: expect.any(Object),
        orderBy: {
          updated_at: 'asc'
        },
        take: 11 // limit + 1
      });
    });

    it('應該正確處理篩選參數', async () => {
      mockPrisma.resources.findMany.mockResolvedValue([]);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      const filters = {
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        majorCategory: 'Programming',
        subCategory: 'JavaScript',
        query: 'test query',
        createdBy: 1
      };

      await resourceService.getResources(filters, {});

      expect(mockPrisma.resources.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          type: 'books_articles',
          cost: 'free',
          level: 'beginner',
          created_by: 1,
          categories_resources_major_category_idTocategories: {
            name: 'Programming'
          },
          categories_resources_sub_category_idTocategories: {
            name: 'JavaScript'
          },
          OR: [
            {
              name: {
                contains: 'test query',
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: 'test query',
                mode: 'insensitive'
              }
            }
          ]
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: expect.any(Number)
      });
    });

    it('應該正確處理標籤篩選', async () => {
      const mockTaggedResources = [
        { entity_id: '550e8400-e29b-41d4-a716-446655440000' },
        { entity_id: '550e8400-e29b-41d4-a716-446655440001' }
      ];

      mockPrisma.entity_tags.findMany
        .mockResolvedValueOnce(mockTaggedResources) // 第一次調用用於標籤篩選
        .mockResolvedValueOnce([]); // 第二次調用用於獲取資源標籤

      mockPrisma.resources.findMany.mockResolvedValue([]);

      const filters = {
        tags: ['javascript', 'react']
      };

      await resourceService.getResources(filters, {});

      expect(mockPrisma.entity_tags.findMany).toHaveBeenCalledWith({
        where: {
          entity_type: 'resource',
          tags: {
            name: {
              in: ['javascript', 'react']
            }
          }
        },
        select: {
          entity_id: true
        }
      });

      expect(mockPrisma.resources.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          external_id: {
            in: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001']
          }
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: expect.any(Number)
      });
    });

    it('應該在沒有標籤匹配的資源時返回空結果', async () => {
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      const filters = {
        tags: ['non-existent-tag']
      };

      const result = await resourceService.getResources(filters, {});

      expect(result).toEqual({
        resources: [],
        pagination: {
          cursors: { start: null, end: null },
          hasMore: false,
          count: 0
        }
      });

      expect(mockPrisma.resources.findMany).not.toHaveBeenCalled();
    });

    it('應該正確處理分頁（有下一頁）', async () => {
      const mockResources = Array(6).fill(null).map((_, index) => ({
        id: index + 1,
        external_id: `550e8400-e29b-41d4-a716-44665544000${index}`,
        name: `測試資源${index + 1}`,
        url: `https://example.com/${index + 1}`,
        image_url: null,
        description: `描述${index + 1}`,
        video_url: null,
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        status: 'active',
        created_by: 1,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        deleted_at: null,
        major_category_id: 1,
        sub_category_id: 2,
        users: {
          id: 1,
          nickname: 'TestUser'
        },
        categories_resources_major_category_idTocategories: {
          id: 1,
          name: 'Programming'
        },
        categories_resources_sub_category_idTocategories: {
          id: 2,
          name: 'JavaScript'
        }
      }));

      mockPrisma.resources.findMany.mockResolvedValue(mockResources);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      const result = await resourceService.getResources({}, { limit: 5 });

      expect(result.resources).toHaveLength(5); // 應該只返回5個，因為第6個用於判斷是否有下一頁
      expect(result.pagination.hasMore).toBe(true); // 應該有更多數據
    });
  });

  describe('createResource', () => {
    const userId = 1;
    const resourceData = {
      name: '新測試資源',
      url: 'https://example.com/new',
      description: '新資源描述',
      type: 'books_articles' as const,
      cost: 'free' as const,
      level: 'beginner' as const,
      tags: ['javascript', 'react']
    };

    it('應該成功創建資源', async () => {
      const mockCreatedResource = {
        id: 1,
        external_id: '550e8400-e29b-41d4-a716-446655440000',
        name: resourceData.name,
        url: resourceData.url,
        description: resourceData.description,
        type: resourceData.type,
        cost: resourceData.cost,
        level: resourceData.level,
        status: 'active',
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockGetResourceResult = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: resourceData.name,
        url: resourceData.url,
        imageUrl: null,
        description: resourceData.description,
        videoUrl: null,
        type: resourceData.type,
        cost: resourceData.cost,
        level: resourceData.level,
        status: 'active',
        avgRating: null,
        majorCategory: null,
        subCategory: null,
        user: {
          id: 1,
          name: 'TestUser',
          _id: 'user-uuid',
          roleList: ['user'],
          photoURL: null,
          educationStage: null,
          tagList: [],
          selfIntroduction: null
        },
        tags: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        viewCount: 0,
        favoriteCount: 0,
        shareCount: 0,
        reviewCount: 0,
        likeCount: 0
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.create.mockResolvedValue(mockCreatedResource);

      const getResourceByIdSpy = jest.spyOn(resourceService, 'getResourceById')
        .mockResolvedValue(mockGetResourceResult);

      const result = await resourceService.createResource(resourceData, userId);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.resources.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: resourceData.name,
          url: resourceData.url,
          description: resourceData.description,
          type: resourceData.type,
          cost: resourceData.cost,
          level: resourceData.level,
          created_by: userId,
          status: 'active'
        })
      });

      expect(tagService.setEntityTags).toHaveBeenCalledWith(
        'resource',
        '550e8400-e29b-41d4-a716-446655440000',
        ['javascript', 'react'],
        userId,
        mockPrisma
      );

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      }

      getResourceByIdSpy.mockRestore();
    });

    it('應該在沒有標籤時成功創建資源', async () => {
      const resourceDataWithoutTags = {
        ...resourceData,
        tags: undefined
      };

      const mockCreatedResource = {
        id: 1,
        external_id: '550e8400-e29b-41d4-a716-446655440000',
        name: resourceDataWithoutTags.name,
        url: resourceDataWithoutTags.url,
        description: resourceDataWithoutTags.description,
        type: resourceDataWithoutTags.type,
        cost: resourceDataWithoutTags.cost,
        level: resourceDataWithoutTags.level,
        status: 'active',
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.create.mockResolvedValue(mockCreatedResource);

      const getResourceByIdSpy = jest.spyOn(resourceService, 'getResourceById')
        .mockResolvedValue({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: resourceDataWithoutTags.name,
          url: resourceDataWithoutTags.url,
          imageUrl: null,
          description: resourceDataWithoutTags.description,
          videoUrl: null,
          type: resourceDataWithoutTags.type,
          cost: resourceDataWithoutTags.cost,
          level: resourceDataWithoutTags.level,
          status: 'active',
          avgRating: null,
          majorCategory: null,
          subCategory: null,
          user: {
            id: 1,
            name: 'TestUser',
            _id: 'user-uuid',
            roleList: ['user'],
            photoURL: null,
            educationStage: null,
            tagList: [],
            selfIntroduction: null
          },
          tags: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          viewCount: 0,
          favoriteCount: 0,
          shareCount: 0,
          reviewCount: 0,
          likeCount: 0
        });

      await resourceService.createResource(resourceDataWithoutTags, userId);

      expect(tagService.setEntityTags).not.toHaveBeenCalled();

      getResourceByIdSpy.mockRestore();
    });

    it('應該驗證主分類是否存在', async () => {
      const resourceDataWithCategory = {
        ...resourceData,
        majorCategory: 'Programming'
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.categories.findUnique.mockResolvedValue(null);

      await expect(resourceService.createResource(resourceDataWithCategory, userId))
        .rejects
        .toThrow(NotFoundError);

      expect(mockPrisma.categories.findUnique).toHaveBeenCalledWith({
        where: { name: 'Programming' }
      });
    });

    it('應該驗證子分類是否存在', async () => {
      const resourceDataWithSubCategory = {
        ...resourceData,
        subCategory: 'JavaScript'
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.categories.findUnique.mockResolvedValue(null);

      await expect(resourceService.createResource(resourceDataWithSubCategory, userId))
        .rejects
        .toThrow(NotFoundError);

      expect(mockPrisma.categories.findUnique).toHaveBeenCalledWith({
        where: { name: 'JavaScript' }
      });
    });

    it('應該在事務失敗時回滾', async () => {
      const error = new Error('Database error');
      mockPrisma.$transaction.mockRejectedValue(error);

      await expect(resourceService.createResource(resourceData, userId))
        .rejects
        .toThrow(error);
    });
  });

  describe('updateResource', () => {
    const resourceId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = 1;
    const updateData = {
      name: '更新後的資源名稱',
      description: '更新後的描述',
      tags: ['updated-tag']
    };

    let getResourceByIdSpy: jest.SpyInstance;

    beforeEach(() => {
      getResourceByIdSpy = jest.spyOn(resourceService, 'getResourceById')
        .mockResolvedValue({
          id: resourceId,
          name: updateData.name,
          url: 'https://example.com',
          imageUrl: null,
          description: updateData.description,
          videoUrl: null,
          type: 'books_articles',
          cost: 'free',
          level: 'beginner',
          status: 'active',
          avgRating: null,
          majorCategory: null,
          subCategory: null,
          user: {
            id: 1,
            name: 'TestUser',
            _id: 'user-uuid',
            roleList: ['user'],
            photoURL: null,
            educationStage: null,
            tagList: [],
            selfIntroduction: null
          },
          tags: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          viewCount: 0,
          favoriteCount: 0,
          shareCount: 0,
          reviewCount: 0,
          likeCount: 0
        });
    });

    afterEach(() => {
      getResourceByIdSpy.mockRestore();
    });

    it('應該成功更新資源', async () => {
      const mockExistingResource = {
        id: 1,
        external_id: resourceId,
        name: '舊名稱',
        created_by: userId,
        deleted_at: null
      };

      const mockUpdatedResource = {
        ...mockExistingResource,
        name: updateData.name,
        description: updateData.description
      };

      const expectedResult = {
        id: resourceId,
        name: updateData.name,
        url: 'https://example.com',
        imageUrl: null,
        description: updateData.description,
        videoUrl: null,
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        status: 'active',
        avgRating: null,
        majorCategory: null,
        subCategory: null,
        user: {
          id: 1,
          name: 'TestUser',
          _id: 'user-uuid',
          roleList: ['user'],
          photoURL: null,
          educationStage: null,
          tagList: [],
          selfIntroduction: null
        },
        tags: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        viewCount: 0,
        favoriteCount: 0,
        shareCount: 0,
        reviewCount: 0,
        likeCount: 0
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.findUnique.mockResolvedValue(mockExistingResource);
      mockPrisma.resources.update.mockResolvedValue(mockUpdatedResource);

      const result = await resourceService.updateResource(resourceId, updateData, userId);

      expect(mockPrisma.resources.findUnique).toHaveBeenCalledWith({
        where: { 
          external_id: resourceId,
          deleted_at: null 
        }
      });

      expect(mockPrisma.resources.update).toHaveBeenCalledWith({
        where: { external_id: resourceId },
        data: expect.objectContaining({
          name: updateData.name,
          description: updateData.description
        })
      });

      expect(tagService.setEntityTags).toHaveBeenCalledWith(
        'resource',
        resourceId,
        ['updated-tag'],
        userId,
        mockPrisma
      );

      expect(result).toBeDefined();
    });

    it('應該在資源不存在時拋出 NotFoundError', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.findUnique.mockResolvedValue(null);

      await expect(resourceService.updateResource(resourceId, updateData, userId))
        .rejects
        .toThrow(NotFoundError);
    });

    it('應該在無權限時拋出 ForbiddenError', async () => {
      const mockExistingResource = {
        id: 1,
        external_id: resourceId,
        name: '舊名稱',
        created_by: 999, // 不同的用戶ID
        deleted_at: null
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.findUnique.mockResolvedValue(mockExistingResource);

      await expect(resourceService.updateResource(resourceId, updateData, userId))
        .rejects
        .toThrow(ForbiddenError);
    });

    it('應該處理未提供標籤的更新', async () => {
      const updateDataWithoutTags = {
        name: '更新後的資源名稱',
        description: '更新後的描述'
      };

      const mockExistingResource = {
        id: 1,
        external_id: resourceId,
        name: '舊名稱',
        created_by: userId,
        deleted_at: null
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.findUnique.mockResolvedValue(mockExistingResource);
      mockPrisma.resources.update.mockResolvedValue(mockExistingResource);


      await resourceService.updateResource(resourceId, updateDataWithoutTags, userId);

      expect(tagService.setEntityTags).not.toHaveBeenCalled();
    });
  });

  describe('deleteResource', () => {
    const resourceId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = 1;

    it('應該成功軟刪除資源', async () => {
      const mockExistingResource = {
        id: 1,
        external_id: resourceId,
        name: '測試資源',
        created_by: userId,
        deleted_at: null
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.findUnique.mockResolvedValue(mockExistingResource);
      mockPrisma.resources.update.mockResolvedValue(mockExistingResource);

      await resourceService.deleteResource(resourceId, userId);

      expect(mockPrisma.resources.findUnique).toHaveBeenCalledWith({
        where: { 
          external_id: resourceId,
          deleted_at: null 
        }
      });

      expect(mockPrisma.resources.update).toHaveBeenCalledWith({
        where: { external_id: resourceId },
        data: {
          deleted_at: expect.any(Date)
        }
      });
    });

    it('應該在資源不存在時拋出 NotFoundError', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.findUnique.mockResolvedValue(null);

      await expect(resourceService.deleteResource(resourceId, userId))
        .rejects
        .toThrow(NotFoundError);
    });

    it('應該在無權限時拋出 ForbiddenError', async () => {
      const mockExistingResource = {
        id: 1,
        external_id: resourceId,
        name: '測試資源',
        created_by: 999, // 不同的用戶ID
        deleted_at: null
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.resources.findUnique.mockResolvedValue(mockExistingResource);

      await expect(resourceService.deleteResource(resourceId, userId))
        .rejects
        .toThrow(ForbiddenError);
    });
  });

  describe('getResourceStats', () => {
    it('應該返回全部資源統計', async () => {
      const mockTypeStats = [
        { type: 'books_articles', _count: { type: 5 } },
        { type: 'video_content', _count: { type: 3 } },
        { type: 'workshops_courses', _count: { type: 2 } }
      ];

      mockPrisma.resources.count
        .mockResolvedValueOnce(10) // totalCount
        .mockResolvedValueOnce(8); // activeCount

      mockPrisma.resources.groupBy.mockResolvedValue(mockTypeStats);

      const result = await resourceService.getResourceStats();

      expect(mockPrisma.resources.count).toHaveBeenCalledTimes(2);
      expect(mockPrisma.resources.count).toHaveBeenNthCalledWith(1, {
        where: { deleted_at: null }
      });
      expect(mockPrisma.resources.count).toHaveBeenNthCalledWith(2, {
        where: { deleted_at: null, status: 'active' }
      });

      expect(mockPrisma.resources.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        where: { deleted_at: null },
        _count: { type: true }
      });

      expect(result).toEqual({
        totalCount: 10,
        activeCount: 8,
        typeStats: {
          'books_articles': 5,
          'video_content': 3,
          'workshops_courses': 2
        }
      });
    });

    it('應該返回特定用戶的資源統計', async () => {
      const userId = 1;

      mockPrisma.resources.count
        .mockResolvedValueOnce(5) // totalCount
        .mockResolvedValueOnce(4); // activeCount

      mockPrisma.resources.groupBy.mockResolvedValue([
        { type: 'books_articles', _count: { type: 3 } },
        { type: 'video_content', _count: { type: 2 } }
      ]);

      const result = await resourceService.getResourceStats(userId);

      expect(mockPrisma.resources.count).toHaveBeenNthCalledWith(1, {
        where: { deleted_at: null, created_by: userId }
      });
      expect(mockPrisma.resources.count).toHaveBeenNthCalledWith(2, {
        where: { deleted_at: null, created_by: userId, status: 'active' }
      });

      expect(mockPrisma.resources.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        where: { deleted_at: null, created_by: userId },
        _count: { type: true }
      });

      expect(result).toEqual({
        totalCount: 5,
        activeCount: 4,
        typeStats: {
          'books_articles': 3,
          'video_content': 2
        }
      });
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理 Prisma 連接錯誤', async () => {
      const error = new Error('Connection failed');
      mockPrisma.resources.findUnique.mockRejectedValue(error);
      
      // 確保沒有其他 spy 干擾
      jest.restoreAllMocks();

      await expect(resourceService.getResourceById('test-id'))
        .rejects
        .toThrow(error);
    });

    it('應該正確處理事務回滾', async () => {
      const error = new Error('Transaction failed');
      mockPrisma.$transaction.mockRejectedValue(error);

      await expect(resourceService.createResource({
        name: 'Test',
        url: 'https://example.com',
        description: 'Test',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner'
      }, 1)).rejects.toThrow(error);
    });
  });

  describe('邊界情況測試', () => {
    it('應該處理空的資源列表', async () => {
      mockPrisma.resources.findMany.mockResolvedValue([]);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      const result = await resourceService.getResources({}, {});

      expect(result.resources).toEqual([]);
      expect(result.pagination.count).toBe(0);
    });

    it('應該處理極大的分頁限制', async () => {
      mockPrisma.resources.findMany.mockResolvedValue([]);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      await resourceService.getResources({}, { limit: 1000 });

      expect(mockPrisma.resources.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 21 // 應該被限制為 MAX_RESOURCE_PAGE_LIMIT + 1
        })
      );
    });

    it('應該處理特殊字符的搜尋查詢', async () => {
      mockPrisma.resources.findMany.mockResolvedValue([]);
      mockPrisma.entity_tags.findMany.mockResolvedValue([]);

      const specialQuery = "test'query\"with<special>chars&symbols";

      await resourceService.getResources({ query: specialQuery }, {});

      expect(mockPrisma.resources.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              {
                name: {
                  contains: specialQuery,
                  mode: 'insensitive'
                }
              },
              {
                description: {
                  contains: specialQuery,
                  mode: 'insensitive'
                }
              }
            ]
          })
        })
      );
    });
  });
});