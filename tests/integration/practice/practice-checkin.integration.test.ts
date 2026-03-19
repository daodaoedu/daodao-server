/**
 * Practice Check-in API Integration Tests
 * 測試打卡功能 API 端點
 *
 * 涵蓋範圍：
 * - B-1 ~ B-5: 打卡 CRUD 和統計
 * - 日期位移、心情選項、進度計算
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { createAuthToken } from '@tests/utils/api-helpers';
import request from 'supertest';

// Mock dependencies - 必須在 import 之前定義
jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('@/queues/practice-email.queue', () => ({
  practiceEmailQueue: {
    add: jest.fn().mockResolvedValue({ id: 'job-id' })
  },
  enqueuePracticeEmail: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue(undefined)
}));

// 動態 import app 以確保 mock 生效
let app: any;

// Mock id-converter service
jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockImplementation(async (type: string, externalId: string) => {
    const practice = await prismaMock.practices.findUnique({ where: { external_id: externalId } as any });
    if (practice) return practice.id;
    return 1;
  }),
  internalToExternalId: jest.fn().mockResolvedValue('550e8400-e29b-41d4-a716-446655440001')
}));

describe('Practice Check-in API Integration Tests', () => {
  const API_BASE = '/api/v1/practices';

  let userToken: string;
  let otherUserToken: string;
  const userId = 1;
  const otherUserId = 2;
  // 使用有效的 UUID 格式
  const practiceId = '550e8400-e29b-41d4-a716-446655440001';

  // Helper to create Decimal mock
  const createDecimalMock = (value: number) => ({
    valueOf: () => value,
    toString: () => value.toString(),
    toNumber: () => value,
    toFixed: (digits?: number) => value.toFixed(digits)
  });

  beforeAll(async () => {
    // 使用 getTestApp 確保路由正確註冊
    const { getTestApp } = await import('@tests/utils/test-app');
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();

    userToken = createAuthToken({ id: userId, email: 'user@test.com' });
    otherUserToken = createAuthToken({ id: otherUserId, email: 'other@test.com' });

    // Default mock for fire-and-forget calls in createCheckIn
    prismaMock.follows.findMany.mockResolvedValue([] as any);
  });

  // Helper functions
  const authPost = (url: string, data: any, token?: string) => {
    const req = request(app).post(url).send(data);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  const authGet = (url: string, token?: string) => {
    const req = request(app).get(url);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  // ==========================================================================
  // B-1: 建立打卡記錄
  // ==========================================================================
  describe('POST /api/v1/practices/:id/checkins - 建立打卡記錄', () => {
    const validCheckInData = {
      mood: 'happy',
      note: '今天閱讀了 30 分鐘，學到很多新知識！',
      imageUrls: []
    };

    const mockPracticeNotStarted = {
      id: 1,
      external_id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: userId,
      title: '每日閱讀',
      status: 'not_started',
      start_date: new Date(),
      end_date: new Date(Date.now() + 13 * 86400000),
      duration_days: 14,
      frequency_min_days: 4,
      frequency_max_days: 7,
      progress_percentage: createDecimalMock(20),
      first_checkin_at: null,
      deleted_at: null
    };

    const mockPracticeActive = {
      ...mockPracticeNotStarted,
      status: 'active',
      first_checkin_at: new Date(Date.now() - 86400000),
      progress_percentage: createDecimalMock(50)
    };

    it('B-1-a: 首次打卡應成功，進度 50%，狀態 active', async () => {
      const mockCheckIn = {
        id: 1,
        practice_id: 1,
        user_id: userId,
        checkin_date: new Date('2024-01-15'),
        mood: 'happy',
        note: validCheckInData.note,
        image_urls: [],
        created_at: new Date('2024-01-15T10:30:00.000Z'),
        updated_at: new Date('2024-01-15T10:30:00.000Z'),
        practices: { title: '每日閱讀' }
      };

      const mockEncouragement = {
        id: 1,
        message: '你的堅持正在閃閃發光！'
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPracticeNotStarted as any);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.create.mockResolvedValue(mockCheckIn as any);
      prismaMock.practices.update.mockResolvedValue({
        ...mockPracticeNotStarted,
        status: 'active',
        progress_percentage: createDecimalMock(50),
        first_checkin_at: new Date()
      } as any);
      prismaMock.checkin_encouragements.findFirst.mockResolvedValue(mockEncouragement as any);

      const response = await authPost(
        `${API_BASE}/${practiceId}/checkins`,
        validCheckInData,
        userToken
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // 響應格式是扁平化的，包含 encouragement, practiceProgressPercentage, practiceStatus 等
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.practiceProgressPercentage).toBe(50);
      expect(response.body.data.practiceStatus).toBe('active');
      expect(response.body.data.encouragement).toBeDefined();
    });

    it('B-1-c: 同一天再次打卡應成功（系統允許多次打卡）', async () => {
      const mockCheckIn = {
        id: 2,
        practice_id: 1,
        user_id: userId,
        checkin_date: new Date(),
        mood: 'happy',
        note: validCheckInData.note,
        image_urls: [],
        created_at: new Date(),
        updated_at: new Date(),
        practices: { title: '每日閱讀' }
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPracticeActive as any);
      prismaMock.practice_checkins.count.mockResolvedValue(1); // Already has 1 checkin
      prismaMock.practice_checkins.findMany.mockResolvedValue([]); // For streak calculation
      prismaMock.practice_checkins.create.mockResolvedValue(mockCheckIn as any);
      prismaMock.practices.update.mockResolvedValue(mockPracticeActive as any);
      prismaMock.checkin_encouragements.findFirst.mockResolvedValue({
        id: 1,
        message: '加油！'
      } as any);

      const response = await authPost(
        `${API_BASE}/${practiceId}/checkins`,
        validCheckInData,
        userToken
      );

      // 系統允許同一天多次打卡
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('B-1-d: 他人實踐打卡應返回 404 錯誤', async () => {
      // 服務使用 findUnique 帶有 user_id 條件，找不到會返回 null，拋出 NotFoundError
      prismaMock.practices.findUnique.mockResolvedValue(null);

      const response = await authPost(
        `${API_BASE}/${practiceId}/checkins`,
        validCheckInData,
        userToken
      );

      // NotFoundError 返回 404
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('B-1-e: 已完成實踐打卡應返回 409 錯誤', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        ...mockPracticeActive,
        status: 'completed'
      } as any);

      const response = await authPost(
        `${API_BASE}/${practiceId}/checkins`,
        validCheckInData,
        userToken
      );

      // ConflictError（此實踐狀態不允許打卡）返回 409
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    // 心情選項測試
    describe('心情選項測試', () => {
      const moodOptions = ['good', 'happy', 'neutral', 'bored', 'frustrated'];

      beforeEach(() => {
        prismaMock.practices.findUnique.mockResolvedValue(mockPracticeActive as any);
        prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
        prismaMock.practice_checkins.count.mockResolvedValue(1);
        prismaMock.practices.update.mockResolvedValue(mockPracticeActive as any);
        prismaMock.checkin_encouragements.findFirst.mockResolvedValue({
          id: 1,
          message: '加油！'
        } as any);
      });

      moodOptions.forEach((mood) => {
        it(`mood="${mood}" 應成功`, async () => {
          const mockCheckIn = {
            id: 1,
            practice_id: 1,
            user_id: userId,
            checkin_date: new Date(),
            mood,
            created_at: new Date()
          };

          prismaMock.practice_checkins.create.mockResolvedValue(mockCheckIn as any);

          const response = await authPost(
            `${API_BASE}/${practiceId}/checkins`,
            { ...validCheckInData, mood },
            userToken
          );

          expect(response.status).toBe(201);
        });
      });

      it('無效的 mood 值應返回 400 錯誤', async () => {
        const response = await authPost(
          `${API_BASE}/${practiceId}/checkins`,
          { ...validCheckInData, mood: 'invalid' },
          userToken
        );

        expect(response.status).toBe(400);
      });
    });
  });

  // ==========================================================================
  // B-3: 取得打卡記錄列表
  // ==========================================================================
  describe('GET /api/v1/practices/:id/checkins - 取得打卡記錄列表', () => {
    const mockPractice = {
      id: 1,
      external_id: practiceId,
      user_id: userId,
      title: '每日閱讀',
      status: 'active',
      deleted_at: null
    };

    const mockCheckIns = [
      {
        id: 1,
        practice_id: 1,
        user_id: userId,
        checkin_date: new Date('2025-02-01'),
        mood: 'happy',
        note: '第一天',
        image_urls: [],
        created_at: new Date('2025-02-01T10:30:00.000Z'),
        updated_at: new Date('2025-02-01T10:30:00.000Z'),
        practices: mockPractice
      },
      {
        id: 2,
        practice_id: 1,
        user_id: userId,
        checkin_date: new Date('2025-02-02'),
        mood: 'good',
        note: '第二天',
        image_urls: [],
        created_at: new Date('2025-02-02T10:30:00.000Z'),
        updated_at: new Date('2025-02-02T10:30:00.000Z'),
        practices: mockPractice
      }
    ];

    beforeEach(() => {
      // Mock for ID conversion
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practice_checkins.findMany.mockResolvedValue(mockCheckIns as any);
      prismaMock.practice_checkins.count.mockResolvedValue(2);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
    });

    it('B-3-a: 無參數應返回所有打卡記錄', async () => {
      const response = await authGet(`${API_BASE}/${practiceId}/checkins`, userToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('B-3-b: 日期範圍篩選應正確處理', async () => {
      const response = await authGet(
        `${API_BASE}/${practiceId}/checkins?startDate=2025-02-01&endDate=2025-02-07`,
        userToken
      );

      expect(response.status).toBe(200);
      expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            checkin_date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date)
            })
          })
        })
      );
    });

    it('B-3-c: 心情篩選應正確處理', async () => {
      const response = await authGet(
        `${API_BASE}/${practiceId}/checkins?mood=happy`,
        userToken
      );

      expect(response.status).toBe(200);
      expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mood: 'happy'
          })
        })
      );
    });
  });

  // ==========================================================================
  // B-4: 取得打卡統計
  // ==========================================================================
  describe('GET /api/v1/practices/:id/checkins/stats - 取得打卡統計', () => {
    it('應返回正確的統計資料', async () => {
      prismaMock.practice_checkins.aggregate.mockResolvedValue({
        _count: { id: 15 },
        _max: { checkin_date: new Date('2025-02-01') }
      } as any);

      // Mock for calculateStreak function
      prismaMock.practice_checkins.findMany.mockResolvedValue([
        { checkin_date: new Date('2025-01-31') },
        { checkin_date: new Date('2025-01-30') }
      ] as any);

      const response = await authGet(
        `${API_BASE}/${practiceId}/checkins/stats`,
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalCheckIns).toBe(15);
    });

    it('無登入應返回 401 錯誤', async () => {
      const response = await authGet(`${API_BASE}/${practiceId}/checkins/stats`);

      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // B-5: 取得月度日曆
  // ==========================================================================
  describe('GET /api/v1/practices/:id/checkins/calendar/:year/:month - 取得月度日曆', () => {
    it('B-5-a: 應返回正確的月度日曆', async () => {
      const mockCalendarData = [
        { checkin_date: new Date('2025-02-01'), mood: 'happy' },
        { checkin_date: new Date('2025-02-03'), mood: 'good' },
        { checkin_date: new Date('2025-02-05'), mood: 'neutral' }
      ];

      prismaMock.practice_checkins.findMany.mockResolvedValue(mockCalendarData as any);

      const response = await authGet(
        `${API_BASE}/${practiceId}/checkins/calendar/2025/2`,
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Service returns { checkInDates, totalCheckIns, streakDays }
      expect(response.body.data.checkInDates).toBeDefined();
      expect(response.body.data.totalCheckIns).toBe(3);
    });

    it('B-5-b: 無效月份 13 應返回 400 錯誤', async () => {
      const response = await authGet(
        `${API_BASE}/${practiceId}/checkins/calendar/2025/13`,
        userToken
      );

      expect(response.status).toBe(400);
    });

    it('B-5-c: 無效月份 0 應返回 400 錯誤', async () => {
      const response = await authGet(
        `${API_BASE}/${practiceId}/checkins/calendar/2025/0`,
        userToken
      );

      expect(response.status).toBe(400);
    });

    it('無登入應返回 401 錯誤', async () => {
      const response = await authGet(
        `${API_BASE}/${practiceId}/checkins/calendar/2025/2`
      );

      expect(response.status).toBe(401);
    });
  });
});
