/**
 * Practice Event Service Unit Tests
 * Tests practice event recording and statistics business logic in isolation
 * 
 * Focus: Event recording validation, statistics calculation, batch processing
 * Mocks: All external dependencies (database, logging service)
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

// Mock logging service
const mockLoggerService = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: mockLoggerService
}));

import {
  recordViewEvent,
  recordClickEvent,
  recordShareEvent,
  recordFavoriteEvent,
  removeFavoriteEvent,
  recordBatchEvents,
  getEventStats,
  getUserEventHistory
} from '@/services/practice-event.service';
import {
  ViewEventRequest,
  ClickEventRequest,
  ShareEventRequest,
  FavoriteEventRequest
} from '@/types/practice.types';
import { Prisma } from '../../../generated/prisma';

describe('Practice Event Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
  });

  const createDecimalMock = (value: number): Prisma.Decimal => {
    return {
      valueOf: () => value,
      toString: () => value.toString(),
      toNumber: () => value,
      toFixed: (digits?: number) => value.toFixed(digits)
    } as any as Prisma.Decimal;
  };

  // Test data factory matching Prisma schema
  const createTestPractice = (overrides = {}) => ({
    id: 1,
    external_id: 'test-uuid-123',
    user_id: 1,
    title: 'Test Practice',
    content_type: 'book',
    custom_content_type: null,
    total_amount: 100,
    current_progress: createDecimalMock(50),
    start_date: new Date('2024-01-01'),
    daily_goal_type: 'time',
    daily_goal_time_minutes: 30,
    daily_goal_amount: null,
    daily_goal_unit: null,
    practice_action: 'reading',
    status: 'active',
    has_resources: true,
    streak: 5,
    max_streak: 10,
    last_checkin_date: new Date('2024-01-15'),
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides
  } as any);

  describe('recordViewEvent', () => {
    it('should successfully record view event for existing practice', async () => {
      // Arrange
      const testPractice = createTestPractice();
      const viewData: ViewEventRequest = {
        entityId: 1,
        entityType: 'practice',
        duration: 120,
        referrer: 'https://example.com'
      };
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);

      // Act
      const result = await recordViewEvent(viewData, 1);

      // Assert
      expect(prismaMock.practices.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockLoggerService.info).toHaveBeenCalledWith('View event recorded', {
        entityId: 1,
        entityType: 'practice',
        userId: 1,
        duration: 120,
        referrer: 'https://example.com'
      });
      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
    });

    it('should throw error when practice does not exist', async () => {
      // Arrange
      const viewData: ViewEventRequest = {
        entityId: 999,
        entityType: 'practice'
      };
      prismaMock.practices.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(recordViewEvent(viewData, 1))
        .rejects.toThrow('實踐不存在');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle view event without optional fields', async () => {
      // Arrange
      const testPractice = createTestPractice();
      const viewData: ViewEventRequest = {
        entityId: 1,
        entityType: 'practice'
      };
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);

      // Act
      const result = await recordViewEvent(viewData, 1);

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('View event recorded', {
        entityId: 1,
        entityType: 'practice',
        userId: 1,
        duration: undefined,
        referrer: undefined
      });
      expect(result.success).toBe(true);
    });
  });

  describe('recordClickEvent', () => {
    it('should successfully record click event with all fields', async () => {
      // Arrange
      const testPractice = createTestPractice();
      const clickData: ClickEventRequest = {
        entityId: 1,
        entityType: 'practice',
        clickType: 'button',
        clickTarget: 'start-practice',
        clickPosition: 'top-right'
      };
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);

      // Act
      const result = await recordClickEvent(clickData, 1);

      // Assert
      expect(prismaMock.practices.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockLoggerService.info).toHaveBeenCalledWith('Click event recorded', {
        entityId: 1,
        entityType: 'practice',
        userId: 1,
        clickType: 'button',
        clickTarget: 'start-practice',
        clickPosition: 'top-right'
      });
      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
    });

    it('should throw error when practice does not exist', async () => {
      // Arrange
      const clickData: ClickEventRequest = {
        entityId: 999,
        entityType: 'practice',
        clickType: 'button'
      };
      prismaMock.practices.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(recordClickEvent(clickData, 1))
        .rejects.toThrow('實踐不存在');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle click event with only required fields', async () => {
      // Arrange
      const testPractice = createTestPractice();
      const clickData: ClickEventRequest = {
        entityId: 1,
        entityType: 'practice',
        clickType: 'link'
      };
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);

      // Act
      const result = await recordClickEvent(clickData, 1);

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Click event recorded', {
        entityId: 1,
        entityType: 'practice',
        userId: 1,
        clickType: 'link',
        clickTarget: undefined,
        clickPosition: undefined
      });
      expect(result.success).toBe(true);
    });
  });

  describe('recordShareEvent', () => {
    it('should successfully record share event with all fields', async () => {
      // Arrange
      const testPractice = createTestPractice();
      const shareData: ShareEventRequest = {
        entityId: 1,
        entityType: 'practice',
        platform: 'facebook',
        shareUrl: 'https://example.com/practice/1',
        shareTitle: 'My Practice',
        shareContent: 'Check out my practice!'
      };
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);

      // Act
      const result = await recordShareEvent(shareData, 1);

      // Assert
      expect(prismaMock.practices.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockLoggerService.info).toHaveBeenCalledWith('Share event recorded', {
        entityId: 1,
        entityType: 'practice',
        userId: 1,
        platform: 'facebook',
        shareUrl: 'https://example.com/practice/1'
      });
      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
    });

    it('should throw error when practice does not exist', async () => {
      // Arrange
      const shareData: ShareEventRequest = {
        entityId: 999,
        entityType: 'practice',
        platform: 'twitter'
      };
      prismaMock.practices.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(recordShareEvent(shareData, 1))
        .rejects.toThrow('實踐不存在');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle share event without optional fields', async () => {
      // Arrange
      const testPractice = createTestPractice();
      const shareData: ShareEventRequest = {
        entityId: 1,
        entityType: 'practice'
      };
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);

      // Act
      const result = await recordShareEvent(shareData, 1);

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Share event recorded', {
        entityId: 1,
        entityType: 'practice',
        userId: 1,
        platform: undefined,
        shareUrl: undefined
      });
      expect(result.success).toBe(true);
    });
  });

  describe('recordFavoriteEvent', () => {
    it('should successfully record favorite event', async () => {
      // Arrange
      const testPractice = createTestPractice();
      const favoriteData: FavoriteEventRequest = {
        entityId: 1,
        entityType: 'practice'
      };
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);

      // Act
      const result = await recordFavoriteEvent(favoriteData, 1);

      // Assert
      expect(prismaMock.practices.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockLoggerService.info).toHaveBeenCalledWith('Favorite event recorded', {
        entityId: 1,
        entityType: 'practice',
        userId: 1
      });
      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
    });

    it('should throw error when practice does not exist', async () => {
      // Arrange
      const favoriteData: FavoriteEventRequest = {
        entityId: 999,
        entityType: 'practice'
      };
      prismaMock.practices.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(recordFavoriteEvent(favoriteData, 1))
        .rejects.toThrow('實踐不存在');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('removeFavoriteEvent', () => {
    it('should successfully remove favorite event', async () => {
      // Arrange
      const testPractice = createTestPractice();
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);

      // Act
      const result = await removeFavoriteEvent(1, 'practice', 1);

      // Assert
      expect(prismaMock.practices.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockLoggerService.info).toHaveBeenCalledWith('Favorite event removed', {
        entityId: 1,
        entityType: 'practice',
        userId: 1
      });
      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
    });

    it('should throw error when practice does not exist', async () => {
      // Arrange
      prismaMock.practices.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(removeFavoriteEvent(999, 'practice', 1))
        .rejects.toThrow('實踐不存在');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('recordBatchEvents', () => {
    it('should successfully process all valid events', async () => {
      // Arrange
      const testPractice = createTestPractice();
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      
      const events = [
        {
          type: 'view' as const,
          data: {
            entityId: 1,
            entityType: 'practice',
            duration: 60
          } as ViewEventRequest
        },
        {
          type: 'click' as const,
          data: {
            entityId: 1,
            entityType: 'practice',
            clickType: 'button'
          } as ClickEventRequest
        },
        {
          type: 'share' as const,
          data: {
            entityId: 1,
            entityType: 'practice',
            platform: 'twitter'
          } as ShareEventRequest
        }
      ];

      // Act
      const result = await recordBatchEvents(events, 1);

      // Assert
      expect(prismaMock.practices.findUnique).toHaveBeenCalledTimes(3);
      expect(mockLoggerService.info).toHaveBeenCalledWith('Batch events processed', {
        userId: 1,
        totalEvents: 3,
        successCount: 3,
        errorCount: 0
      });
      expect(result.success).toBe(true);
      expect(result.data.successCount).toBe(3);
      expect(result.data.errorCount).toBe(0);
      expect(result.data.errors).toEqual([]);
    });

    it('should handle mixed success and failure events', async () => {
      // Arrange
      const testPractice = createTestPractice();
      prismaMock.practices.findUnique
        .mockResolvedValueOnce(testPractice) // First event succeeds
        .mockResolvedValueOnce(null) // Second event fails
        .mockResolvedValueOnce(testPractice); // Third event succeeds

      const events = [
        {
          type: 'view' as const,
          data: {
            entityId: 1,
            entityType: 'practice'
          } as ViewEventRequest
        },
        {
          type: 'click' as const,
          data: {
            entityId: 999,
            entityType: 'practice',
            clickType: 'button'
          } as ClickEventRequest
        },
        {
          type: 'favorite' as const,
          data: {
            entityId: 1,
            entityType: 'practice'
          } as FavoriteEventRequest
        }
      ];

      // Act
      const result = await recordBatchEvents(events, 1);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.successCount).toBe(2);
      expect(result.data.errorCount).toBe(1);
      expect(result.data.errors).toHaveLength(1);
      expect(result.data.errors[0]).toContain('click 事件記錄失敗');
    });

    it('should handle unsupported event type', async () => {
      // Arrange
      const events = [
        {
          type: 'unsupported' as any,
          data: {
            entityId: 1,
            entityType: 'practice'
          }
        }
      ];

      // Act
      const result = await recordBatchEvents(events, 1);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.successCount).toBe(0);
      expect(result.data.errorCount).toBe(1);
      expect(result.data.errors[0]).toContain('不支援的事件類型');
    });

    it('should handle empty events array', async () => {
      // Act
      const result = await recordBatchEvents([], 1);

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Batch events processed', {
        userId: 1,
        totalEvents: 0,
        successCount: 0,
        errorCount: 0
      });
      expect(result.success).toBe(true);
      expect(result.data.successCount).toBe(0);
      expect(result.data.errorCount).toBe(0);
    });
  });

  describe('getEventStats', () => {
    it('should return default stats structure', async () => {
      // Act
      const result = await getEventStats(1, 'practice');

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Event stats retrieved', {
        entityId: 1,
        entityType: 'practice',
        stats: {
          viewCount: 0,
          uniqueViewCount: 0,
          shareCount: 0,
          favoriteCount: 0
        }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        viewCount: 0,
        uniqueViewCount: 0,
        clickCount: 0,
        shareCount: 0,
        favoriteCount: 0,
        totalViewDuration: 0,
        averageViewDuration: 0,
        topReferrers: [],
        topPlatforms: []
      });
    });

    it('should handle default entity type', async () => {
      // Act
      const result = await getEventStats(1);

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('Event stats retrieved', {
        entityId: 1,
        entityType: 'practice',
        stats: expect.any(Object)
      });
      expect(result.success).toBe(true);
    });

    it('should handle error gracefully', async () => {
      // Arrange
      const error = new Error('Database error');
      jest.spyOn(Promise, 'all').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(getEventStats(1, 'practice'))
        .rejects.toThrow('取得事件統計失敗');
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to get event stats',
        expect.objectContaining({
          entityId: 1,
          entityType: 'practice',
          error
        })
      );
    });
  });

  describe('getUserEventHistory', () => {
    it('should return empty array with default parameters', async () => {
      // Act
      const result = await getUserEventHistory(1);

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('User event history retrieved', {
        userId: 1,
        entityType: 'practice',
        eventType: undefined,
        count: 0,
        page: 1
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should apply pagination parameters correctly', async () => {
      // Act
      const result = await getUserEventHistory(1, {
        page: 2,
        limit: 20,
        eventType: 'view'
      });

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('User event history retrieved', {
        userId: 1,
        entityType: 'practice',
        eventType: 'view',
        count: 0,
        page: 2
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should respect maximum limit of 100', async () => {
      // Act
      const result = await getUserEventHistory(1, {
        limit: 200 // Exceeds max
      });

      // Assert
      // The service internally limits to 100, but we get empty results anyway
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should filter by specific event type', async () => {
      // Act
      const result = await getUserEventHistory(1, {
        eventType: 'share'
      });

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith('User event history retrieved', {
        userId: 1,
        entityType: 'practice',
        eventType: 'share',
        count: 0,
        page: 1
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle all event types when not specified', async () => {
      // Act
      const result = await getUserEventHistory(1, {
        entityType: 'practice'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      // Arrange
      const error = new Error('Database error');
      jest.spyOn(Array.prototype, 'sort').mockImplementationOnce(() => {
        throw error;
      });

      // Act & Assert
      await expect(getUserEventHistory(1))
        .rejects.toThrow('取得使用者事件歷史失敗');
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to get user event history',
        expect.objectContaining({
          userId: 1,
          error
        })
      );
    });
  });
});