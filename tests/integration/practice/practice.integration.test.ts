/**
 * Practice API Integration Tests
 * 測試實踐管理 API 端點
 *
 * 涵蓋範圍：
 * - A-1 ~ A-7: 實踐 CRUD 操作
 * - 驗證、權限、錯誤處理
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
  enqueuePracticeEmail: jest.fn().mockResolvedValue({ id: 'job-id' })
}));

// Mock queues index (re-exports enqueuePracticeEmail)
jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue({ id: 'job-id' })
}));

// Mock id-converter service
jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockImplementation(async (type: string, externalId: string) => {
    const practice = await prismaMock.practices.findUnique({ where: { external_id: externalId } as any });
    if (practice) return practice.id;
    return 1;
  }),
  internalToExternalId: jest.fn().mockResolvedValue('550e8400-e29b-41d4-a716-446655440002')
}));

// 動態 import app 以確保 mock 生效
let app: any;

// Helper to create Decimal mock that works with Number()
const createDecimalMock = (value: number) => ({
  valueOf: () => value,
  toString: () => value.toString(),
  toNumber: () => value,
  toFixed: (digits?: number) => value.toFixed(digits)
});

describe('Practice API Integration Tests', () => {
  const API_BASE = '/api/v1/practices';

  let userToken: string;
  let otherUserToken: string;
  const userId = 1;
  const otherUserId = 2;

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

    // Default mock for fire-and-forget calls in create/update
    prismaMock.follows.findMany.mockResolvedValue([] as any);
    // Default mock for theme color assignment in create
    prismaMock.practices.count.mockResolvedValue(0);
  });

  // Helper functions
  const authGet = (url: string, token?: string) => {
    const req = request(app).get(url);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  const authPost = (url: string, data: any, token?: string) => {
    const req = request(app).post(url).send(data);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  const authPut = (url: string, data: any, token?: string) => {
    const req = request(app).put(url).send(data);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  const authDelete = (url: string, token?: string) => {
    const req = request(app).delete(url);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  // ==========================================================================
  // A-1: 建立實踐
  // ==========================================================================
  describe('POST /api/v1/practices - 建立實踐', () => {
    const validPracticeData = {
      title: '每日閱讀 30 分鐘',
      practiceAction: '閱讀技術書籍或文章',
      startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      durationDays: 14,
      frequencyMinDays: 4,
      frequencyMaxDays: 7,
      sessionDurationMinutes: 30,
      practiceTimePeriods: ['morning', 'evening'],
      tags: ['閱讀', '學習'],
      resources: []
    };

    it('A-1-a: 應成功建立實踐（開始日期為今天）', async () => {
      const todayData = {
        ...validPracticeData,
        startDate: new Date().toISOString().split('T')[0]
      };

      const mockCreatedPractice = {
        id: 1,
        external_id: '550e8400-e29b-41d4-a716-446655440002',
        user_id: userId,
        title: todayData.title,
        practice_action: todayData.practiceAction,
        start_date: new Date(todayData.startDate),
        end_date: new Date(Date.now() + 13 * 86400000),
        duration_days: 14,
        frequency_min_days: 4,
        frequency_max_days: 7,
        session_duration_minutes: 30,
        practice_time_periods: ['morning', 'evening'],
        status: 'not_started',
        progress_percentage: createDecimalMock(20),
        has_resources: false,
        first_checkin_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        users: {
          id: userId,
          external_id: 'user-uuid',
          nickname: 'Test User',
          contacts: { photo_url: null },
          user_positions: []
        }
      };

      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice as any);
      prismaMock.tags.upsert.mockResolvedValue({ id: 1, name: '閱讀' } as any);
      prismaMock.entity_tags.upsert.mockResolvedValue({} as any);

      const response = await authPost(API_BASE, todayData, userToken);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(todayData.title);
      expect(response.body.data.status).toBe('not_started');
      expect(response.body.data.progressPercentage).toBe(20);
    });

    it('A-1-c: 開始日期超過 14 天應返回 400 錯誤', async () => {
      const tooFarDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
      const invalidData = { ...validPracticeData, startDate: tooFarDate };

      const response = await authPost(API_BASE, invalidData, userToken);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('A-1-d: 缺少必填欄位 title 應返回 400 錯誤', async () => {
      const { title, ...dataWithoutTitle } = validPracticeData;

      const response = await authPost(API_BASE, dataWithoutTitle, userToken);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('A-1-e: durationDays = 0 應返回 400 錯誤', async () => {
      const invalidData = { ...validPracticeData, durationDays: 0 };

      const response = await authPost(API_BASE, invalidData, userToken);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('未登入應返回 401 錯誤', async () => {
      const response = await authPost(API_BASE, validPracticeData);

      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // A-2: 取得實踐列表（公開）
  // ==========================================================================
  describe('GET /api/v1/practices - 取得實踐列表', () => {
    const mockPracticeList = [
      {
        id: 1,
        external_id: '550e8400-e29b-41d4-a716-446655440002',
        title: '每日閱讀',
        practice_action: '每天閱讀30分鐘',
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-01-29'),
        duration_days: 14,
        frequency_min_days: 4,
        frequency_max_days: 7,
                session_duration_minutes: 30,
        practice_time_periods: ['morning', 'evening'],
        other_context: null,
        status: 'active',
        has_resources: false,
        progress_percentage: createDecimalMock(50),
        first_checkin_at: null,
        created_at: new Date('2024-01-15T10:30:00.000Z'),
        updated_at: new Date('2024-01-15T10:30:00.000Z'),
        deleted_at: null,
        users: {
          id: 1,
          external_id: 'user-uuid-1',
          nickname: 'User 1',
          contacts: { photo_url: null },
          user_positions: []
        }
      }
    ];

    beforeEach(() => {
      prismaMock.practices.findMany.mockResolvedValue(mockPracticeList as any);
      prismaMock.practices.count.mockResolvedValue(1);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);
    });

    it('A-2-a: 無參數應返回分頁列表', async () => {
      const response = await authGet(API_BASE);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
    });

    it('A-2-b: status=active 應僅返回進行中實踐', async () => {
      const response = await authGet(`${API_BASE}?status=active`);

      expect(response.status).toBe(200);
      expect(prismaMock.practices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active'
          })
        })
      );
    });

    it('A-2-c: search 參數應搜尋標題', async () => {
      const response = await authGet(`${API_BASE}?search=閱讀`);

      expect(response.status).toBe(200);
      expect(prismaMock.practices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({
                    title: expect.objectContaining({ contains: '閱讀' })
                  })
                ])
              })
            ])
          })
        })
      );
    });
  });

  // ==========================================================================
  // A-3: 取得我的實踐列表
  // ==========================================================================
  describe('GET /api/v1/practices/me - 取得我的實踐列表', () => {
    it('A-3-a: 帶 Token 應返回當前用戶實踐', async () => {
      prismaMock.practices.findMany.mockResolvedValue([]);
      prismaMock.practices.count.mockResolvedValue(0);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

      const response = await authGet(`${API_BASE}/me`, userToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prismaMock.practices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: userId
          })
        })
      );
    });

    it('A-3-d: 無 Token 應返回 401 錯誤', async () => {
      const response = await authGet(`${API_BASE}/me`);

      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // A-4: 取得實踐詳情
  // ==========================================================================
  describe('GET /api/v1/practices/:id - 取得實踐詳情', () => {
    const mockPractice = {
      id: 1,
      external_id: '550e8400-e29b-41d4-a716-446655440002',
      title: '每日閱讀',
      practice_action: '每天閱讀30分鐘',
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-29'),
      duration_days: 14,
      frequency_min_days: 4,
      frequency_max_days: 7,
            session_duration_minutes: 30,
      practice_time_periods: ['morning', 'evening'],
      other_context: null,
      status: 'active',
      has_resources: false,
      progress_percentage: createDecimalMock(50),
      first_checkin_at: null,
      created_at: new Date('2024-01-15T10:30:00.000Z'),
      updated_at: new Date('2024-01-15T10:30:00.000Z'),
      deleted_at: null,
      users: {
        id: 1,
        external_id: 'user-uuid-1',
        nickname: 'User 1',
        contacts: { photo_url: null },
        user_positions: []
      }
    };

    it('A-4-a: 有效 ID 應返回完整詳情', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

      const response = await authGet(`${API_BASE}/550e8400-e29b-41d4-a716-446655440002`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('550e8400-e29b-41d4-a716-446655440002');
    });

    it('A-4-b: 不存在的 ID 應返回 404 錯誤', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(null);

      // 使用有效的 UUID 格式，但不存在的 ID
      const response = await authGet(`${API_BASE}/00000000-0000-0000-0000-000000000000`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // A-5: 更新實踐
  // ==========================================================================
  describe('PUT /api/v1/practices/:id - 更新實踐', () => {
    const mockPracticeNotStarted = {
      id: 1,
      external_id: '550e8400-e29b-41d4-a716-446655440002',
      user_id: userId,
      title: '原始標題',
      practice_action: '每天閱讀30分鐘',
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-29'),
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
      created_at: new Date('2024-01-15T10:30:00.000Z'),
      updated_at: new Date('2024-01-15T10:30:00.000Z'),
      deleted_at: null,
      users: {
        id: userId,
        external_id: 'user-uuid-1',
        nickname: 'Test User',
        contacts: { photo_url: null },
        user_positions: []
      }
    };

    const mockPracticeWithCheckIn = {
      ...mockPracticeNotStarted,
      status: 'active',
      first_checkin_at: new Date('2024-01-16T10:30:00.000Z')
    };

    describe('未打卡狀態', () => {
      beforeEach(() => {
        prismaMock.practices.findUnique.mockResolvedValue(mockPracticeNotStarted as any);
        prismaMock.practices.update.mockResolvedValue({
          ...mockPracticeNotStarted,
          title: '更新後標題'
        } as any);
        prismaMock.practice_checkins.count.mockResolvedValue(0);
        prismaMock.comments.groupBy.mockResolvedValue([]);
        prismaMock.entity_tags.findMany.mockResolvedValue([]);
      });

      it('A-5-a: 修改 title 應成功', async () => {
        const response = await authPut(
          `${API_BASE}/550e8400-e29b-41d4-a716-446655440002`,
          { title: '更新後標題' },
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('已打卡狀態', () => {
      beforeEach(() => {
        prismaMock.practices.findUnique.mockResolvedValue(mockPracticeWithCheckIn as any);
        prismaMock.practice_checkins.count.mockResolvedValue(1);
      });

      it('A-5-f: 修改 startDate 應返回 400 錯誤（鎖定）', async () => {
        const response = await authPut(
          `${API_BASE}/550e8400-e29b-41d4-a716-446655440002`,
          { startDate: '2025-03-01' },
          userToken
        );

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    it('A-5-i: 其他用戶修改應返回 403 錯誤', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        ...mockPracticeNotStarted,
        user_id: otherUserId
      } as any);

      const response = await authPut(
        `${API_BASE}/550e8400-e29b-41d4-a716-446655440002`,
        { title: '嘗試修改' },
        userToken
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // A-6: 刪除實踐
  // ==========================================================================
  describe('DELETE /api/v1/practices/:id - 刪除實踐', () => {
    it('A-6-a: 刪除自己的實踐應成功（軟刪除）', async () => {
      const mockPractice = {
        id: 1,
        external_id: '550e8400-e29b-41d4-a716-446655440002',
        user_id: userId,
        deleted_at: null
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practices.update.mockResolvedValue({
        ...mockPractice,
        deleted_at: new Date()
      } as any);

      const response = await authDelete(`${API_BASE}/550e8400-e29b-41d4-a716-446655440002`, userToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('A-6-b: 刪除他人的實踐應返回 403 錯誤', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        id: 1,
        external_id: '550e8400-e29b-41d4-a716-446655440002',
        user_id: otherUserId,
        deleted_at: null
      } as any);

      const response = await authDelete(`${API_BASE}/550e8400-e29b-41d4-a716-446655440002`, userToken);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('A-6-c: 不存在的實踐應返回 404 錯誤', async () => {
      prismaMock.practices.findUnique.mockResolvedValue(null);

      const response = await authDelete(`${API_BASE}/550e8400-e29b-41d4-a716-446655440002`, userToken);

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // A-7: 取得統計資訊
  // ==========================================================================
  describe('GET /api/v1/practices/stats - 取得統計資訊', () => {
    it('應返回正確的統計資訊', async () => {
      const mockStats = {
        _count: { id: 10 }
      };
      const mockStatusCounts = [
        { status: 'active', _count: { id: 5 } },
        { status: 'completed', _count: { id: 3 } },
        { status: 'not_started', _count: { id: 2 } }
      ];
      const mockCheckInStats = {
        _count: { id: 25 }
      };

      prismaMock.practices.aggregate.mockResolvedValue(mockStats as any);
      prismaMock.practices.groupBy.mockResolvedValue(mockStatusCounts as any);
      prismaMock.practice_checkins.aggregate.mockResolvedValue(mockCheckInStats as any);

      // stats 端點需要 userId（通過認證或查詢參數）
      const response = await authGet(`${API_BASE}/stats`, userToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPractices).toBe(10);
    });
  });
});
