/**
 * Resource Service Unit Tests
 * Tests resource service business logic in isolation
 * 
 * Focus: Business logic validation, data transformation, resource management operations
 * Mocks: All external dependencies (database, transform service, tag service, pagination utils)
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

// Mock external dependencies
const mockTransformService = {
  transformResourceToApi: jest.fn(),
  transformResourceToDb: jest.fn()
};

const mockTagService = {
  setEntityTags: jest.fn(),
  getEntityTags: jest.fn(),
  removeEntityTag: jest.fn()
};

const mockTransformUtils = {
  decodeCursor: jest.fn(),
  generatePaginationMetadata: jest.fn()
};

const mockResponseHelper = {
  createSuccessResponse: jest.fn(),
  createCursorPaginatedResponse: jest.fn()
};

const mockIdConverter = {
  externalToInternalId: jest.fn()
};

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/transform.service', () => mockTransformService);

jest.mock('@/services/tag.service', () => mockTagService);

jest.mock('@/utils/transform-utils', () => mockTransformUtils);

jest.mock('@/utils/response-helper', () => mockResponseHelper);

jest.mock('@/services/id-converter.service', () => mockIdConverter);

import * as resourceService from '@/services/resource.service';
import { NotFoundError, ForbiddenError } from '@/middleware/error.middleware';

describe('Resource Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks(); // Restore any spies from previous tests
    setupTransactionMock();

    // Setup common mock responses
    mockTransformService.transformResourceToApi.mockImplementation((data) => data);
    mockTransformService.transformResourceToDb.mockImplementation(async (data) => ({
      name: data.name || '',
      url: data.url || '',
      image_url: data.imageUrl || null,
      description: data.description || '',
      video_url: data.videoUrl || null,
      type: data.type || '',
      cost: data.cost || '',
      level: data.level || '',
      major_category_id: data.majorCategory ? 1 : null,
      sub_category_id: data.subCategory ? 2 : null
    }));

    mockTagService.setEntityTags.mockResolvedValue(undefined);
    mockTagService.getEntityTags.mockResolvedValue([]);

    // Mock ID converter to return a valid numeric ID
    mockIdConverter.externalToInternalId.mockResolvedValue(1);

    mockTransformUtils.decodeCursor.mockReturnValue({ id: 10, timestamp: new Date('2024-01-01') });
    mockTransformUtils.generatePaginationMetadata.mockImplementation((_, count, __, ___, hasMore) => ({
      cursors: { start: null, end: null },
      hasMore: hasMore || false,
      count: count
    }));

    mockResponseHelper.createSuccessResponse.mockImplementation((data) => ({
      success: true,
      data,
      message: 'Success'
    }));

    mockResponseHelper.createCursorPaginatedResponse.mockImplementation((data, pagination, meta = {}) => ({
      success: true,
      data,
      pagination,
      meta
    }));

    // Default mock for resources.groupBy (used in facets calculation)
    prismaMock.resources.groupBy.mockResolvedValue([]);

    // Default mock for categories.findMany (used in facets)
    prismaMock.categories.findMany.mockResolvedValue([]);
  });
  
  // Test data factories matching Prisma schema
  const createTestResource = (overrides = {}) => ({
    id: 1,
    external_id: 'resource-uuid',
    name: 'Test Resource',
    url: 'https://example.com',
    image_url: null,
    description: 'Test description',
    video_url: null,
    type: 'books_articles',
    cost: 'free',
    level: 'beginner',
    status: 'active',
    major_category_id: null,
    sub_category_id: null,
    created_by: 1,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null,
    ...overrides
  });
  
  const createTestResourceWithRelations = (overrides = {}) => ({
    ...createTestResource(overrides),
    users: {
      id: 1,
      nickname: 'Test User',
      contacts: {
        photo_url: null
      }
    },
    categories_resources_major_category_idTocategories: null,
    categories_resources_sub_category_idTocategories: null
  });
  
  
  const createTestReviewStats = (overrides = {}) => ({
    _avg: {
      score_impact: 4.5,
      score_mindset: 4.0,
      score_problems: 4.2,
      score_perspectives: 4.1,
      score_goals: 4.3
    },
    _count: { id: 10 },
    _sum: {},
    _min: {},
    _max: {},
    ...overrides
  });

  describe('getResourceById', () => {
    it('should get resource by ID successfully with complete data', async () => {
      // Arrange: Setup test data and mocks
      const resourceId = 'resource-uuid';
      const testResource = createTestResourceWithRelations({
        external_id: resourceId,
        name: 'Test Resource',
        description: 'Test description',
        categories_resources_major_category_idTocategories: { id: 1, name: 'Programming' },
        categories_resources_sub_category_idTocategories: { id: 2, name: 'JavaScript' }
      });
      
      const mockTagResults = [
        { tag_id: 1, tag_name: 'javascript' },
        { tag_id: 2, tag_name: 'react' }
      ];
      
      const mockReviewStats = createTestReviewStats();
      
      prismaMock.resources.findFirst.mockResolvedValue(testResource);
      prismaMock.$queryRaw.mockResolvedValue(mockTagResults);
      prismaMock.resource_review.aggregate.mockResolvedValue(mockReviewStats as any);

      // Act: Execute the service method
      const result = await resourceService.getResourceById(resourceId);

      // Assert: Verify behavior and database calls
      expect(prismaMock.resources.findFirst).toHaveBeenCalledWith({
        where: {
          external_id: resourceId,
          deleted_at: null
        },
        include: expect.objectContaining({
          users: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              nickname: true,
              contacts: expect.objectContaining({
                select: expect.objectContaining({
                  photo_url: true
                })
              })
            })
          })
        })
      });
      
      expect(prismaMock.$queryRaw).toHaveBeenCalled();
      

      expect(mockTransformService.transformResourceToApi).toHaveBeenCalled();
      expect(mockResponseHelper.createSuccessResponse).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundError when resource not found', async () => {
      // Arrange: Resource doesn't exist
      const resourceId = 'non-existent-uuid';
      prismaMock.resources.findFirst.mockResolvedValue(null);

      // Act & Assert: Verify error is thrown
      await expect(resourceService.getResourceById(resourceId))
        .rejects
        .toThrow('資源不存在');
        
      expect(prismaMock.resources.findFirst).toHaveBeenCalledWith({
        where: {
          external_id: resourceId,
          deleted_at: null
        },
        include: expect.any(Object)
      });
      
      // Should not call other methods if resource not found
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
      expect(prismaMock.resource_review.aggregate).not.toHaveBeenCalled();
    });

    it('should handle resource with null categories and empty review stats', async () => {
      // Arrange: Resource with minimal data
      const resourceId = 'resource-uuid';
      const testResource = {
        ...createTestResourceWithRelations({
          external_id: resourceId,
          categories_resources_major_category_idTocategories: null,
          categories_resources_sub_category_idTocategories: null
        }),
        users: null // Test handling of null user
      };
      
      const mockReviewStats = {
        _avg: {
          score_impact: null,
          score_mindset: null,
          score_problems: null,
          score_perspectives: null,
          score_goals: null
        },
        _count: { id: 0 },
        _sum: {},
        _min: {},
        _max: {}
      };
      
      prismaMock.resources.findFirst.mockResolvedValue(testResource);
      prismaMock.$queryRaw.mockResolvedValue([]);

      // Act: Execute the service method
      const result = await resourceService.getResourceById(resourceId);

      // Assert: Verify correct handling of null values
      expect(result.success).toBe(true);
      expect(mockTransformService.transformResourceToApi).toHaveBeenCalledWith(
        expect.objectContaining({
          external_id: resourceId,
          name: 'Test Resource',
          User: null,
          majorCategory: null,
          subCategory: null,
          tags: expect.arrayContaining([])
        })
      );
    });
  });

  describe('getResources', () => {
    it('should get resources list with default pagination parameters', async () => {
      // Arrange: Setup resources data
      const testResources = [
        createTestResourceWithRelations({ id: 1, external_id: 'resource-1' }),
        createTestResourceWithRelations({ id: 2, external_id: 'resource-2' })
      ];
      
      prismaMock.resources.findMany.mockResolvedValue(testResources);
      prismaMock.$queryRaw.mockResolvedValue([]);
      prismaMock.resource_review.groupBy.mockResolvedValue([]);

      // Act: Execute the service method
      const result = await resourceService.getResources({}, {});

      // Assert: Verify database calls and response
      expect(prismaMock.resources.findMany).toHaveBeenCalledWith({
        where: { deleted_at: null },
        include: expect.objectContaining({
          users: expect.any(Object),
          categories_resources_major_category_idTocategories: expect.any(Object),
          categories_resources_sub_category_idTocategories: expect.any(Object)
        }),
        orderBy: { created_at: 'desc' },
        take: 6 // DEFAULT_RESOURCE_PAGE_LIMIT + 1
      });
      
      expect(mockResponseHelper.createCursorPaginatedResponse).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle filters correctly', async () => {
      // Arrange: Setup filters
      const filters = {
        type: 'books_articles',
        cost: 'free',
        level: 'beginner',
        majorCategory: 'Programming',
        subCategory: 'JavaScript',
        query: 'test search',
        createdBy: 1
      };
      
      prismaMock.resources.findMany.mockResolvedValue([]);
      prismaMock.$queryRaw.mockResolvedValue([]);
      prismaMock.resource_review.groupBy.mockResolvedValue([]);

      // Act: Execute the service method
      await resourceService.getResources(filters, {});

      // Assert: Verify where conditions
      expect(prismaMock.resources.findMany).toHaveBeenCalledWith({
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
                contains: 'test search',
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: 'test search',
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

    it('should handle tag filtering correctly', async () => {
      // Arrange: Setup tag filtering
      const taggedResourceIds = [1, 2];
      const mockTaggedEntities = taggedResourceIds.map(id => ({
        id: id,
        created_by: 1,
        created_at: new Date(),
        updated_at: new Date(),
        entity_type: 'resource',
        entity_id: id,
        tag_id: 1
      }));
      
      prismaMock.entity_tags.findMany.mockResolvedValue(mockTaggedEntities);
      prismaMock.resources.findMany.mockResolvedValue([]);
      prismaMock.$queryRaw.mockResolvedValue([]);
      prismaMock.resource_review.groupBy.mockResolvedValue([]);

      const filters = { tags: ['javascript', 'react'] };
      prismaMock.resource_review.groupBy.mockResolvedValue([]);

      // Act: Execute the service method
      await resourceService.getResources(filters, {});

      // Assert: Verify tag filtering query
      expect(prismaMock.entity_tags.findMany).toHaveBeenCalledWith({
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
      
      expect(prismaMock.resources.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: {
              in: taggedResourceIds
            }
          })
        })
      );
    });

    it('should return empty result when no resources match tag filter', async () => {
      // Arrange: No resources match tag filter
      prismaMock.entity_tags.findMany.mockResolvedValue([]);

      // Act: Execute the service method
      await resourceService.getResources({ tags: ['non-existent-tag'] }, {});

      // Assert: Verify empty response
      expect(mockResponseHelper.createCursorPaginatedResponse).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          cursors: { start: null, end: null },
          hasMore: false,
          count: 0
        })
      );
      
      // Should not query resources if no tags match
      expect(prismaMock.resources.findMany).not.toHaveBeenCalled();
    });

    it('should handle pagination with cursor correctly', async () => {
      // Arrange: Setup pagination
      const paginationParams = {
        cursor: 'test-cursor',
        limit: 10,
        sort: 'created_at',
        order: 'asc' as const
      };
      
      prismaMock.resources.findMany.mockResolvedValue([]);
      prismaMock.$queryRaw.mockResolvedValue([]);
      prismaMock.resource_review.groupBy.mockResolvedValue([]);

      // Act: Execute the service method
      await resourceService.getResources({}, paginationParams);

      // Assert: Verify cursor pagination
      expect(mockTransformUtils.decodeCursor).toHaveBeenCalledWith('test-cursor');
      expect(prismaMock.resources.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: { gt: new Date('2024-01-01') } // asc order
          }),
          orderBy: { created_at: 'asc' },
          take: 11 // limit + 1
        })
      );
    });
  });

  describe('createResource', () => {
    const userId = 1;
    const resourceData = {
      name: 'New Test Resource',
      url: 'https://example.com/new',
      description: 'New resource description',
      type: 'books_articles',
      cost: 'free',
      level: 'beginner',
      tags: ['javascript', 'react']
    };

    it('should create resource successfully with complete data', async () => {
      // Arrange: Setup test data
      const createdResource = createTestResource({
        external_id: 'new-resource-uuid',
        name: resourceData.name,
        url: resourceData.url,
        description: resourceData.description
      });
      
      
      prismaMock.resources.create.mockResolvedValue(createdResource);
      
      // The getResourceById is called internally - we need to prevent the recursion
      // by mocking the internal database calls it would make
      prismaMock.resources.findFirst.mockResolvedValueOnce(createdResource);
      prismaMock.$queryRaw.mockResolvedValueOnce([]);
      prismaMock.resource_review.aggregate.mockResolvedValueOnce({
        _avg: { score_impact: null, score_mindset: null, score_problems: null, score_perspectives: null, score_goals: null },
        _count: { id: 0 },
        _sum: {}, _min: {}, _max: {}
      } as any);

      // Act: Execute the service method
      const result = await resourceService.createResource(resourceData, userId);

      // Assert: Verify database operations
      expect(prismaMock.resources.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: resourceData.name,
          url: resourceData.url,
          description: resourceData.description,
          type: resourceData.type,
          cost: resourceData.cost,
          level: resourceData.level,
          created_by: userId,
          status: 'active'
        }),
        include: expect.objectContaining({
          users: expect.any(Object),
          categories_resources_major_category_idTocategories: expect.any(Object),
          categories_resources_sub_category_idTocategories: expect.any(Object)
        })
      });
      
      expect(mockTagService.setEntityTags).toHaveBeenCalledWith(
        'resource',
        createdResource.id,
        ['javascript', 'react'],
        userId,
        prismaMock
      );
      
      expect(result.success).toBe(true);
    });

    it('should create resource without tags successfully', async () => {
      // Arrange: Resource data without tags
      const resourceDataWithoutTags = { ...resourceData, tags: undefined };
      const createdResource = createTestResource();
      
      prismaMock.resources.create.mockResolvedValue(createdResource);
      
      // Mock the internal getResourceById database calls
      prismaMock.resources.findFirst.mockResolvedValueOnce(createdResource);
      prismaMock.$queryRaw.mockResolvedValueOnce([]);
      prismaMock.resource_review.aggregate.mockResolvedValueOnce({
        _avg: { score_impact: null, score_mindset: null, score_problems: null, score_perspectives: null, score_goals: null },
        _count: { id: 0 },
        _sum: {}, _min: {}, _max: {}
      } as any);

      // Act: Execute the service method
      await resourceService.createResource(resourceDataWithoutTags, userId);

      // Assert: Verify tags are not set
      expect(mockTagService.setEntityTags).not.toHaveBeenCalled();
    });

    it('should handle non-existent major category gracefully', async () => {
      // Arrange: Resource with non-existent major category
      const resourceDataWithCategory = {
        ...resourceData,
        majorCategory: 'NonExistentCategory'
      };

      const createdResource = createTestResource({
        id: 1,
        external_id: 'created-uuid',
        major_category_id: null
      });

      prismaMock.categories.findUnique.mockResolvedValue(null);
      prismaMock.resources.create.mockResolvedValue(createdResource);
      prismaMock.$queryRaw.mockResolvedValue([]);

      // Act: Create resource with non-existent category
      const result = await resourceService.createResource(resourceDataWithCategory, userId);

      // Assert: Verify category lookup was attempted but resource was still created
      expect(prismaMock.categories.findUnique).toHaveBeenCalledWith({
        where: { name: 'NonExistentCategory' }
      });
      expect(result.success).toBe(true);
    });

    it('should handle non-existent sub category gracefully', async () => {
      // Arrange: Resource with non-existent sub category
      const resourceDataWithSubCategory = {
        ...resourceData,
        subCategory: 'NonExistentSubCategory'
      };

      const createdResource = createTestResource({
        id: 1,
        external_id: 'created-uuid',
        sub_category_id: null
      });

      prismaMock.categories.findUnique.mockResolvedValue(null);
      prismaMock.resources.create.mockResolvedValue(createdResource);
      prismaMock.$queryRaw.mockResolvedValue([]);

      // Act: Create resource with non-existent sub category
      const result = await resourceService.createResource(resourceDataWithSubCategory, userId);

      // Assert: Verify category lookup was attempted but resource was still created
      expect(prismaMock.categories.findUnique).toHaveBeenCalledWith({
        where: { name: 'NonExistentSubCategory' }
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateResource', () => {
    const resourceId = 'resource-uuid';
    const userId = 1;
    const updateData = {
      name: 'Updated Resource Name',
      description: 'Updated description',
      tags: ['updated-tag']
    };

    it('should update resource successfully', async () => {
      // Arrange: Setup existing resource
      const existingResource = createTestResource({
        external_id: resourceId,
        created_by: userId
      });

      // Mock the resource exists check in updateResource
      prismaMock.resources.findFirst.mockResolvedValueOnce(existingResource);
      prismaMock.resources.update.mockResolvedValue(existingResource);

      // Mock the internal getResourceById database calls
      prismaMock.resources.findFirst.mockResolvedValueOnce(existingResource);
      prismaMock.$queryRaw.mockResolvedValueOnce([]);
      prismaMock.resource_review.aggregate.mockResolvedValueOnce({
        _avg: { score_impact: null, score_mindset: null, score_problems: null, score_perspectives: null, score_goals: null },
        _count: { id: 0 },
        _sum: {}, _min: {}, _max: {}
      } as any);

      // Act: Execute the service method
      const result = await resourceService.updateResource(resourceId, updateData, userId);

      // Assert: Verify update operations
      expect(prismaMock.resources.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1, // Using the mocked internal ID
          deleted_at: null
        }
      });

      expect(prismaMock.resources.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          name: updateData.name,
          description: updateData.description
        })
      });

      expect(mockTagService.setEntityTags).toHaveBeenCalledWith(
        'resource',
        existingResource.id,
        updateData.tags,
        userId,
        prismaMock // The transaction object is the mocked prisma instance
      );

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundError when resource not found', async () => {
      // Arrange: External ID not found in id-converter
      mockIdConverter.externalToInternalId.mockRejectedValue(new NotFoundError('resource 不存在: resource-uuid'));

      // Act & Assert: Verify error is thrown
      await expect(resourceService.updateResource(resourceId, updateData, userId))
        .rejects
        .toThrow('resource 不存在: resource-uuid');
    });

    it('should throw ForbiddenError when user lacks permission', async () => {
      // Arrange: Resource owned by different user
      const existingResource = createTestResource({
        external_id: resourceId,
        created_by: 999 // Different user ID
      });

      // Mock the resource exists check to return resource with different owner
      prismaMock.resources.findFirst.mockResolvedValue(existingResource);

      // Act & Assert: Verify permission error
      await expect(resourceService.updateResource(resourceId, updateData, userId))
        .rejects
        .toThrow('無權限修改此資源');
    });

    it('should handle update without tags', async () => {
      // Arrange: Update data without tags
      const updateDataWithoutTags = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      const existingResource = createTestResource({
        external_id: resourceId,
        created_by: userId
      });

      // Mock the resource exists check in updateResource
      prismaMock.resources.findFirst.mockResolvedValueOnce(existingResource);
      prismaMock.resources.update.mockResolvedValue(existingResource);

      // Mock the internal getResourceById database calls
      prismaMock.resources.findFirst.mockResolvedValueOnce(existingResource);
      prismaMock.$queryRaw.mockResolvedValueOnce([]);
      prismaMock.resource_review.aggregate.mockResolvedValueOnce({
        _avg: { score_impact: null, score_mindset: null, score_problems: null, score_perspectives: null, score_goals: null },
        _count: { id: 0 },
        _sum: {}, _min: {}, _max: {}
      } as any);

      // Act: Execute the service method
      await resourceService.updateResource(resourceId, updateDataWithoutTags, userId);

      // Assert: Verify tags are not updated
      expect(mockTagService.setEntityTags).not.toHaveBeenCalled();
    });

    it('回應是交易提交後的新資料，不是改名前的舊名稱（daodao#375）', async () => {
      const existingResource = createTestResource({ external_id: resourceId, created_by: userId, name: '舊名稱' });
      let committed = false;
      prismaMock.$transaction.mockImplementation((async (fn: any) => {
        const result = await fn(prismaMock);
        committed = true;
        return result;
      }) as any);
      prismaMock.resources.findFirst.mockResolvedValueOnce(existingResource);
      prismaMock.resources.update.mockResolvedValue(existingResource);
      // getResourceById 讀到的內容取決於交易是否已提交
      prismaMock.resources.findFirst.mockImplementationOnce((async () =>
        ({ ...existingResource, name: committed ? '新名稱' : '舊名稱' })) as any);
      prismaMock.$queryRaw.mockResolvedValueOnce([]);
      prismaMock.resource_review.aggregate.mockResolvedValueOnce({
        _avg: { score_impact: null, score_mindset: null, score_problems: null, score_perspectives: null, score_goals: null },
        _count: { id: 0 },
        _sum: {}, _min: {}, _max: {}
      } as any);
      mockResponseHelper.createSuccessResponse.mockImplementation((data) => ({ success: true, data }));

      const result = await resourceService.updateResource(resourceId, { name: '新名稱' }, userId);

      expect(result.data?.name).toBe('新名稱');
    });
  });

  describe('deleteResource', () => {
    const resourceId = 'resource-uuid';
    const userId = 1;

    it('should soft delete resource successfully', async () => {
      // Arrange: Setup existing resource
      const existingResource = createTestResource({
        external_id: resourceId,
        created_by: userId
      });

      prismaMock.resources.findFirst.mockResolvedValue(existingResource);
      prismaMock.resources.update.mockResolvedValue(existingResource);

      // Act: Execute the service method
      const result = await resourceService.deleteResource(resourceId, userId);

      // Assert: Verify soft delete operation
      expect(prismaMock.resources.findFirst).toHaveBeenCalledWith({
        where: {
          external_id: resourceId,
          deleted_at: null
        }
      });

      expect(prismaMock.resources.update).toHaveBeenCalledWith({
        where: {
          external_id: resourceId,
          deleted_at: null
        },
        data: {
          deleted_at: expect.any(Date)
        }
      });

      expect(result.success).toBe(true);
    });

    it('一併軟刪實踐上指向這筆資源的關聯，實踐詳情不再列出（daodao#375）', async () => {
      const existingResource = createTestResource({ external_id: resourceId, created_by: userId });
      prismaMock.resources.findFirst.mockResolvedValue(existingResource);
      prismaMock.resources.update.mockResolvedValue(existingResource);
      prismaMock.entity_resources.updateMany.mockResolvedValue({ count: 1 } as any);

      await resourceService.deleteResource(resourceId, userId);

      expect(prismaMock.entity_resources.updateMany).toHaveBeenCalledWith({
        where: { resource_id: existingResource.id, entity_type: 'practice', deleted_at: null },
        data: { deleted_at: expect.any(Date) }
      });
    });

    it('should throw NotFoundError when resource not found', async () => {
      // Arrange: Resource doesn't exist
      prismaMock.resources.findFirst.mockResolvedValue(null);

      // Act & Assert: Verify error is thrown
      await expect(resourceService.deleteResource(resourceId, userId))
        .rejects
        .toThrow('資源不存在');
    });

    it('should throw ForbiddenError when user lacks permission', async () => {
      // Arrange: Resource owned by different user
      const existingResource = createTestResource({
        external_id: resourceId,
        created_by: 999 // Different user ID
      });

      prismaMock.resources.findFirst.mockResolvedValue(existingResource);

      // Act & Assert: Verify permission error
      await expect(resourceService.deleteResource(resourceId, userId))
        .rejects
        .toThrow('無權限刪除此資源');
    });
  });

  describe('getResourceStats', () => {
    it('should return global resource statistics', async () => {
      // Arrange: Setup statistics data
      const mockTypeStats = [
        { type: 'books_articles', _count: { type: 5 } },
        { type: 'video_content', _count: { type: 3 } },
        { type: 'workshops_courses', _count: { type: 2 } }
      ] as any;

      const mockCategoryStats = [
        { major_category_id: 1, _count: { major_category_id: 4 } },
        { major_category_id: 2, _count: { major_category_id: 6 } }
      ] as any;

      const mockCategories = [
        { id: 1, name: 'Programming', description: null, created_at: new Date(), updated_at: new Date(), parent_id: null },
        { id: 2, name: 'Design', description: null, created_at: new Date(), updated_at: new Date(), parent_id: null }
      ];

      prismaMock.resources.count
        .mockResolvedValueOnce(10) // totalCount
        .mockResolvedValueOnce(8); // activeCount

      prismaMock.resources.groupBy
        .mockResolvedValueOnce(mockTypeStats)
        .mockResolvedValueOnce(mockCategoryStats);

      prismaMock.categories.findMany.mockResolvedValue(mockCategories);

      // Act: Execute the service method
      const result = await resourceService.getResourceStats();

      // Assert: Verify statistics queries
      expect(prismaMock.resources.count).toHaveBeenCalledTimes(2);
      expect(prismaMock.resources.groupBy).toHaveBeenCalledTimes(2);
      expect(prismaMock.categories.findMany).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should return user-specific resource statistics', async () => {
      // Arrange: Setup user-specific data
      const userId = 1;
      const mockTypeStats = [
        { type: 'books_articles', _count: { type: 3 } },
        { type: 'video_content', _count: { type: 2 } }
      ] as any;

      const mockCategoryStats = [
        { major_category_id: 1, _count: { major_category_id: 2 } }
      ] as any;

      const mockCategories = [
        { id: 1, name: 'Programming', description: null, created_at: new Date(), updated_at: new Date(), parent_id: null }
      ];

      prismaMock.resources.count
        .mockResolvedValueOnce(5) // totalCount
        .mockResolvedValueOnce(4); // activeCount

      prismaMock.resources.groupBy
        .mockResolvedValueOnce(mockTypeStats)
        .mockResolvedValueOnce(mockCategoryStats);

      prismaMock.categories.findMany.mockResolvedValue(mockCategories);

      // Act: Execute the service method
      const result = await resourceService.getResourceStats(userId);

      // Assert: Verify user-filtered queries
      expect(prismaMock.resources.count).toHaveBeenNthCalledWith(1, {
        where: { created_by: userId }
      });
      expect(prismaMock.resources.count).toHaveBeenNthCalledWith(2, {
        where: { deleted_at: null, created_by: userId, status: 'active' }
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Business logic validation', () => {
    describe('data formatting', () => {
      it('should handle null values with sensible defaults', async () => {
        // Arrange: Resource with null optional fields
        const resourceWithNulls = {
          ...createTestResourceWithRelations({
            image_url: null,
            video_url: null,
            categories_resources_major_category_idTocategories: null,
            categories_resources_sub_category_idTocategories: null
          }),
          users: null
        };
        
        prismaMock.resources.findFirst.mockResolvedValue(resourceWithNulls);
        prismaMock.$queryRaw.mockResolvedValue([]);
        prismaMock.resource_review.aggregate.mockResolvedValue({
          _avg: { score_impact: null, score_mindset: null, score_problems: null, score_perspectives: null, score_goals: null },
          _count: { id: 0 },
          _sum: {},
          _min: {},
          _max: {}
        });

        // Act: Execute the service method
        await resourceService.getResourceById('resource-uuid');

        // Assert: Verify transform service is called with the resource data
        expect(mockTransformService.transformResourceToApi).toHaveBeenCalledWith(
          expect.objectContaining({
            image_url: null,
            video_url: null,
            categories_resources_major_category_idTocategories: null,
            categories_resources_sub_category_idTocategories: null,
            users: null
          })
        );
      });
    });

    describe('pagination boundaries', () => {
      it('should enforce maximum page limit', async () => {
        // Arrange: Request with excessive limit
        const excessiveLimit = 1000;
        prismaMock.resources.findMany.mockResolvedValue([]);
        prismaMock.$queryRaw.mockResolvedValue([]);
        prismaMock.resource_review.groupBy.mockResolvedValue([]);

        // Act: Execute the service method
        await resourceService.getResources({}, { limit: excessiveLimit });

        // Assert: Verify limit is capped
        expect(prismaMock.resources.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 21 // MAX_RESOURCE_PAGE_LIMIT + 1
          })
        );
      });
    });

    describe('search query handling', () => {
      it('should handle special characters in search query', async () => {
        // Arrange: Search query with special characters
        const specialQuery = "test'query\"with<special>chars&symbols";
        prismaMock.resources.findMany.mockResolvedValue([]);
        prismaMock.$queryRaw.mockResolvedValue([]);
        prismaMock.resource_review.groupBy.mockResolvedValue([]);

        // Act: Execute the service method
        await resourceService.getResources({ query: specialQuery }, {});

        // Assert: Verify special characters are handled properly
        expect(prismaMock.resources.findMany).toHaveBeenCalledWith(
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

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange: Database error
      const dbError = new Error('Database connection failed');
      prismaMock.resources.findFirst.mockRejectedValue(dbError);

      // Act & Assert: Verify error is propagated
      await expect(resourceService.getResourceById('test-id'))
        .rejects
        .toThrow(dbError);
    });

    it('should handle transaction rollback on create failure', async () => {
      // Arrange: Transaction failure
      const transactionError = new Error('Transaction failed');
      prismaMock.$transaction.mockRejectedValue(transactionError);

      // Act & Assert: Verify transaction error is propagated
      await expect(resourceService.createResource({
        name: 'Test',
        url: 'https://example.com',
        description: 'Test',
        type: 'books_articles',
        cost: 'free',
        level: 'beginner'
      }, 1)).rejects.toThrow(transactionError);
    });
  });
});