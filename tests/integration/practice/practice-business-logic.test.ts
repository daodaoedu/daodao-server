/**
 * Practice Business Logic Tests
 * 測試業務邏輯驗證
 *
 * 涵蓋範圍：
 * - BL-1: 進度計算驗證
 * - BL-2: 狀態轉換驗證
 * - BL-3: 打卡鎖定機制驗證
 * - BL-4: 日期位移驗證
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { createAuthToken } from '@tests/utils/api-helpers';
import { getTestApp } from '@tests/utils/test-app';
import request from 'supertest';
import type { Application } from 'express';
import { Prisma } from '@generated/prisma';

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

// Mock id-converter service
jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockImplementation(async (type: string, externalId: string) => {
    const practice = await prismaMock.practices.findUnique({ where: { external_id: externalId } as any });
    if (practice) return practice.id;
    return 1;
  }),
  internalToExternalId: jest.fn().mockResolvedValue('test-uuid')
}));

let app: Application;

describe('Practice Business Logic Tests', () => {
  const API_BASE = '/api/v1/practices';

  let userToken: string;
  const userId = 1;
  const practiceId = '550e8400-e29b-41d4-a716-446655440001'; // Valid UUID format

  // Helper to create Decimal mock
  const createDecimalMock = (value: number): Prisma.Decimal => ({
    valueOf: () => value,
    toString: () => value.toString(),
    toNumber: () => value,
    toFixed: (digits?: number) => value.toFixed(digits)
  } as any);

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    prismaMock.tags.findUnique.mockResolvedValue({ id: 1, name: '閱讀' } as never);
    userToken = createAuthToken({ id: userId, email: 'user@test.com' });
    prismaMock.follows.findMany.mockResolvedValue([]);
  });

  // Helper functions - 使用正確的鏈式調用
  const authPost = (url: string, data?: any, token?: string) => {
    let req = request(app).post(url);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    if (data) req = req.send(data);
    return req;
  };

  const authPut = (url: string, data?: any, token?: string) => {
    let req = request(app).put(url);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    if (data) req = req.send(data);
    return req;
  };

  // Helper for success response
  const expectSuccess = (response: any, statusCode = 200) => {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(true);
    return response.body.data;
  };

  // Helper for error response
  const expectError = (response: any, statusCode: number) => {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(false);
    return response.body.error;
  };

  // 共用的 basePractice 模板
  const basePractice = {
    id: 1,
    external_id: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format
    user_id: userId,
    template_id: null,
    title: '每日閱讀',
    practice_action: '閱讀',
    start_date: new Date(),
    end_date: new Date(Date.now() + 13 * 86400000),
    duration_days: 14,
    frequency_min_days: 4,
    frequency_max_days: 7,
        session_duration_minutes: 30,
    practice_time_periods: ['morning'],
    other_context: null,
    status: 'not_started',
    has_resources: false,
    progress_percentage: createDecimalMock(20),
    first_checkin_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null
  };

  // ==========================================================================
  // BL-1: 進度計算驗證
  // ==========================================================================
  describe('BL-1: 進度計算驗證', () => {
    // 測試情境：14 天實踐，每週 4-7 天
    // 最低目標：8 次（2 週 × 4 天）

    it('建立後進度應為 20%', async () => {
      const mockCreatedPractice = {
        ...basePractice,
        progress_percentage: 20, // Use plain number instead of Decimal mock for service compatibility
        users: {
          id: userId,
          external_id: '550e8400-e29b-41d4-a716-446655440002',
          nickname: 'Test',
          contacts: { photo_url: null },
          user_positions: []
        }
      };

      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice as any);

      const response = await authPost(API_BASE, {
        title: '每日閱讀',
        practiceAction: '閱讀',
        startDate: new Date().toISOString().split('T')[0],
        durationDays: 14,
        frequencyMinDays: 4,
        frequencyMaxDays: 7
      }, userToken);

      const data = expectSuccess(response, 201);
      expect(data.progressPercentage).toBe(20);
      expect(data.status).toBe('not_started');
    });

    it('首次打卡後進度應為 50%', async () => {
      const mockPractice = {
        ...basePractice,
        progress_percentage: createDecimalMock(20)
      };

      const mockCheckIn = {
        id: 1,
        practice_id: 1,
        user_id: userId,
        checkin_date: new Date(),
        mood: 'happy',
        note: null,
        image_urls: [],
        og_image_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        practices: { title: '每日閱讀' }
      };

      const mockUpdatedPractice = {
        ...mockPractice,
        status: 'active',
        progress_percentage: createDecimalMock(50),
        first_checkin_at: new Date()
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]); // for streak calculation
      prismaMock.practice_checkins.create.mockResolvedValue(mockCheckIn as any);
      prismaMock.practices.update.mockResolvedValue(mockUpdatedPractice as any);
      // Note: setupTransactionMock() handles interactive transaction
      prismaMock.checkin_encouragements.findFirst.mockResolvedValue({
        id: 1,
        message: '太棒了！'
      } as any);

      const response = await authPost(`${API_BASE}/${practiceId}/checkins`, { tags: ['閱讀'], mood: 'happy' }, userToken);

      const data = expectSuccess(response, 201);
      expect(data.practiceProgressPercentage).toBe(50);
      expect(data.practiceStatus).toBe('active');
    });

    describe('後續打卡進度計算', () => {
      // minTarget = ceil(14/7 * 4) = 8（2 週 × 每週最少 4 天）
      // 每次增加 = 50 / (8 - 1) ≈ 7.14%
      // 首次打卡：50%，第 8 次達成目標：100%
      const expectedProgress = [
        { checkIns: 8, progress: 100 }  // 達成最低目標 8 次
      ];

      expectedProgress.forEach(({ checkIns, progress }) => {
        it(`第 ${checkIns} 次打卡後進度應為 ${progress}%`, async () => {
          const mockPractice = {
            ...basePractice,
            status: 'active',
            first_checkin_at: new Date(Date.now() - 86400000),
            progress_percentage: createDecimalMock(50)
          };

          const mockCheckIn = {
            id: checkIns,
            practice_id: 1,
            user_id: userId,
            checkin_date: new Date(),
            mood: 'happy',
            note: null,
            image_urls: [],
            og_image_url: null,
            created_at: new Date(),
            updated_at: new Date(),
            practices: { title: '每日閱讀' }
          };

          const mockUpdatedPractice = {
            ...mockPractice,
            progress_percentage: createDecimalMock(progress)
          };

          prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
          prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
          prismaMock.practice_checkins.count.mockResolvedValue(checkIns - 1);
          prismaMock.practice_checkins.findMany.mockResolvedValue([]);
          prismaMock.practice_checkins.create.mockResolvedValue(mockCheckIn as any);
          prismaMock.practices.update.mockResolvedValue(mockUpdatedPractice as any);
          // Note: setupTransactionMock() handles interactive transaction
          prismaMock.checkin_encouragements.findFirst.mockResolvedValue({
            id: 1,
            message: '加油！'
          } as any);

          const response = await authPost(`${API_BASE}/${practiceId}/checkins`, { tags: ['閱讀'], mood: 'happy' }, userToken);

          const data = expectSuccess(response, 201);
          expect(data.practiceProgressPercentage).toBeCloseTo(progress, 1);
        });
      });

      it('第 9 次打卡（超額）進度應超過 100%', async () => {
        const mockPractice = {
          ...basePractice,
          status: 'active',
          first_checkin_at: new Date(Date.now() - 7 * 86400000),
          progress_percentage: createDecimalMock(100)
        };

        const mockCheckIn = {
          id: 9,
          practice_id: 1,
          user_id: userId,
          checkin_date: new Date(),
          mood: 'happy',
          note: null,
          image_urls: [],
          og_image_url: null,
          created_at: new Date(),
          updated_at: new Date(),
          practices: { title: '每日閱讀' }
        };

        const mockUpdatedPractice = {
          ...mockPractice,
          progress_percentage: createDecimalMock(107) // 超過 100%
        };

        prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
        prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
        prismaMock.practice_checkins.count.mockResolvedValue(8); // Already has 8 check-ins (minTarget reached)
        prismaMock.practice_checkins.findMany.mockResolvedValue([]);
        prismaMock.practice_checkins.create.mockResolvedValue(mockCheckIn as any);
        prismaMock.practices.update.mockResolvedValue(mockUpdatedPractice as any);
        // Note: setupTransactionMock() handles interactive transaction
        prismaMock.checkin_encouragements.findFirst.mockResolvedValue({
          id: 1,
          message: '超棒！'
        } as any);

        const response = await authPost(`${API_BASE}/${practiceId}/checkins`, { tags: ['閱讀'], mood: 'happy' }, userToken);

        const data = expectSuccess(response, 201);
        expect(data.practiceProgressPercentage).toBeGreaterThan(100);
      });
    });
  });

  // ==========================================================================
  // BL-2: 狀態轉換驗證
  // ==========================================================================
  describe('BL-2: 狀態轉換驗證', () => {
    it('BL-2-a: 建立開始日為今天的實踐，狀態應為 active（daodao#212）', async () => {
      const mockCreatedPractice = {
        id: 1,
        external_id: practiceId,
        user_id: userId,
        title: '每日閱讀',
        status: 'active',
        progress_percentage: createDecimalMock(20),
        users: { id: userId, nickname: 'Test', contacts: null, user_positions: [] }
      };

      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice as any);

      const response = await authPost(API_BASE, {
        title: '每日閱讀',
        practiceAction: '閱讀',
        startDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' }),
        durationDays: 14,
        frequencyMinDays: 4,
        frequencyMaxDays: 7
      }, userToken);

      const data = expectSuccess(response, 201);
      expect((prismaMock.practices.create.mock.calls[0][0] as any).data.status).toBe('active');
      expect(data.status).toBe('active');
    });

    it('BL-2-b: 首次打卡後狀態應自動轉為 active', async () => {
      const mockPractice = {
        ...basePractice,
        status: 'not_started',
        progress_percentage: createDecimalMock(20),
        first_checkin_at: null
      };

      const mockCheckIn = {
        id: 1,
        practice_id: 1,
        user_id: userId,
        checkin_date: new Date(),
        mood: 'happy',
        note: null,
        image_urls: [],
        og_image_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        practices: { title: '每日閱讀' }
      };

      const mockUpdatedPractice = {
        ...mockPractice,
        status: 'active',
        progress_percentage: createDecimalMock(50),
        first_checkin_at: new Date()
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.create.mockResolvedValue(mockCheckIn as any);
      prismaMock.practices.update.mockResolvedValue(mockUpdatedPractice as any);
      // Note: setupTransactionMock() handles interactive transaction
      prismaMock.checkin_encouragements.findFirst.mockResolvedValue({
        id: 1,
        message: '太棒了！'
      } as any);

      const response = await authPost(`${API_BASE}/${practiceId}/checkins`, { tags: ['閱讀'], mood: 'happy' }, userToken);

      const data = expectSuccess(response, 201);
      expect(data.practiceStatus).toBe('active');
    });

    /**
     * 注意：archive 返回 { success: boolean }，不含 status
     * 這個測試需要調整預期
     */
    it('BL-2-d: 手動封存應成功', async () => {
      const mockPractice = {
        id: 1,
        external_id: practiceId,
        user_id: userId,
        status: 'active',
        deleted_at: null
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practices.update.mockResolvedValue({
        ...mockPractice,
        status: 'archived',
        previous_status: 'active'
      } as any);

      const response = await authPost(`${API_BASE}/${practiceId}/archive`, undefined, userToken);

      const data = expectSuccess(response);
      // archive 返回 { success: boolean }
      expect(data.success).toBe(true);
    });

    it('BL-2-e: 取消封存應恢復原狀態', async () => {
      const mockPractice = {
        id: 1,
        external_id: practiceId,
        user_id: userId,
        title: '每日閱讀',
        practice_action: '閱讀',
        status: 'archived',
        previous_status: 'active',
        deleted_at: null,
        start_date: new Date(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        duration_days: 14,
        frequency_min_days: 4,
        frequency_max_days: 7,
        progress_percentage: 50,
        practice_time_periods: [],
        has_resources: false,
        created_at: new Date(),
        updated_at: new Date(),
        users: {
          id: userId,
          external_id: 'user-uuid',
          nickname: 'Test User',
          contacts: { photo_url: null },
          user_positions: []
        }
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practices.update.mockResolvedValue({
        ...mockPractice,
        status: 'not_started',
        previous_status: null
      } as any);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);

      const response = await authPost(`${API_BASE}/${practiceId}/unarchive`, undefined, userToken);

      const data = expectSuccess(response);
      expect(data.status).toBe('not_started');
    });
  });

  // ==========================================================================
  // BL-3: 打卡鎖定機制驗證
  // ==========================================================================
  describe('BL-3: 打卡鎖定機制驗證', () => {
    const createMockPractice = (hasCheckIn: boolean) => ({
      id: 1,
      external_id: practiceId,
      user_id: userId,
      template_id: null,
      title: '原始標題',
      practice_action: '閱讀',
      start_date: new Date(),
      end_date: new Date(Date.now() + 13 * 86400000),
      duration_days: 14,
      frequency_min_days: 4,
      frequency_max_days: 7,
            session_duration_minutes: 30,
      practice_time_periods: ['morning'],
      other_context: null,
      status: hasCheckIn ? 'active' : 'not_started',
      has_resources: false,
      first_checkin_at: hasCheckIn ? new Date() : null,
      progress_percentage: createDecimalMock(hasCheckIn ? 50 : 20),
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      users: { id: userId, external_id: 'user-uuid', nickname: 'Test', contacts: null, user_positions: [] }
    });

    describe('未打卡時', () => {
      beforeEach(() => {
        const mockPractice = createMockPractice(false);
        prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
        prismaMock.practices.update.mockResolvedValue(mockPractice as any);
        prismaMock.practice_checkins.count.mockResolvedValue(0); // No check-ins
        prismaMock.comments.groupBy.mockResolvedValue([]);
        prismaMock.entity_tags.findMany.mockResolvedValue([]);
      });

      it('應可修改所有欄位', async () => {
        const updateData = {
          title: '新標題'
        };

        const response = await authPut(`${API_BASE}/${practiceId}`, updateData, userToken);

        expectSuccess(response);
      });
    });

    describe('已打卡後', () => {
      beforeEach(() => {
        const mockPractice = createMockPractice(true);
        prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
        prismaMock.practice_checkins.count.mockResolvedValue(1); // Has check-ins - fields locked
        prismaMock.entity_tags.findMany.mockResolvedValue([]);
      });

      it('應可修改 title', async () => {
        prismaMock.practices.update.mockResolvedValue(createMockPractice(true) as any);
        prismaMock.comments.groupBy.mockResolvedValue([]);

        const response = await authPut(`${API_BASE}/${practiceId}`, { title: '新標題' }, userToken);

        expectSuccess(response);
      });

      it('應可修改非鎖定欄位（如 sessionDurationMinutes），即使同時包含鎖定欄位', async () => {
        prismaMock.practices.update.mockResolvedValue(createMockPractice(true) as any);
        prismaMock.comments.groupBy.mockResolvedValue([]);

        const response = await authPut(`${API_BASE}/${practiceId}`, {
          sessionDurationMinutes: 60,
          startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        }, userToken);

        expectSuccess(response);
      });

      it('僅送出鎖定欄位時應返回 400 錯誤（無可更新欄位）', async () => {
        const response = await authPut(`${API_BASE}/${practiceId}`, {
          startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        }, userToken);

        expectError(response, 400);
      });

      it('僅送出 frequencyMinDays 應返回 400 錯誤', async () => {
        const response = await authPut(`${API_BASE}/${practiceId}`, { frequencyMinDays: 2 }, userToken);

        expectError(response, 400);
      });

      it('僅送出 frequencyMaxDays 應返回 400 錯誤', async () => {
        const response = await authPut(`${API_BASE}/${practiceId}`, { frequencyMaxDays: 3 }, userToken);

        expectError(response, 400);
      });

      it('僅送出 durationDays 應返回 400 錯誤', async () => {
        const response = await authPut(`${API_BASE}/${practiceId}`, { durationDays: 28 }, userToken);

        expectError(response, 400);
      });
    });
  });

  // ==========================================================================
  // BL-4: 日期位移驗證
  // ==========================================================================
  describe('BL-4: 日期位移驗證', () => {
    it('提早打卡應自動位移開始和結束日期', async () => {
      const daysAhead = 5;
      // 使用 UTC 時間保持與服務一致
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const originalStartDate = new Date(today.getTime() + daysAhead * 86400000);
      const originalEndDate = new Date(today.getTime() + (daysAhead + 13) * 86400000);

      const mockPractice = {
        id: 1,
        external_id: practiceId,
        user_id: userId,
        title: '每日閱讀',
        start_date: originalStartDate,
        end_date: originalEndDate,
        duration_days: 14,
        status: 'not_started',
        first_checkin_at: null,
        progress_percentage: createDecimalMock(20),
        deleted_at: null
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.create.mockResolvedValue({
        id: 1,
        practice_id: 1,
        user_id: userId,
        checkin_date: today,
        mood: 'happy',
        created_at: new Date()
      } as any);

      let capturedUpdateData: any;
      (prismaMock.practices.update as jest.Mock).mockImplementation((args: any) => {
        capturedUpdateData = args.data;
        return Promise.resolve({
          ...mockPractice,
          start_date: args.data.start_date || mockPractice.start_date,
          end_date: args.data.end_date || mockPractice.end_date,
          status: 'active',
          first_checkin_at: new Date(),
          progress_percentage: createDecimalMock(50)
        } as any);
      });

      prismaMock.checkin_encouragements.findFirst.mockResolvedValue({
        id: 1,
        message: '太棒了！'
      } as any);

      const response = await authPost(`${API_BASE}/${practiceId}/checkins`, { tags: ['閱讀'], mood: 'happy' }, userToken);

      expectSuccess(response, 201);

      // 驗證日期位移發生
      expect(capturedUpdateData.start_date).toBeDefined();
      expect(capturedUpdateData.end_date).toBeDefined();

      // 驗證新 startDate 早於原始 startDate（日期被前移）
      const newStartDate = new Date(capturedUpdateData.start_date);
      expect(newStartDate.getTime()).toBeLessThan(originalStartDate.getTime());

      // 驗證 endDate 同步前移（保持總天數不變）
      // duration_days = 14 表示從 startDate 到 endDate 共 14 天（包含首尾）
      // 所以 endDate = startDate + 13 天，daysDiff = 13
      const newEndDate = new Date(capturedUpdateData.end_date);
      const daysDiff = Math.round((newEndDate.getTime() - newStartDate.getTime()) / 86400000);
      expect(daysDiff).toBe(13); // endDate - startDate = duration_days - 1
    });

    it('在 startDate 當天打卡不應位移日期', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today.getTime() + 13 * 86400000);

      const mockPractice = {
        id: 1,
        external_id: practiceId,
        user_id: userId,
        title: '每日閱讀',
        start_date: today,
        end_date: endDate,
        duration_days: 14,
        status: 'not_started',
        first_checkin_at: null,
        progress_percentage: createDecimalMock(20),
        deleted_at: null
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.create.mockResolvedValue({
        id: 1,
        practice_id: 1,
        user_id: userId,
        checkin_date: today,
        mood: 'happy',
        created_at: new Date()
      } as any);

      let capturedUpdateData: any;
      (prismaMock.practices.update as jest.Mock).mockImplementation((args: any) => {
        capturedUpdateData = args.data;
        return Promise.resolve({
          ...mockPractice,
          status: 'active',
          first_checkin_at: new Date(),
          progress_percentage: createDecimalMock(50)
        } as any);
      });

      prismaMock.checkin_encouragements.findFirst.mockResolvedValue({
        id: 1,
        message: '太棒了！'
      } as any);

      const response = await authPost(`${API_BASE}/${practiceId}/checkins`, { tags: ['閱讀'], mood: 'happy' }, userToken);

      expectSuccess(response, 201);

      // 驗證日期未位移
      expect(capturedUpdateData.start_date).toBeUndefined();
      expect(capturedUpdateData.end_date).toBeUndefined();
    });
  });
});
