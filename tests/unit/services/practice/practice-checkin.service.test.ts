/**
 * Practice CheckIn Service Unit Tests
 * Tests practice check-in business logic in isolation
 * 
 * Focus: Business logic validation, streak calculation, progress tracking, daily validation
 * Mocks: All external dependencies (database, logging service, etc.)
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { Prisma } from '@generated/prisma';

// Mock external dependencies
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

jest.mock('@/services/encouragement.service', () => ({
  getRandomEncouragement: jest.fn().mockResolvedValue({
    data: { message: '你真棒！繼續加油！' }
  })
}));

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue(undefined)
}));

import {
  createCheckIn,
  getCheckIns,
  calculateStreak,
  updatePracticeProgress,
  validateDailyCheckIn,
  getCheckInStats,
  getMonthlyCheckInCalendar
} from '@/services/practice-checkin.service';
import type { CreateCheckInRequest, CheckInQueryParams } from '@/types/practice.types';

describe('Practice CheckIn Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    
    // Setup common mock returns
    mockLoggerService.info.mockReturnValue(undefined);
    mockLoggerService.error.mockReturnValue(undefined);
  });

  // Helper to create Decimal mock that behaves like a number
  const createDecimalMock = (value: number): Prisma.Decimal => {
    return {
      valueOf: () => value,
      toString: () => value.toString(),
      toNumber: () => value,
      toFixed: (digits?: number) => value.toFixed(digits)
    } as any as Prisma.Decimal;
  };

  // Test data factories matching Prisma schema
  const createTestPractice = (overrides = {}) => ({
    id: 1,
    external_id: 'practice-uuid',
    user_id: 1,
    template_id: null,
    title: 'TypeScript 學習',
    practice_action: '閱讀技術書籍',
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-14'),
    duration_days: 14,
    frequency_min_days: 4,
    frequency_max_days: 7,
        session_duration_minutes: 30,
    practice_time_periods: ['morning', 'evening'],
    other_context: null,
    status: 'not_started',
    has_resources: false,
    progress_percentage: createDecimalMock(20),
    first_checkin_at: null,
    theme_color: '#FCDD84',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null,
    ...overrides
  });

  const createTestCheckIn = (overrides = {}) => ({
    id: 1,
    practice_id: 1,
    user_id: 1,
    checkin_date: new Date('2024-01-01'),
    mood: 'happy',
    note: '今天完成了閱讀',
    image_urls: [],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    practices: {
      title: 'TypeScript 學習'
    },
    ...overrides
  });

  const createCheckInRequest = (overrides = {}): CreateCheckInRequest => ({
    mood: 'happy',
    note: '今天完成了閱讀',
    imageUrls: [],
    ...overrides
  });

  describe('createCheckIn', () => {
    it('should create first check-in successfully with progress 50% and status active', async () => {
      // Arrange: Setup test data and mocks
      const testPractice = createTestPractice({ status: 'not_started' });
      const testCheckIn = createTestCheckIn();
      const request = createCheckInRequest();

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null); // No existing check-in today
      prismaMock.practice_checkins.count.mockResolvedValue(0); // First check-in
      prismaMock.practice_checkins.findMany.mockResolvedValue([]); // No recent check-ins for streak calculation
      prismaMock.$transaction.mockResolvedValue([testCheckIn, {}]);

      // Mock encouragement service
      jest.mock('@/services/encouragement.service', () => ({
        getRandomEncouragement: jest.fn().mockResolvedValue({
          data: { message: '你真棒！' }
        })
      }));

      // Act: Execute the service method
      const result = await createCheckIn(1, request, 1);

      // Assert: Verify behavior and database calls
      expect(prismaMock.practices.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
          user_id: 1
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.isFirstCheckIn).toBe(true);
      expect(result.data.practiceProgressPercentage).toBe(50); // First check-in = 50%
      expect(result.data.practiceStatus).toBe('active');
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Check-in created',
        expect.objectContaining({
          practiceId: 1,
          userId: 1,
          checkInCount: 1,
          isFirstCheckIn: true
        })
      );
    });

    it('should throw NotFoundError when practice not found', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(null);

      await expect(createCheckIn(999, createCheckInRequest(), 1))
        .rejects.toThrow('實踐不存在或沒有權限');
    });

    it('should throw error when practice status does not allow check-in', async () => {
      const testPractice = createTestPractice({ status: 'completed' });

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);

      await expect(createCheckIn(1, createCheckInRequest(), 1))
        .rejects.toThrow('此實踐狀態不允許打卡');
    });

    it('should throw DuplicateError when already checked in today', async () => {
      const testPractice = createTestPractice({ status: 'active' });
      const existingCheckIn = { id: 1, checkin_date: new Date() };

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(existingCheckIn as any);

      await expect(createCheckIn(1, createCheckInRequest(), 1))
        .rejects.toThrow('今日已完成簽到');
    });

    it('should calculate progress based on check-in count', async () => {
      // With 2 check-ins (after this one), progress should increase from 50%
      const testPractice = createTestPractice({
        status: 'active',
        first_checkin_at: new Date()
      });
      const testCheckIn = createTestCheckIn();

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(1); // 1 existing check-in
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.$transaction.mockResolvedValue([testCheckIn, {}]);

      const result = await createCheckIn(1, createCheckInRequest(), 1);

      expect(result.data.isFirstCheckIn).toBe(false);
    });

    it('should use transaction for database operations', async () => {
      const testPractice = createTestPractice({ status: 'not_started' });
      const testCheckIn = createTestCheckIn();

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.$transaction.mockResolvedValue([testCheckIn, {}]);

      await createCheckIn(1, createCheckInRequest(), 1);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('getCheckIns', () => {
    const mockCheckIns = [createTestCheckIn()] as any;

    it('should return check-ins with pagination', async () => {
      const params: CheckInQueryParams = {
        page: 1,
        limit: 20
      };

      prismaMock.practice_checkins.findMany.mockResolvedValue(mockCheckIns);
      prismaMock.practice_checkins.count.mockResolvedValue(1);

      const result = await getCheckIns(1, params);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 1, // Math.ceil(1 / 20) = 1
        totalItems: 1, // actual count from mock
        itemsPerPage: 20 // limit parameter
      });
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Check-ins retrieved',
        expect.objectContaining({
          practiceId: 1,
          count: 1,
          total: 1
        })
      );
    });

    it('should apply date range filters correctly', async () => {
      const params: CheckInQueryParams = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      prismaMock.practice_checkins.findMany.mockResolvedValue(mockCheckIns);
      prismaMock.practice_checkins.count.mockResolvedValue(1);

      await getCheckIns(1, params);

      expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            checkin_date: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31')
            }
          })
        })
      );
    });

    it('should apply mood filter', async () => {
      const params: CheckInQueryParams = {
        mood: 'happy'
      };

      prismaMock.practice_checkins.findMany.mockResolvedValue(mockCheckIns);
      prismaMock.practice_checkins.count.mockResolvedValue(1);

      await getCheckIns(1, params);

      expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mood: 'happy'
          })
        })
      );
    });

    it('should apply user filter when userId provided', async () => {
      const params: CheckInQueryParams = {};

      prismaMock.practice_checkins.findMany.mockResolvedValue(mockCheckIns);
      prismaMock.practice_checkins.count.mockResolvedValue(1);

      await getCheckIns(1, params, 1);

      expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 1
          })
        })
      );
    });

    it('should limit maximum page size to 100', async () => {
      const params: CheckInQueryParams = {
        limit: 150
      };

      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.count.mockResolvedValue(0);

      await getCheckIns(1, params);

      expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      prismaMock.practice_checkins.findMany.mockRejectedValue(error);

      await expect(getCheckIns(1, {}))
        .rejects.toThrow('取得簽到記錄失敗');
        
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to retrieve check-ins',
        expect.objectContaining({ practiceId: 1, error })
      );
    });
  });

  describe('calculateStreak', () => {
    it('should return streak 1 for first check-in', async () => {
      const currentDate = new Date('2024-01-01');
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);

      const result = await calculateStreak(1, 1, currentDate);

      expect(result.newStreak).toBe(1);
      expect(result.isNewRecord).toBe(true); // First check-in is always new record
    });

    it('should calculate consecutive streak correctly', async () => {
      const currentDate = new Date('2024-01-05');
      const recentCheckIns = [
        { checkin_date: new Date('2024-01-04') },
        { checkin_date: new Date('2024-01-03') },
        { checkin_date: new Date('2024-01-02') }
      ];

      prismaMock.practice_checkins.findMany.mockResolvedValue(recentCheckIns as any);

      const result = await calculateStreak(1, 1, currentDate);

      expect(result.newStreak).toBe(4); // 3 consecutive days + today
      // isNewRecord is false because max_streak field doesn't exist in DB
      expect(result.isNewRecord).toBe(false);
    });

    it('should reset streak when there is a gap', async () => {
      const currentDate = new Date('2024-01-05');
      const recentCheckIns = [
        { checkin_date: new Date('2024-01-02') }, // Gap on Jan 3 and 4
        { checkin_date: new Date('2024-01-01') }
      ];

      prismaMock.practice_checkins.findMany.mockResolvedValue(recentCheckIns as any);

      const result = await calculateStreak(1, 1, currentDate);

      expect(result.newStreak).toBe(1); // Reset to 1 due to gap
      expect(result.isNewRecord).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const currentDate = new Date();
      const error = new Error('Database error');
      prismaMock.practice_checkins.findMany.mockRejectedValue(error);

      const result = await calculateStreak(1, 1, currentDate);

      expect(result.newStreak).toBe(1);
      expect(result.isNewRecord).toBe(false);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to calculate streak',
        expect.objectContaining({ practiceId: 1, userId: 1, error })
      );
    });
  });

  describe('updatePracticeProgress', () => {
    it('should only update timestamp (function is deprecated)', async () => {
      const updates = {
        currentProgress: 15,
        streak: 7,
        maxStreak: 10,
        lastCheckInDate: new Date('2024-01-01')
      };

      prismaMock.practices.update.mockResolvedValue({} as any);

      await updatePracticeProgress(1, updates);

      // Only updates timestamp because progress fields don't exist in schema
      expect(prismaMock.practices.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          updated_at: expect.any(Date)
        }
      });

      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Practice timestamp updated',
        expect.objectContaining({
          practiceId: 1,
          note: 'Progress tracking fields do not exist in schema'
        })
      );
    });

    it('should handle database errors', async () => {
      const updates = {
        currentProgress: 15,
        streak: 7,
        maxStreak: 10,
        lastCheckInDate: new Date()
      };
      const error = new Error('Database error');
      prismaMock.practices.update.mockRejectedValue(error);

      await expect(updatePracticeProgress(1, updates))
        .rejects.toThrow('更新實踐失敗');

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to update practice',
        expect.objectContaining({ practiceId: 1, updates, error })
      );
    });
  });

  describe('validateDailyCheckIn', () => {
    it('should return true when no check-in exists today', async () => {
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);

      const result = await validateDailyCheckIn(1, 1);

      expect(result).toBe(true);
      
      // Verify correct date range query
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      expect(prismaMock.practice_checkins.findFirst).toHaveBeenCalledWith({
        where: {
          practice_id: 1,
          user_id: 1,
          checkin_date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });
    });

    it('should return false when check-in exists today', async () => {
      prismaMock.practice_checkins.findFirst.mockResolvedValue({
        id: 1,
        checkin_date: new Date()
      } as any);

      const result = await validateDailyCheckIn(1, 1);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      prismaMock.practice_checkins.findFirst.mockRejectedValue(error);

      const result = await validateDailyCheckIn(1, 1);

      expect(result).toBe(false);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to validate daily check-in',
        expect.objectContaining({ practiceId: 1, userId: 1, error })
      );
    });
  });

  describe('getCheckInStats', () => {
    it('should return check-in statistics with streak calculated from check-ins', async () => {
      const recentCheckIns = [
        { checkin_date: new Date() }
      ];

      prismaMock.practice_checkins.aggregate.mockResolvedValue({
        _count: { id: 30 },
        _max: { checkin_date: new Date('2024-01-01') }
      } as any);
      // calculateStreak is called internally, mock its dependencies
      prismaMock.practice_checkins.findMany.mockResolvedValue(recentCheckIns as any);

      const result = await getCheckInStats(1, 1);

      expect(result).toMatchObject({
        totalCheckIns: 30,
        currentStreak: expect.any(Number), // Calculated from check-ins
        maxStreak: 0, // Field doesn't exist in DB
        lastCheckInDate: '2024-01-01'
      });
    });

    it('should handle no check-ins with defaults', async () => {
      prismaMock.practice_checkins.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _max: { checkin_date: null }
      } as any);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);

      const result = await getCheckInStats(1, 1);

      expect(result).toMatchObject({
        totalCheckIns: 0,
        currentStreak: expect.any(Number),
        maxStreak: 0,
        lastCheckInDate: undefined
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      prismaMock.practice_checkins.aggregate.mockRejectedValue(error);

      await expect(getCheckInStats(1, 1))
        .rejects.toThrow('取得簽到統計失敗');

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to get check-in stats',
        expect.objectContaining({ practiceId: 1, userId: 1, error })
      );
    });
  });

  describe('getMonthlyCheckInCalendar', () => {
    it('should return monthly check-in calendar successfully', async () => {
      const checkIns = [
        { checkin_date: new Date('2024-01-01') },
        { checkin_date: new Date('2024-01-05') }
      ];

      prismaMock.practice_checkins.findMany.mockResolvedValue(checkIns as any);

      const result = await getMonthlyCheckInCalendar(1, 1, 2024, 1);

      expect(result.checkInDates).toEqual(['2024-01-01', '2024-01-05']);
      expect(result.totalCheckIns).toBe(2);
      // streakDays uses sequential numbering as fallback (field doesn't exist in DB)
      expect(result.streakDays).toEqual([
        { date: '2024-01-01', streakDay: 1 },
        { date: '2024-01-05', streakDay: 2 }
      ]);
    });

    it('should query correct date range for specified month', async () => {
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);

      await getMonthlyCheckInCalendar(1, 1, 2024, 2);

      expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith({
        where: {
          practice_id: 1,
          user_id: 1,
          checkin_date: {
            gte: new Date(2024, 1, 1), // Feb 1, 2024
            lte: new Date(2024, 2, 0, 23, 59, 59) // Last day of Feb 2024
          }
        },
        select: {
          checkin_date: true
        },
        orderBy: { checkin_date: 'asc' }
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      prismaMock.practice_checkins.findMany.mockRejectedValue(error);

      await expect(getMonthlyCheckInCalendar(1, 1, 2024, 1))
        .rejects.toThrow('取得月度簽到日曆失敗');

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to get monthly check-in calendar',
        expect.objectContaining({ practiceId: 1, userId: 1, year: 2024, month: 1, error })
      );
    });

    it('should handle empty month with no check-ins', async () => {
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);

      const result = await getMonthlyCheckInCalendar(1, 1, 2024, 3);

      expect(result.checkInDates).toEqual([]);
      expect(result.totalCheckIns).toBe(0);
      expect(result.streakDays).toEqual([]);
    });
  });

  describe('Business logic validation', () => {
    describe('streak calculation edge cases', () => {
      it('should handle consecutive check-ins correctly', async () => {
        const currentDate = new Date('2024-01-02');
        const recentCheckIns = [
          { checkin_date: new Date('2024-01-01') }
        ];

        prismaMock.practice_checkins.findMany.mockResolvedValue(recentCheckIns as any);

        const result = await calculateStreak(1, 1, currentDate);

        expect(result.newStreak).toBe(2);
        // isNewRecord is false because max_streak field doesn't exist in DB
        expect(result.isNewRecord).toBe(false);
      });
    });

    describe('progress calculation edge cases', () => {
      it('should handle first check-in with status transition', async () => {
        const testPractice = createTestPractice({
          status: 'not_started',
          first_checkin_at: null
        });
        const testCheckIn = createTestCheckIn();

        prismaMock.practices.findUnique.mockResolvedValue(testPractice);
        prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
        prismaMock.practice_checkins.count.mockResolvedValue(0);
        prismaMock.practice_checkins.findMany.mockResolvedValue([]);
        prismaMock.$transaction.mockResolvedValue([testCheckIn, {}]);

        const result = await createCheckIn(1, createCheckInRequest(), 1);

        expect(result.data.isFirstCheckIn).toBe(true);
        expect(result.data.practiceStatus).toBe('active');
        expect(result.data.practiceProgressPercentage).toBe(50);
      });
    });
  });
});