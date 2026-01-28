/**
 * Tag Service Unit Tests
 * Tests tag service core business logic in isolation
 *
 * Focus: Tag CRUD operations, entity tag management
 * Mocks: Database (Prisma), Redis cache, logger
 */

// Create standalone Prisma mock (avoids dependency on generated types)
const prismaMock = {
  tags: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn()
  },
  entity_tags: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn()
  },
  $transaction: jest.fn()
};

// Setup transaction mock
const setupTransactionMock = () => {
  prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
    if (typeof fn === 'function') {
      return (fn as (tx: typeof prismaMock) => Promise<unknown>)(prismaMock);
    }
    return Promise.all(fn as Promise<unknown>[]);
  });
};

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn()
};

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock response helper
const mockResponseHelper = {
  createSuccessResponse: jest.fn((data, meta) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    meta
  }))
};

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/database/redis.service', () => ({
  redis: mockRedis
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: mockLogger
}));

jest.mock('@/utils/response-helper', () => mockResponseHelper);

import {
  createTag,
  getTagById,
  getTagByName,
  getAllTags,
  addEntityTag,
  setEntityTags,
  getEntityTags,
  removeEntityTag,
  getPopularTags,
  cleanupUnusedTags
} from '@/services/tag.service';

describe('Tag Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockResolvedValue('OK');
  });

  // Test data factories
  const createTestTag = (overrides = {}) => ({
    id: 1,
    name: 'JavaScript',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides
  });

  const createTestEntityTag = (overrides = {}) => ({
    id: 1,
    entity_type: 'resource',
    entity_id: 100,
    tag_id: 1,
    created_by: 1,
    created_at: new Date('2024-01-01'),
    ...overrides
  });

  describe('createTag', () => {
    it('should create a new tag when it does not exist', async () => {
      // Arrange
      const tagName = 'React';
      prismaMock.tags.findUnique.mockResolvedValue(null);
      prismaMock.tags.create.mockResolvedValue(createTestTag({ id: 2, name: tagName }));

      // Act
      const result = await createTag(tagName);

      // Assert
      expect(prismaMock.tags.findUnique).toHaveBeenCalledWith({
        where: { name: tagName }
      });
      expect(prismaMock.tags.create).toHaveBeenCalledWith({
        data: { name: tagName }
      });
      expect(result.name).toBe(tagName);
    });

    it('should return existing tag when it already exists', async () => {
      // Arrange
      const existingTag = createTestTag({ name: 'JavaScript' });
      prismaMock.tags.findUnique.mockResolvedValue(existingTag);

      // Act
      const result = await createTag('JavaScript');

      // Assert
      expect(prismaMock.tags.findUnique).toHaveBeenCalledWith({
        where: { name: 'JavaScript' }
      });
      expect(prismaMock.tags.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingTag);
    });

    it('should use transaction when provided', async () => {
      // Arrange
      const tagName = 'TypeScript';
      prismaMock.tags.findUnique.mockResolvedValue(null);
      prismaMock.tags.create.mockResolvedValue(createTestTag({ name: tagName }));

      // Act
      await createTag(tagName, prismaMock);

      // Assert
      expect(prismaMock.tags.findUnique).toHaveBeenCalled();
      expect(prismaMock.tags.create).toHaveBeenCalled();
    });
  });

  describe('getTagById', () => {
    it('should return tag when found', async () => {
      // Arrange
      const testTag = createTestTag();
      prismaMock.tags.findUnique.mockResolvedValue(testTag);

      // Act
      const result = await getTagById(1);

      // Assert
      expect(prismaMock.tags.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(result).toEqual(testTag);
    });

    it('should return null when tag not found', async () => {
      // Arrange
      prismaMock.tags.findUnique.mockResolvedValue(null);

      // Act
      const result = await getTagById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getTagByName', () => {
    it('should return tag when found by name', async () => {
      // Arrange
      const testTag = createTestTag({ name: 'Vue' });
      prismaMock.tags.findUnique.mockResolvedValue(testTag);

      // Act
      const result = await getTagByName('Vue');

      // Assert
      expect(prismaMock.tags.findUnique).toHaveBeenCalledWith({
        where: { name: 'Vue' }
      });
      expect(result).toEqual(testTag);
    });

    it('should return null when tag name not found', async () => {
      // Arrange
      prismaMock.tags.findUnique.mockResolvedValue(null);

      // Act
      const result = await getTagByName('NonExistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllTags', () => {
    it('should return all tags sorted by name', async () => {
      // Arrange
      const testTags = [
        createTestTag({ id: 1, name: 'Angular' }),
        createTestTag({ id: 2, name: 'React' }),
        createTestTag({ id: 3, name: 'Vue' })
      ];
      prismaMock.tags.findMany.mockResolvedValue(testTags);

      // Act
      const result = await getAllTags();

      // Assert
      expect(prismaMock.tags.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        take: undefined,
        skip: undefined
      });
      expect(result).toHaveLength(3);
    });

    it('should apply limit and offset', async () => {
      // Arrange
      prismaMock.tags.findMany.mockResolvedValue([createTestTag()]);

      // Act
      await getAllTags(10, 5);

      // Assert
      expect(prismaMock.tags.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        take: 10,
        skip: 5
      });
    });
  });

  describe('addEntityTag', () => {
    it('should add new tag to entity and return true', async () => {
      // Arrange
      const testTag = createTestTag({ id: 1, name: 'React' });
      prismaMock.tags.findUnique.mockResolvedValue(testTag);
      prismaMock.entity_tags.findFirst.mockResolvedValue(null);
      prismaMock.entity_tags.create.mockResolvedValue(createTestEntityTag());

      // Act
      const result = await addEntityTag('resource', 100, 'React', 1);

      // Assert
      expect(prismaMock.entity_tags.findFirst).toHaveBeenCalledWith({
        where: {
          entity_type: 'resource',
          entity_id: 100,
          tag_id: 1
        }
      });
      expect(prismaMock.entity_tags.create).toHaveBeenCalledWith({
        data: {
          entity_type: 'resource',
          entity_id: 100,
          tag_id: 1,
          created_by: 1
        }
      });
      expect(result).toBe(true);
    });

    it('should return false when tag already exists on entity', async () => {
      // Arrange
      const testTag = createTestTag({ id: 1, name: 'React' });
      const existingEntityTag = createTestEntityTag();
      prismaMock.tags.findUnique.mockResolvedValue(testTag);
      prismaMock.entity_tags.findFirst.mockResolvedValue(existingEntityTag);

      // Act
      const result = await addEntityTag('resource', 100, 'React', 1);

      // Assert
      expect(prismaMock.entity_tags.create).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should create tag if it does not exist', async () => {
      // Arrange
      const newTag = createTestTag({ id: 5, name: 'NewTag' });
      prismaMock.tags.findUnique.mockResolvedValue(null);
      prismaMock.tags.create.mockResolvedValue(newTag);
      prismaMock.entity_tags.findFirst.mockResolvedValue(null);
      prismaMock.entity_tags.create.mockResolvedValue(createTestEntityTag({ tag_id: 5 }));

      // Act
      const result = await addEntityTag('resource', 100, 'NewTag', 1);

      // Assert
      expect(prismaMock.tags.create).toHaveBeenCalledWith({
        data: { name: 'NewTag' }
      });
      expect(result).toBe(true);
    });

    it('should trim whitespace from tag name', async () => {
      // Arrange
      const testTag = createTestTag({ id: 1, name: 'React' });
      prismaMock.tags.findUnique.mockResolvedValue(testTag);
      prismaMock.entity_tags.findFirst.mockResolvedValue(null);
      prismaMock.entity_tags.create.mockResolvedValue(createTestEntityTag());

      // Act
      await addEntityTag('resource', 100, '  React  ', 1);

      // Assert
      expect(prismaMock.tags.findUnique).toHaveBeenCalledWith({
        where: { name: 'React' }
      });
    });
  });

  describe('setEntityTags', () => {
    it('should replace all tags for an entity', async () => {
      // Arrange
      const tags = [
        createTestTag({ id: 1, name: 'React' }),
        createTestTag({ id: 2, name: 'TypeScript' })
      ];
      prismaMock.entity_tags.deleteMany.mockResolvedValue({ count: 2 });
      prismaMock.tags.findUnique
        .mockResolvedValueOnce(tags[0])
        .mockResolvedValueOnce(tags[1]);
      prismaMock.entity_tags.create.mockResolvedValue(createTestEntityTag());

      // Act
      await setEntityTags('resource', 100, ['React', 'TypeScript'], 1);

      // Assert
      expect(prismaMock.entity_tags.deleteMany).toHaveBeenCalledWith({
        where: {
          entity_type: 'resource',
          entity_id: 100
        }
      });
      expect(prismaMock.entity_tags.create).toHaveBeenCalledTimes(2);
    });

    it('should handle empty tag list', async () => {
      // Arrange
      prismaMock.entity_tags.deleteMany.mockResolvedValue({ count: 0 });

      // Act
      await setEntityTags('resource', 100, [], 1);

      // Assert
      expect(prismaMock.entity_tags.deleteMany).toHaveBeenCalled();
      expect(prismaMock.entity_tags.create).not.toHaveBeenCalled();
    });
  });

  describe('getEntityTags', () => {
    it('should return tags for an entity', async () => {
      // Arrange
      const entityTags = [
        { ...createTestEntityTag(), tags: createTestTag({ id: 1, name: 'React' }) },
        { ...createTestEntityTag({ id: 2 }), tags: createTestTag({ id: 2, name: 'Vue' }) }
      ];
      prismaMock.entity_tags.findMany.mockResolvedValue(entityTags);

      // Act
      const result = await getEntityTags('resource', 100);

      // Assert
      expect(prismaMock.entity_tags.findMany).toHaveBeenCalledWith({
        where: {
          entity_type: 'resource',
          entity_id: 100
        },
        include: {
          tags: true
        },
        orderBy: {
          tags: {
            name: 'asc'
          }
        }
      });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('React');
      expect(result[1].name).toBe('Vue');
    });

    it('should return empty array when entity has no tags', async () => {
      // Arrange
      prismaMock.entity_tags.findMany.mockResolvedValue([]);

      // Act
      const result = await getEntityTags('resource', 999);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('removeEntityTag', () => {
    it('should remove tag from entity', async () => {
      // Arrange
      prismaMock.entity_tags.deleteMany.mockResolvedValue({ count: 1 });

      // Act
      await removeEntityTag('resource', 100, 1);

      // Assert
      expect(prismaMock.entity_tags.deleteMany).toHaveBeenCalledWith({
        where: {
          entity_type: 'resource',
          entity_id: 100,
          tag_id: 1
        }
      });
    });

    it('should not throw when tag does not exist', async () => {
      // Arrange
      prismaMock.entity_tags.deleteMany.mockResolvedValue({ count: 0 });

      // Act & Assert
      await expect(removeEntityTag('resource', 100, 999)).resolves.not.toThrow();
    });
  });

  describe('getPopularTags', () => {
    it('should return popular tags sorted by usage count', async () => {
      // Arrange
      const tagUsage = [
        { tag_id: 1, _count: { tag_id: 100 } },
        { tag_id: 2, _count: { tag_id: 50 } }
      ];
      const tagsData = [
        createTestTag({ id: 1, name: 'React' }),
        createTestTag({ id: 2, name: 'Vue' })
      ];

      mockRedis.get.mockResolvedValue(null);
      prismaMock.entity_tags.groupBy.mockResolvedValue(tagUsage as any);
      prismaMock.tags.findMany.mockResolvedValue(tagsData);

      // Act
      const result = await getPopularTags(10);

      // Assert
      expect(prismaMock.entity_tags.groupBy).toHaveBeenCalledWith({
        by: ['tag_id'],
        where: {},
        _count: { tag_id: true },
        orderBy: { _count: { tag_id: 'desc' } },
        take: 10
      });
      expect(result).toHaveLength(2);
      expect(result[0].usageCount).toBe(100);
      expect(result[1].usageCount).toBe(50);
    });

    it('should filter by entityType', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null);
      prismaMock.entity_tags.groupBy.mockResolvedValue([]);
      prismaMock.tags.findMany.mockResolvedValue([]);

      // Act
      await getPopularTags(10, 'resource');

      // Assert
      expect(prismaMock.entity_tags.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entity_type: 'resource' }
        })
      );
    });

    it('should filter by timeRange', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null);
      prismaMock.entity_tags.groupBy.mockResolvedValue([]);
      prismaMock.tags.findMany.mockResolvedValue([]);

      // Act
      await getPopularTags(10, undefined, '7d');

      // Assert
      expect(prismaMock.entity_tags.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: expect.objectContaining({
              gte: expect.any(Date)
            })
          })
        })
      );
    });

    it('should return cached result if available', async () => {
      // Arrange
      const cachedResult = [
        { tag: createTestTag({ id: 1, name: 'React' }), usageCount: 100 }
      ];
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedResult));

      // Act
      const result = await getPopularTags(10);

      // Assert
      expect(prismaMock.entity_tags.groupBy).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should cache the result', async () => {
      // Arrange
      const tagUsage = [{ tag_id: 1, _count: { tag_id: 50 } }];
      const tagsData = [createTestTag({ id: 1, name: 'React' })];

      mockRedis.get.mockResolvedValue(null);
      prismaMock.entity_tags.groupBy.mockResolvedValue(tagUsage as any);
      prismaMock.tags.findMany.mockResolvedValue(tagsData);

      // Act
      await getPopularTags(10);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('tags:popular:'),
        300, // 5 minutes TTL
        expect.any(String)
      );
    });

    it('should return empty array when no tags exist', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null);
      prismaMock.entity_tags.groupBy.mockResolvedValue([]);

      // Act
      const result = await getPopularTags(10);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('cleanupUnusedTags', () => {
    it('should delete tags with no entity associations', async () => {
      // Arrange
      const unusedTags = [
        createTestTag({ id: 10, name: 'Unused1' }),
        createTestTag({ id: 11, name: 'Unused2' })
      ];
      prismaMock.tags.findMany.mockResolvedValue(unusedTags);
      prismaMock.tags.deleteMany.mockResolvedValue({ count: 2 });

      // Act
      const result = await cleanupUnusedTags();

      // Assert
      expect(prismaMock.tags.findMany).toHaveBeenCalledWith({
        where: {
          entity_tags: {
            none: {}
          }
        }
      });
      expect(prismaMock.tags.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: [10, 11] }
        }
      });
      expect(result).toBe(2);
    });

    it('should return 0 when no unused tags exist', async () => {
      // Arrange
      prismaMock.tags.findMany.mockResolvedValue([]);

      // Act
      const result = await cleanupUnusedTags();

      // Assert
      expect(prismaMock.tags.deleteMany).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should propagate database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      prismaMock.tags.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(getTagById(1)).rejects.toThrow('Database connection failed');
    });

    it('should handle Redis errors gracefully in getPopularTags', async () => {
      // Arrange
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      prismaMock.entity_tags.groupBy.mockResolvedValue([]);

      // Act
      const result = await getPopularTags(10);

      // Assert - should fall back to database query
      expect(prismaMock.entity_tags.groupBy).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
