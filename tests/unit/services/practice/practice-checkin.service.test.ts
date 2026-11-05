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

const mockCreateEvent = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: {
    createEvent: (...args: unknown[]) => mockCreateEvent(...args),
  },
}));

const mockFanoutToPracticeFollowers = jest.fn().mockResolvedValue(undefined);
const mockFanoutToConnectedPartners = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/social-notification-fanout.service', () => ({
  fanoutToPracticeFollowers: (...args: unknown[]) => mockFanoutToPracticeFollowers(...args),
  fanoutToConnectedPartners: (...args: unknown[]) => mockFanoutToConnectedPartners(...args),
}));

// Mock R2 service for image upload tests
const mockUploadToR2 = jest.fn().mockResolvedValue(undefined);
const mockDeleteFromR2 = jest.fn().mockResolvedValue(undefined);

jest.mock('@/services/r2.service', () => ({
  uploadToR2: (...args: unknown[]) => mockUploadToR2(...args),
  deleteFromR2: (...args: unknown[]) => mockDeleteFromR2(...args)
}));

import {
  createCheckIn,
  createCheckInWithImages,
  deleteCheckIn,
  getCheckIns,
  calculateStreak,
  updatePracticeProgress,
  validateDailyCheckIn,
  getCheckInStats,
  getMonthlyCheckInCalendar
} from '@/services/practice-checkin.service';
import type { CreateCheckInRequest, CreateCheckInWithFilesRequest, CheckInQueryParams } from '@/types/practice.types';

describe('Practice CheckIn Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    
    // Setup common mock returns
    mockLoggerService.info.mockReturnValue(undefined);
    mockLoggerService.error.mockReturnValue(undefined);
    mockCreateEvent.mockResolvedValue(undefined);
    mockFanoutToPracticeFollowers.mockResolvedValue(undefined);
    mockFanoutToConnectedPartners.mockResolvedValue(undefined);
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
  // 使用未來日期以避免小時制到期判定
  const futureStart = new Date();
  futureStart.setUTCHours(0, 0, 0, 0);
  const futureEnd = new Date(futureStart.getTime() + 13 * 24 * 60 * 60 * 1000); // +13 days

  const createTestPractice = (overrides = {}) => ({
    id: 1,
    external_id: 'practice-uuid',
    user_id: 1,
    template_id: null,
    cohort_id: null,
    cohort_resources_initialized_at: null,
    title: 'TypeScript 學習',
    practice_action: '閱讀技術書籍',
    start_date: futureStart,
    end_date: futureEnd,
    duration_days: 14,
    frequency_min_days: 4,
    frequency_max_days: 7,
    session_duration_minutes: 30,
    practice_time_periods: ['morning', 'evening'],
    other_context: null,
    status: 'not_started',
    privacy_status: 'private',
    visibility: 'public',
    has_resources: false,
    progress_percentage: createDecimalMock(20),
    first_checkin_at: null,
    theme_color: '#FCDD84',
    reflection: null,
    insight: null,
    source_practice_id: null,
    copy_count: 0,
    creation_source: null,
    is_featured: false,
    featured_start_at: null,
    featured_end_at: null,
    next_intent: null,
    next_intent_draft_id: null,
    selected_checkin_ids: [],
    insight_feedback: null,
    created_at: new Date(),
    updated_at: new Date(),
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
    og_image_url: null,
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
      prismaMock.practice_checkins.count.mockResolvedValue(0); // First check-in (used in transaction)
      prismaMock.practice_checkins.findMany.mockResolvedValue([]); // No recent check-ins for streak calculation
      prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn); // Created check-in
      prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'active' }); // Updated practice
      // Fire-and-forget: createCheckIn calls prisma.follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([] as any);
      // Note: setupTransactionMock() handles interactive transaction by passing prismaMock as tx

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

    // daodao#277：提早打卡位移後，結束日 = 今天 + 天數 − 1（與範本庫、梯次指派同一規則）
    it('shifts end_date to today + durationDays - 1 on early first check-in', async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const start = new Date(today.getTime() + 3 * 86_400_000);
      const testPractice = createTestPractice({
        status: 'not_started',
        start_date: start,
        end_date: new Date(start.getTime() + 6 * 86_400_000),
        duration_days: 7
      });
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(createTestCheckIn());
      prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'active' });
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      await createCheckIn(1, createCheckInRequest(), 1);

      const data = prismaMock.practices.update.mock.calls[0][0].data as { start_date: Date; end_date: Date };
      expect(data.start_date.toISOString()).toBe(today.toISOString());
      expect(data.end_date.getTime() - today.getTime()).toBe(6 * 86_400_000);
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

    it('should calculate progress based on check-in count', async () => {
      // With 2 check-ins (after this one), progress should increase from 50%
      const testPractice = createTestPractice({
        status: 'active',
        first_checkin_at: new Date()
      });
      const testCheckIn = createTestCheckIn();

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(1); // 1 existing check-in (used in transaction)
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn);
      prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'active' });
      // Fire-and-forget: createCheckIn calls prisma.follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([] as any);
      // Note: setupTransactionMock() handles interactive transaction by passing prismaMock as tx

      const result = await createCheckIn(1, createCheckInRequest(), 1);

      expect(result.data.isFirstCheckIn).toBe(false);
    });

    // daodao#295：共同挑戰期間 > 90 天時 duration_days 留 null（CHECK 1–90），進度不可退回 14 天計算
    it('uses the inclusive start/end span for progress when duration_days is null (100-day challenge)', async () => {
      const start = new Date(futureStart);
      const end = new Date(start.getTime() + 99 * 24 * 60 * 60 * 1000); // 含頭尾 100 天
      const testPractice = createTestPractice({
        status: 'active',
        first_checkin_at: new Date(),
        start_date: start,
        end_date: end,
        duration_days: null,
        frequency_min_days: 7,
        frequency_max_days: 7
      });

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(55); // 本次為第 56 次
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(createTestCheckIn());
      prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'active' });
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      const result = await createCheckIn(1, createCheckInRequest(), 1);

      // 最低目標 = ceil(100 / 7 × 7) = 100；50% + 55 × 50 / 99 = 77.78%（用 14 天會變成 261.54%）
      expect(result.data.practiceProgressPercentage).toBe(77.78);
    });

    // daodao#372：progress_percentage 是 DECIMAL(5,2)，第 19 次（7 天／每週 1 次）算出 1000% 會溢位 → 500
    it('caps written progress at 999 on the 19th check-in of a 7-day, once-a-week practice', async () => {
      const testPractice = createTestPractice({
        status: 'active',
        first_checkin_at: new Date(),
        end_date: new Date(futureStart.getTime() + 6 * 24 * 60 * 60 * 1000),
        duration_days: 7,
        frequency_min_days: 1,
        frequency_max_days: 1,
        progress_percentage: createDecimalMock(950)
      });

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(18); // 本次為第 19 次
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(createTestCheckIn());
      prismaMock.practices.update.mockResolvedValue({ ...testPractice });
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      const result = await createCheckIn(1, createCheckInRequest(), 1);

      const written = prismaMock.practices.update.mock.calls[0][0].data as { progress_percentage: number };
      expect(written.progress_percentage).toBe(999);
      expect(written.progress_percentage).toBeLessThanOrEqual(999.99);
      expect(result.data.practiceProgressPercentage).toBe(999);
    });

    it('should use transaction for database operations', async () => {
      const testPractice = createTestPractice({ status: 'not_started' });
      const testCheckIn = createTestCheckIn();

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn);
      prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'active' });
      // Fire-and-forget: createCheckIn calls prisma.follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([] as any);
      // Note: setupTransactionMock() handles interactive transaction by passing prismaMock as tx

      await createCheckIn(1, createCheckInRequest(), 1);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should fan out check-in notifications to practice followers and connected partners', async () => {
      const testPractice = createTestPractice({ status: 'not_started', privacy_status: 'public' });
      const testCheckIn = createTestCheckIn({ id: 88 });

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn);
      prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'active' });

      await createCheckIn(1, createCheckInRequest(), 1);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockFanoutToPracticeFollowers).toHaveBeenCalledWith(
        'follow.practice_checkin',
        1,
        1,
        expect.objectContaining({
          practiceId: 1,
          checkinId: 88,
          practice_title: 'TypeScript 學習',
          entity_external_id: 'practice-uuid',
        })
      );
      expect(mockFanoutToConnectedPartners).toHaveBeenCalledWith(
        'connect.partner_checkin',
        1,
        expect.objectContaining({
          practiceId: 1,
          checkinId: 88,
        })
      );
    });

    it.each(['private', 'delayed'])(
      'should not fan out check-in notifications for %s practice',
      async (privacyStatus) => {
        const testPractice = createTestPractice({
          status: 'not_started',
          privacy_status: privacyStatus,
        });
        const testCheckIn = createTestCheckIn({ id: 88 });

        prismaMock.practices.findUnique.mockResolvedValue(testPractice);
        prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
        prismaMock.practice_checkins.count.mockResolvedValue(0);
        prismaMock.practice_checkins.findMany.mockResolvedValue([]);
        prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn);
        prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'active' });

        await createCheckIn(1, createCheckInRequest(), 1);
        await Promise.resolve();
        await Promise.resolve();

        expect(mockFanoutToPracticeFollowers).not.toHaveBeenCalled();
        expect(mockFanoutToConnectedPartners).not.toHaveBeenCalled();
      }
    );

    it('should notify practice followers when public practice becomes completed', async () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const testPractice = createTestPractice({
        status: 'active',
        privacy_status: 'public',
        end_date: yesterday,
      });
      const testCheckIn = createTestCheckIn({ id: 88 });

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(1);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn);
      prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'completed' });
      prismaMock.follows.findMany.mockResolvedValue([{ follower_id: 2 }] as any);

      await createCheckIn(1, createCheckInRequest(), 1);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PracticeFinished',
          actorId: 1,
          recipientId: 2,
          entityType: 'practice',
          entityId: 1,
          priority: 'P2',
        })
      );
    });

    it.each(['private', 'delayed'])(
      'should not notify practice followers when %s practice becomes completed',
      async (privacyStatus) => {
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const testPractice = createTestPractice({
          status: 'active',
          privacy_status: privacyStatus,
          end_date: yesterday,
        });
        const testCheckIn = createTestCheckIn({ id: 88 });

        prismaMock.practices.findUnique.mockResolvedValue(testPractice);
        prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
        prismaMock.practice_checkins.count.mockResolvedValue(1);
        prismaMock.practice_checkins.findMany.mockResolvedValue([]);
        prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn);
        prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'completed' });

        await createCheckIn(1, createCheckInRequest(), 1);
        await Promise.resolve();
        await Promise.resolve();

        expect(mockCreateEvent).not.toHaveBeenCalledWith(
          expect.objectContaining({ type: 'PracticeFinished' })
        );
      }
    );
  });

  describe('getCheckIns', () => {
    const mockCheckIns = [createTestCheckIn()] as any;

    // 每個測試需要 mock practices.findUnique，否則 getCheckIns 會因找不到實踐而拋出 NotFoundError
    const mockActivePractice = {
      id: 1,
      user_id: 99,
      status: 'active',
      deleted_at: null,
    };

    it('should return check-ins with pagination', async () => {
      const params: CheckInQueryParams = {
        page: 1,
        limit: 20
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockActivePractice as any);
      prismaMock.practice_checkins.findMany.mockResolvedValue(mockCheckIns);
      prismaMock.practice_checkins.count.mockResolvedValue(1);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.entity_stats.findMany.mockResolvedValue([]);

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

      prismaMock.practices.findUnique.mockResolvedValue(mockActivePractice as any);
      prismaMock.practice_checkins.findMany.mockResolvedValue(mockCheckIns);
      prismaMock.practice_checkins.count.mockResolvedValue(1);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.entity_stats.findMany.mockResolvedValue([]);

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

      prismaMock.practices.findUnique.mockResolvedValue(mockActivePractice as any);
      prismaMock.practice_checkins.findMany.mockResolvedValue(mockCheckIns);
      prismaMock.practice_checkins.count.mockResolvedValue(1);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.entity_stats.findMany.mockResolvedValue([]);

      await getCheckIns(1, params);

      expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mood: 'happy'
          })
        })
      );
    });

    it('should allow owner to view draft practice check-ins', async () => {
      const params: CheckInQueryParams = {};
      const draftPractice = { ...mockActivePractice, status: 'draft', user_id: 1 };

      prismaMock.practices.findUnique.mockResolvedValue(draftPractice as any);
      prismaMock.practice_checkins.findMany.mockResolvedValue(mockCheckIns);
      prismaMock.practice_checkins.count.mockResolvedValue(1);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.entity_stats.findMany.mockResolvedValue([]);

      // 擁有者（requestUserId = 1 = practice.user_id）可以查看草稿打卡
      const result = await getCheckIns(1, params, 1);

      expect(result.success).toBe(true);
    });

    it('should limit maximum page size to 100', async () => {
      const params: CheckInQueryParams = {
        limit: 150
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockActivePractice as any);
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
      prismaMock.practices.findUnique.mockResolvedValue(mockActivePractice as any);
      prismaMock.practice_checkins.findMany.mockRejectedValue(error);

      await expect(getCheckIns(1, {}))
        .rejects.toThrow('取得簽到記錄失敗');
        
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to retrieve check-ins',
        expect.objectContaining({ practiceId: 1, error })
      );
    });

    // Regression daodao#257：catch 不可把已分類的 AppError 改成 500
    describe('access errors keep their HTTP status (daodao#257)', () => {
      it('returns 404 when practice does not exist', async () => {
        prismaMock.practices.findUnique.mockResolvedValue(null);

        await expect(getCheckIns(1, {}, 2)).rejects.toMatchObject({
          statusCode: 404,
          message: '實踐不存在'
        });
      });

      it('returns 404 when practice is soft-deleted', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          ...mockActivePractice,
          deleted_at: new Date('2026-10-22T00:00:00Z')
        } as any);

        await expect(getCheckIns(1, {}, 99)).rejects.toMatchObject({
          statusCode: 404,
          message: '實踐不存在'
        });
      });

      it('returns 403 for non-owner viewing a private practice', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          ...mockActivePractice,
          privacy_status: 'private'
        } as any);

        await expect(getCheckIns(1, {}, 2)).rejects.toMatchObject({
          statusCode: 403,
          message: '此實踐為私人，無法查看打卡紀錄'
        });
      });

      it('returns 403 for anonymous request on a private practice', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          ...mockActivePractice,
          privacy_status: 'private'
        } as any);

        await expect(getCheckIns(1, {})).rejects.toMatchObject({
          statusCode: 403,
          message: '此實踐為私人，無法查看打卡紀錄'
        });
      });

      it('returns 403 for non-owner viewing a draft practice', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          ...mockActivePractice,
          status: 'draft'
        } as any);

        await expect(getCheckIns(1, {}, 2)).rejects.toMatchObject({
          statusCode: 403,
          message: '沒有權限查看此實踐的打卡紀錄'
        });
      });

      it('returns 403 for non-owner viewing an unfinished delayed practice', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          ...mockActivePractice,
          privacy_status: 'delayed'
        } as any);

        await expect(getCheckIns(1, {}, 2)).rejects.toMatchObject({
          statusCode: 403,
          message: '此實踐尚未完成，打卡紀錄暫不公開'
        });
      });

      it('allows owner to view own private practice', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          ...mockActivePractice,
          privacy_status: 'private'
        } as any);
        prismaMock.practice_checkins.findMany.mockResolvedValue(mockCheckIns);
        prismaMock.practice_checkins.count.mockResolvedValue(1);
        prismaMock.entity_tags.findMany.mockResolvedValue([]);
        prismaMock.entity_stats.findMany.mockResolvedValue([]);

        const result = await getCheckIns(1, {}, 99);

        expect(result.success).toBe(true);
      });

      it('still wraps unexpected errors as 500', async () => {
        prismaMock.practices.findUnique.mockResolvedValue(mockActivePractice as any);
        prismaMock.practice_checkins.findMany.mockRejectedValue(new Error('connection reset'));

        await expect(getCheckIns(1, {}, 99)).rejects.toMatchObject({
          statusCode: 500,
          message: '取得簽到記錄失敗'
        });
      });
    });

    it('orders by checkin_date then id so same-day pagination is stable (daodao#372)', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(mockActivePractice as any);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.count.mockResolvedValue(0);

      await getCheckIns(1, { page: 2, limit: 10 });

      expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ checkin_date: 'desc' }, { id: 'desc' }]
        })
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

  describe('deleteCheckIn', () => {
    // daodao#372：刪除打卡後用剩餘次數重算進度並寫回，同樣不可超過 DECIMAL(5,2) 上限
    it('caps recalculated progress at 999 when many check-ins remain', async () => {
      const testPractice = createTestPractice({
        status: 'active',
        duration_days: 7,
        frequency_min_days: 1,
        frequency_max_days: 1,
        progress_percentage: createDecimalMock(999)
      });

      prismaMock.practice_checkins.findFirst.mockResolvedValue(createTestCheckIn({ id: 30 }) as any);
      prismaMock.entity_tags.deleteMany.mockResolvedValue({ count: 0 } as any);
      prismaMock.practice_checkins.delete.mockResolvedValue(createTestCheckIn({ id: 30 }) as any);
      prismaMock.practice_checkins.count.mockResolvedValue(29); // 刪除後剩 29 次（未封頂會算出 1500%）
      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practices.update.mockResolvedValue({ ...testPractice });

      await deleteCheckIn(30, 1, 1);

      const written = prismaMock.practices.update.mock.calls[0][0].data as { progress_percentage: number };
      expect(written.progress_percentage).toBe(999);
    });
  });

  describe('updatePracticeProgress', () => {
    it('should only update timestamp (function is deprecated)', async () => {
      const updates = {
        currentProgress: 15,
        streak: 7,
        maxStreak: 10,
        lastCheckinAt: new Date('2024-01-01')
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
        lastCheckinAt: new Date()
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
    it('should always return true (24-hour limit removed)', async () => {
      const result = await validateDailyCheckIn(1, 1);

      expect(result).toBe(true);
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
        lastCheckinAt: '2024-01-01T00:00:00.000Z'
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
        lastCheckinAt: undefined
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
        prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn);
        prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'active' });
        // Fire-and-forget: createCheckIn calls prisma.follows.findMany().then(...)
        prismaMock.follows.findMany.mockResolvedValue([] as any);
        // Note: setupTransactionMock() handles interactive transaction by passing prismaMock as tx

        const result = await createCheckIn(1, createCheckInRequest(), 1);

        expect(result.data.isFirstCheckIn).toBe(true);
        expect(result.data.practiceStatus).toBe('active');
        expect(result.data.practiceProgressPercentage).toBe(50);
      });
    });
  });

  describe('createCheckInWithImages', () => {
    const createTestFile = (overrides = {}): Express.Multer.File => ({
      fieldname: 'images',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 102400,
      destination: '/tmp',
      filename: 'test-image.jpg',
      path: '/tmp/test-image.jpg',
      buffer: Buffer.from('test image data'),
      stream: {} as any,
      ...overrides
    });

    const createCheckInWithFilesRequest = (overrides = {}): CreateCheckInWithFilesRequest => ({
      mood: 'happy',
      note: '今天完成了閱讀',
      imageFiles: [createTestFile()],
      ...overrides
    });

    beforeEach(() => {
      mockUploadToR2.mockClear();
      mockDeleteFromR2.mockClear();
      // Set environment variables for R2
      process.env.R2_PUBLIC_URL = 'https://cdn.example.com';
    });

    it('should upload images and create check-in successfully', async () => {
      const testPractice = createTestPractice({ status: 'not_started' });
      const testCheckIn = createTestCheckIn();
      const request = createCheckInWithFilesRequest();

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn);
      prismaMock.practices.update.mockResolvedValue({ ...testPractice, status: 'active' });
      // Fire-and-forget: createCheckIn calls prisma.follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      const result = await createCheckInWithImages(1, request, 1);

      expect(result.success).toBe(true);
      expect(mockUploadToR2).toHaveBeenCalledTimes(1);
      expect(mockUploadToR2).toHaveBeenCalledWith(
        expect.objectContaining({ originalname: 'test-image.jpg' }),
        expect.stringMatching(/^checkins\/[a-f0-9-]+\.jpg$/)
      );
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Check-in with images created',
        expect.objectContaining({
          practiceId: 1,
          userId: 1,
          imageCount: 1
        })
      );
    });

    it('should upload multiple images successfully', async () => {
      const testPractice = createTestPractice({ status: 'active' });
      const testCheckIn = createTestCheckIn();
      const request = createCheckInWithFilesRequest({
        imageFiles: [
          createTestFile({ originalname: 'image1.jpg' }),
          createTestFile({ originalname: 'image2.png' }),
          createTestFile({ originalname: 'image3.jpeg' })
        ]
      });

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(1);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn);
      prismaMock.practices.update.mockResolvedValue(testPractice);
      // Fire-and-forget: createCheckIn calls prisma.follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      const result = await createCheckInWithImages(1, request, 1);

      expect(result.success).toBe(true);
      expect(mockUploadToR2).toHaveBeenCalledTimes(3);
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Check-in with images created',
        expect.objectContaining({
          imageCount: 3
        })
      );
    });

    it('should cleanup uploaded images when check-in creation fails', async () => {
      const testPractice = createTestPractice({ status: 'not_started' });
      const request = createCheckInWithFilesRequest({
        imageFiles: [
          createTestFile({ originalname: 'image1.jpg' }),
          createTestFile({ originalname: 'image2.png' })
        ]
      });

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockRejectedValue(new Error('Database error'));

      await expect(createCheckInWithImages(1, request, 1))
        .rejects.toThrow('Database error');

      expect(mockUploadToR2).toHaveBeenCalledTimes(2);
      expect(mockDeleteFromR2).toHaveBeenCalledTimes(2);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to create check-in with images',
        expect.objectContaining({
          practiceId: 1,
          userId: 1
        })
      );
    });

    it('should cleanup uploaded images when R2 upload fails', async () => {
      const request = createCheckInWithFilesRequest({
        imageFiles: [
          createTestFile({ originalname: 'image1.jpg' }),
          createTestFile({ originalname: 'image2.png' })
        ]
      });

      // First upload succeeds, second fails
      mockUploadToR2
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('R2 upload failed'));

      await expect(createCheckInWithImages(1, request, 1))
        .rejects.toThrow('R2 upload failed');

      expect(mockUploadToR2).toHaveBeenCalledTimes(2);
      // Should cleanup the first uploaded image
      expect(mockDeleteFromR2).toHaveBeenCalledTimes(1);
      expect(mockDeleteFromR2).toHaveBeenCalledWith(
        expect.stringMatching(/^checkins\/[a-f0-9-]+\.jpg$/)
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      const testPractice = createTestPractice({ status: 'not_started' });
      const request = createCheckInWithFilesRequest();

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockRejectedValue(new Error('Database error'));
      mockDeleteFromR2.mockRejectedValue(new Error('R2 delete failed'));

      await expect(createCheckInWithImages(1, request, 1))
        .rejects.toThrow('Database error');

      // Cleanup was attempted but failed
      expect(mockDeleteFromR2).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Failed to cleanup uploaded image',
        expect.objectContaining({ filename: expect.any(String) })
      );
    });

    it('should use correct file extension from original filename', async () => {
      const testPractice = createTestPractice({ status: 'active' });
      const testCheckIn = createTestCheckIn();
      const request = createCheckInWithFilesRequest({
        imageFiles: [createTestFile({ originalname: 'photo.PNG' })]
      });

      prismaMock.practices.findUnique.mockResolvedValue(testPractice);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(1);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(testCheckIn);
      prismaMock.practices.update.mockResolvedValue(testPractice);
      // Fire-and-forget: createCheckIn calls prisma.follows.findMany().then(...)
      prismaMock.follows.findMany.mockResolvedValue([] as any);

      await createCheckInWithImages(1, request, 1);

      expect(mockUploadToR2).toHaveBeenCalledWith(
        expect.objectContaining({ originalname: 'photo.PNG' }),
        expect.stringMatching(/^checkins\/[a-f0-9-]+\.PNG$/)
      );
    });

    it('should throw NotFoundError when practice not found', async () => {
      const request = createCheckInWithFilesRequest();

      prismaMock.practices.findUnique.mockResolvedValue(null);

      await expect(createCheckInWithImages(1, request, 1))
        .rejects.toThrow('實踐不存在或沒有權限');

      // Images should be cleaned up
      expect(mockUploadToR2).toHaveBeenCalledTimes(1);
      expect(mockDeleteFromR2).toHaveBeenCalledTimes(1);
    });
  });
});
