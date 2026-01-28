/**
 * Tag Suggest Service Unit Tests
 * Tests tag suggestion/autocomplete logic in isolation
 *
 * Focus: suggestTags scoring algorithm, match type classification
 * Mocks: Database (Prisma)
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

// Mock Redis (not used in suggestTags but imported by the module)
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

import { suggestTags, suggestTagsApi } from '@/services/tag.service';

describe('Tag Suggest Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data factory
  const createTestTag = (overrides = {}) => ({
    id: 1,
    name: 'JavaScript',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides
  });

  describe('suggestTags', () => {
    describe('Match type classification', () => {
      it('should classify exact match correctly', async () => {
        // Arrange
        const tags = [createTestTag({ id: 1, name: 'react' })];
        const usageCounts = [{ tag_id: 1, _count: { tag_id: 10 } }];

        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue(usageCounts as any);

        // Act
        const result = await suggestTags('react');

        // Assert
        expect(result[0].matchType).toBe('exact');
      });

      it('should classify prefix match correctly', async () => {
        // Arrange
        const tags = [createTestTag({ id: 1, name: 'react-native' })];
        const usageCounts = [{ tag_id: 1, _count: { tag_id: 10 } }];

        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue(usageCounts as any);

        // Act
        const result = await suggestTags('react');

        // Assert
        expect(result[0].matchType).toBe('prefix');
      });

      it('should classify contains match correctly', async () => {
        // Arrange
        const tags = [createTestTag({ id: 1, name: 'vue-react-bridge' })];
        const usageCounts = [{ tag_id: 1, _count: { tag_id: 10 } }];

        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue(usageCounts as any);

        // Act
        const result = await suggestTags('react');

        // Assert
        expect(result[0].matchType).toBe('contains');
      });
    });

    describe('Scoring algorithm', () => {
      it('should prioritize exact match over prefix match', async () => {
        // Arrange
        const tags = [
          createTestTag({ id: 1, name: 'react-native' }), // prefix
          createTestTag({ id: 2, name: 'react' }) // exact
        ];
        const usageCounts = [
          { tag_id: 1, _count: { tag_id: 100 } }, // high usage
          { tag_id: 2, _count: { tag_id: 10 } } // low usage
        ];

        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue(usageCounts as any);

        // Act
        const result = await suggestTags('react');

        // Assert - exact match should come first despite lower usage
        expect(result[0].name).toBe('react');
        expect(result[0].matchType).toBe('exact');
        expect(result[1].name).toBe('react-native');
        expect(result[1].matchType).toBe('prefix');
      });

      it('should prioritize prefix match over contains match', async () => {
        // Arrange
        const tags = [
          createTestTag({ id: 1, name: 'use-react-hooks' }), // contains
          createTestTag({ id: 2, name: 'react-query' }) // prefix
        ];
        const usageCounts = [
          { tag_id: 1, _count: { tag_id: 100 } }, // high usage
          { tag_id: 2, _count: { tag_id: 10 } } // low usage
        ];

        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue(usageCounts as any);

        // Act
        const result = await suggestTags('react');

        // Assert - prefix should come first
        expect(result[0].name).toBe('react-query');
        expect(result[0].matchType).toBe('prefix');
        expect(result[1].name).toBe('use-react-hooks');
        expect(result[1].matchType).toBe('contains');
      });

      it('should consider usage count within same match type', async () => {
        // Arrange
        const tags = [
          createTestTag({ id: 1, name: 'react-native' }), // prefix, low usage
          createTestTag({ id: 2, name: 'react-query' }) // prefix, high usage
        ];
        const usageCounts = [
          { tag_id: 1, _count: { tag_id: 5 } },
          { tag_id: 2, _count: { tag_id: 100 } }
        ];

        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue(usageCounts as any);

        // Act
        const result = await suggestTags('react');

        // Assert - higher usage should come first for same match type
        expect(result[0].name).toBe('react-query');
        expect(result[0].count).toBe(100);
        expect(result[1].name).toBe('react-native');
        expect(result[1].count).toBe(5);
      });

      it('should handle tags with zero usage count', async () => {
        // Arrange
        const tags = [createTestTag({ id: 1, name: 'react' })];
        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue([]); // no usage

        // Act
        const result = await suggestTags('react');

        // Assert
        expect(result[0].count).toBe(0);
        expect(result[0].matchType).toBe('exact');
      });
    });

    describe('Case insensitivity', () => {
      it('should match regardless of case', async () => {
        // Arrange
        const tags = [createTestTag({ id: 1, name: 'JavaScript' })];
        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue([]);

        // Act
        const result = await suggestTags('javascript');

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('JavaScript');
      });

      it('should classify exact match case-insensitively', async () => {
        // Arrange
        const tags = [createTestTag({ id: 1, name: 'REACT' })];
        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue([]);

        // Act
        const result = await suggestTags('react');

        // Assert
        expect(result[0].matchType).toBe('exact');
      });
    });

    describe('Edge cases', () => {
      it('should return empty array for empty query', async () => {
        // Act
        const result = await suggestTags('');

        // Assert
        expect(result).toEqual([]);
        expect(prismaMock.tags.findMany).not.toHaveBeenCalled();
      });

      it('should return empty array for whitespace-only query', async () => {
        // Act
        const result = await suggestTags('   ');

        // Assert
        expect(result).toEqual([]);
      });

      it('should trim query before searching', async () => {
        // Arrange
        const tags = [createTestTag({ id: 1, name: 'react' })];
        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue([]);

        // Act
        await suggestTags('  react  ');

        // Assert
        expect(prismaMock.tags.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              name: {
                contains: 'react',
                mode: 'insensitive'
              }
            }
          })
        );
      });

      it('should return empty array when no tags match', async () => {
        // Arrange
        prismaMock.tags.findMany.mockResolvedValue([]);

        // Act
        const result = await suggestTags('nonexistent');

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('Limit parameter', () => {
      it('should respect limit parameter', async () => {
        // Arrange
        const tags = Array.from({ length: 20 }, (_, i) =>
          createTestTag({ id: i + 1, name: `react-tag-${i}` })
        );
        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue([]);

        // Act
        const result = await suggestTags('react', 5);

        // Assert
        expect(result).toHaveLength(5);
      });

      it('should use default limit of 10', async () => {
        // Arrange
        const tags = Array.from({ length: 20 }, (_, i) =>
          createTestTag({ id: i + 1, name: `react-tag-${i}` })
        );
        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue([]);

        // Act
        const result = await suggestTags('react');

        // Assert
        expect(result).toHaveLength(10);
      });

      it('should query more tags than limit for better sorting', async () => {
        // Arrange
        prismaMock.tags.findMany.mockResolvedValue([]);
        prismaMock.entity_tags.groupBy.mockResolvedValue([]);

        // Act
        await suggestTags('react', 10);

        // Assert - should take limit * 3 for better sorting
        expect(prismaMock.tags.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 30
          })
        );
      });
    });

    describe('Chinese character support', () => {
      it('should handle Chinese characters in search', async () => {
        // Arrange
        const tags = [createTestTag({ id: 1, name: '前端開發' })];
        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue([]);

        // Act
        const result = await suggestTags('前端');

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('前端開發');
        expect(result[0].matchType).toBe('prefix');
      });

      it('should handle mixed Chinese and English', async () => {
        // Arrange
        const tags = [createTestTag({ id: 1, name: 'Vue前端框架' })];
        prismaMock.tags.findMany.mockResolvedValue(tags);
        prismaMock.entity_tags.groupBy.mockResolvedValue([]);

        // Act
        const result = await suggestTags('Vue');

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].matchType).toBe('prefix');
      });
    });
  });

  describe('suggestTagsApi', () => {
    it('should return API response format', async () => {
      // Arrange
      const tags = [createTestTag({ id: 1, name: 'react' })];
      prismaMock.tags.findMany.mockResolvedValue(tags);
      prismaMock.entity_tags.groupBy.mockResolvedValue([]);

      // Act
      const result = await suggestTagsApi('react', 10);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockResponseHelper.createSuccessResponse).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          searchQuery: 'react',
          filters: { limit: 10 }
        })
      );
    });

    it('should handle errors and throw', async () => {
      // Arrange
      prismaMock.tags.findMany.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(suggestTagsApi('react')).rejects.toThrow();
    });
  });
});
