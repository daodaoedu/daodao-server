/**
 * Practice E2E Tests
 * 端對端測試 - 模擬完整用戶流程
 *
 * 測試情境：
 * 1. 完整實踐生命週期
 * 2. 打卡流程與進度追蹤
 * 3. 錯誤處理與邊界條件
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { createAuthToken } from '@tests/utils/api-helpers';
import { Prisma } from '@generated/prisma';
import { NotFoundError } from '@/middleware/error.middleware';
import request from 'supertest';
import type { Application } from 'express';

// Mock dependencies - 必須在 jest.mock 內部直接定義以避免 hoisting 問題
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

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue('mock-job-id'),
  PRACTICE_EMAIL_QUEUE_NAME: 'practice-email',
  getPracticeEmailQueue: jest.fn().mockReturnValue(null),
  setPracticeEmailQueue: jest.fn()
}));

// Mock id-converter service - 使用 factory function 來避免 hoisting 問題
jest.mock('@/services/id-converter.service', () => {
  const mockExternalToInternalId = jest.fn().mockResolvedValue(1);
  const mockInternalToExternalId = jest.fn().mockResolvedValue('550e8400-e29b-41d4-a716-446655440000');
  return {
    externalToInternalId: mockExternalToInternalId,
    internalToExternalId: mockInternalToExternalId,
    __mockExternalToInternalId: mockExternalToInternalId,
    __mockInternalToExternalId: mockInternalToExternalId
  };
});

// 動態 import app 以確保 mock 生效
let app: Application;

// 獲取 mock 函數引用
import * as idConverterService from '@/services/id-converter.service';
const mockIdConverter = idConverterService as unknown as {
  externalToInternalId: jest.Mock;
  internalToExternalId: jest.Mock;
  __mockExternalToInternalId: jest.Mock;
  __mockInternalToExternalId: jest.Mock;
};

describe('Practice E2E Tests', () => {
  const API_BASE = '/api/v1/practices';

  let userToken: string;
  const userId = 1;
  // 使用有效的 UUID 格式
  const practiceExternalId = '550e8400-e29b-41d4-a716-446655440000';

  // Helper to create Decimal mock
  const createDecimalMock = (value: number): Prisma.Decimal => ({
    valueOf: () => value,
    toString: () => value.toString(),
    toNumber: () => value,
    toFixed: (digits?: number) => value.toFixed(digits)
  } as any);

  beforeAll(async () => {
    const { getTestApp } = await import('@tests/utils/test-app');
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    userToken = createAuthToken({ id: userId, email: 'user@test.com' });

    // 設置 id-converter 的默認 mock 行為
    mockIdConverter.externalToInternalId.mockResolvedValue(1);
    mockIdConverter.internalToExternalId.mockResolvedValue(practiceExternalId);
  });

  // Helper functions
  const authPost = (url: string, data?: any, token?: string) => {
    let req = request(app).post(url);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    if (data) req = req.send(data);
    return req;
  };

  const authGet = (url: string, token?: string) => {
    let req = request(app).get(url);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  const authPut = (url: string, data?: any, token?: string) => {
    let req = request(app).put(url);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    if (data) req = req.send(data);
    return req;
  };

  // Helper for success response
  const expectSuccess = (response: any, statusCode: number = 200) => {
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

  // ==========================================================================
  // 測試情境 1: 完整實踐生命週期
  // ==========================================================================
  describe('完整實踐生命週期', () => {
    it('應能完成：建立 → 打卡 → 達成目標的完整流程', async () => {
      // Step 1: 建立實踐
      const practiceData = {
        title: '每日閱讀 30 分鐘',
        practiceAction: '閱讀技術書籍',
        startDate: new Date().toISOString().split('T')[0],
        durationDays: 14,
        frequencyMinDays: 4,
        frequencyMaxDays: 7,
        sessionDurationMinutes: 30,
        practiceTimePeriods: ['morning']
      };

      const mockCreatedPractice = {
        id: 1,
        external_id: practiceExternalId,
        user_id: userId,
        title: practiceData.title,
        practice_action: practiceData.practiceAction,
        start_date: new Date(practiceData.startDate),
        end_date: new Date(Date.now() + 13 * 86400000),
        duration_days: practiceData.durationDays,
        frequency_min_days: practiceData.frequencyMinDays,
        frequency_max_days: practiceData.frequencyMaxDays,
        session_duration_minutes: practiceData.sessionDurationMinutes,
        practice_time_periods: practiceData.practiceTimePeriods,
        status: 'not_started',
        progress_percentage: createDecimalMock(20),
        has_resources: false,
        first_checkin_at: null,
        theme_color: '#FCDD84',
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

      prismaMock.practices.count.mockResolvedValue(0); // For theme color assignment
      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice as any);

      const createResponse = await authPost(API_BASE, practiceData, userToken);

      const createdPractice = expectSuccess(createResponse, 201);
      expect(createdPractice.status).toBe('not_started');
      expect(createdPractice.progressPercentage).toBe(20);

      // Step 2: 首次打卡
      const mockPracticeForCheckIn = {
        ...mockCreatedPractice,
        progress_percentage: createDecimalMock(20)
      };

      const mockCheckIn = {
        id: 1,
        practice_id: 1,
        user_id: userId,
        checkin_date: new Date(),
        mood: 'happy',
        note: '第一天閱讀完成！',
        image_urls: [],
        created_at: new Date(),
        updated_at: new Date(),
        practices: { title: '每日閱讀 30 分鐘' }
      };

      const mockUpdatedPractice = {
        ...mockCreatedPractice,
        status: 'active',
        progress_percentage: createDecimalMock(50),
        first_checkin_at: new Date()
      };

      prismaMock.practices.findUnique.mockResolvedValue(mockPracticeForCheckIn as any);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
      prismaMock.practice_checkins.count.mockResolvedValue(0);
      prismaMock.practice_checkins.findMany.mockResolvedValue([]);
      prismaMock.$transaction.mockResolvedValue([mockCheckIn, mockUpdatedPractice]);
      prismaMock.checkin_encouragements.findFirst.mockResolvedValue({
        id: 1,
        message: '今天的你也很有行動力哦！'
      } as any);

      const firstCheckInResponse = await authPost(
        `${API_BASE}/${practiceExternalId}/checkins`,
        { mood: 'happy', note: '第一天閱讀完成！' },
        userToken
      );

      const firstCheckIn = expectSuccess(firstCheckInResponse, 201);
      expect(firstCheckIn.practiceStatus).toBe('active');
      expect(firstCheckIn.practiceProgressPercentage).toBe(50);
      // API 返回的字段是 encouragement，不是 encouragementMessage
      expect(firstCheckIn.encouragement).toBeDefined();

      // Step 3: 取得實踐詳情驗證狀態
      prismaMock.practices.findUnique.mockResolvedValue({
        ...mockCreatedPractice,
        status: 'active',
        progress_percentage: createDecimalMock(50),
        first_checkin_at: new Date()
      } as any);
      prismaMock.comments.groupBy.mockResolvedValue([]);
      prismaMock.entity_tags.findMany.mockResolvedValue([]);
      prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
      prismaMock.entity_resources.findMany.mockResolvedValue([]);

      const detailResponse = await authGet(`${API_BASE}/${practiceExternalId}`, userToken);

      const detail = expectSuccess(detailResponse);
      expect(detail.status).toBe('active');
      expect(detail.progressPercentage).toBe(50);
    });
  });

  // ==========================================================================
  // 測試情境 2: 錯誤處理流程
  // ==========================================================================
  describe('錯誤處理流程', () => {
    describe('驗證錯誤 (ERR-1)', () => {
      it('ERR-1-a: 缺少 title 應返回驗證錯誤', async () => {
        const invalidData = {
          practiceAction: '閱讀',
          startDate: new Date().toISOString().split('T')[0],
          durationDays: 14,
          frequencyMinDays: 4,
          frequencyMaxDays: 7
        };

        const response = await authPost(API_BASE, invalidData, userToken);

        const error = expectError(response, 400);
        // 驗證錯誤碼或錯誤訊息包含相關資訊
        expect(error.code || error.message).toBeDefined();
      });

      it('ERR-1-b: title 超過 100 字應返回驗證錯誤', async () => {
        const invalidData = {
          title: 'a'.repeat(101),
          practiceAction: '閱讀',
          startDate: new Date().toISOString().split('T')[0],
          durationDays: 14,
          frequencyMinDays: 4,
          frequencyMaxDays: 7
        };

        const response = await authPost(API_BASE, invalidData, userToken);

        expectError(response, 400);
      });

      it('ERR-1-c: 無效的 mood 值應返回驗證錯誤', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          id: 1,
          external_id: practiceExternalId,
          user_id: userId,
          status: 'active',
          deleted_at: null
        } as any);

        const response = await authPost(
          `${API_BASE}/${practiceExternalId}/checkins`,
          { mood: 'super-happy-invalid' },
          userToken
        );

        expectError(response, 400);
      });

      it('ERR-1-d: durationDays = -1 應返回驗證錯誤', async () => {
        const invalidData = {
          title: '測試實踐',
          practiceAction: '閱讀',
          startDate: new Date().toISOString().split('T')[0],
          durationDays: -1,
          frequencyMinDays: 4,
          frequencyMaxDays: 7
        };

        const response = await authPost(API_BASE, invalidData, userToken);

        expectError(response, 400);
      });
    });

    describe('權限錯誤 (ERR-2)', () => {
      it('ERR-2-a: 無 Token 存取需驗證 API 應返回 401', async () => {
        const response = await authGet(`${API_BASE}/me`);

        expectError(response, 401);
      });

      it('ERR-2-b: 存取他人實踐（私有操作）應返回 403', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          id: 1,
          external_id: practiceExternalId,
          user_id: 999, // 其他用戶
          status: 'active',
          deleted_at: null
        } as any);

        const response = await authPut(
          `${API_BASE}/${practiceExternalId}`,
          { title: '嘗試修改' },
          userToken
        );

        expectError(response, 403);
      });
    });

    describe('資源不存在 (ERR-3)', () => {
      it('ERR-3-a: 取得不存在的實踐應返回 404', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';
        // id-converter 找不到實踐時會拋出 NotFoundError
        mockIdConverter.externalToInternalId.mockRejectedValue(new NotFoundError('practice 不存在'));

        const response = await authGet(`${API_BASE}/${nonExistentId}`, userToken);

        expectError(response, 404);
      });

      it('ERR-3-b: 更新已封存的實踐應返回 400', async () => {
        // service 層的 canEdit 檢查 status !== 'archived'
        prismaMock.practices.findUnique.mockResolvedValue({
          id: 1,
          external_id: practiceExternalId,
          user_id: userId,
          status: 'archived', // 已封存
          deleted_at: null
        } as any);

        const response = await authPut(
          `${API_BASE}/${practiceExternalId}`,
          { title: '新標題' },
          userToken
        );

        // 封存狀態不允許編輯，返回 BadRequestError (400)
        expectError(response, 400);
      });

      it('ERR-3-c: 打卡不存在的實踐應返回 404', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';
        // id-converter 找不到實踐時會拋出 NotFoundError
        mockIdConverter.externalToInternalId.mockRejectedValue(new NotFoundError('practice 不存在'));

        const response = await authPost(
          `${API_BASE}/${nonExistentId}/checkins`,
          { mood: 'happy' },
          userToken
        );

        expectError(response, 404);
      });
    });

    describe('業務邏輯錯誤 (ERR-4)', () => {
      it('ERR-4-a: 同一天重複打卡應返回錯誤', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          id: 1,
          external_id: practiceExternalId,
          user_id: userId,
          status: 'active',
          first_checkin_at: new Date(),
          deleted_at: null
        } as any);
        prismaMock.practice_checkins.findFirst.mockResolvedValue({
          id: 1,
          practice_id: 1,
          checkin_date: new Date()
        } as any);

        const response = await authPost(
          `${API_BASE}/${practiceExternalId}/checkins`,
          { mood: 'happy' },
          userToken
        );

        // ConflictError 返回 409
        expectError(response, 409);
      });

      it('ERR-4-b: 修改已鎖定欄位應返回錯誤', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          id: 1,
          external_id: practiceExternalId,
          user_id: userId,
          status: 'active',
          first_checkin_at: new Date(), // 已打卡
          deleted_at: null
        } as any);
        prismaMock.practice_checkins.count.mockResolvedValue(1);

        const response = await authPut(
          `${API_BASE}/${practiceExternalId}`,
          { startDate: '2025-03-01' },
          userToken
        );

        expectError(response, 400);
      });

      it('ERR-4-c: 對 completed 狀態打卡應返回錯誤', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          id: 1,
          external_id: practiceExternalId,
          user_id: userId,
          status: 'completed',
          first_checkin_at: new Date(),
          deleted_at: null
        } as any);

        const response = await authPost(
          `${API_BASE}/${practiceExternalId}/checkins`,
          { mood: 'happy' },
          userToken
        );

        // ConflictError 返回 409
        expectError(response, 409);
      });

      it('ERR-4-d: 重複封存應返回錯誤', async () => {
        prismaMock.practices.findUnique.mockResolvedValue({
          id: 1,
          external_id: practiceExternalId,
          user_id: userId,
          status: 'archived',
          deleted_at: null
        } as any);

        const response = await authPost(
          `${API_BASE}/${practiceExternalId}/archive`,
          undefined,
          userToken
        );

        // 服務層拋出的錯誤
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  // ==========================================================================
  // 測試情境 3: 邊界條件測試
  // ==========================================================================
  describe('邊界條件測試', () => {
    it('開始日期恰好為 14 天後應成功', async () => {
      const exactDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

      const mockCreatedPractice = {
        id: 1,
        external_id: practiceExternalId,
        user_id: userId,
        title: '測試實踐',
        start_date: new Date(exactDate),
        status: 'not_started',
        progress_percentage: createDecimalMock(20),
        theme_color: '#FCDD84',
        created_at: new Date(),
        updated_at: new Date(),
        users: {
          id: userId,
          external_id: 'user-uuid',
          nickname: 'Test',
          contacts: { photo_url: null },
          user_positions: []
        }
      };

      prismaMock.practices.count.mockResolvedValue(0); // For theme color assignment
      prismaMock.practices.create.mockResolvedValue(mockCreatedPractice as any);

      const response = await authPost(
        API_BASE,
        {
          title: '測試實踐',
          practiceAction: '測試',
          startDate: exactDate,
          durationDays: 14,
          frequencyMinDays: 4,
          frequencyMaxDays: 7
        },
        userToken
      );

      expectSuccess(response, 201);
    });

    it('note 欄位最大 500 字應驗證', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        id: 1,
        external_id: practiceExternalId,
        user_id: userId,
        status: 'active',
        first_checkin_at: new Date(),
        deleted_at: null
      } as any);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);

      // API 驗證規則：note 最大 500 字
      const longNote = 'a'.repeat(501);

      const response = await authPost(
        `${API_BASE}/${practiceExternalId}/checkins`,
        { mood: 'happy', note: longNote },
        userToken
      );

      expectError(response, 400);
    });

    it('imageUrls 最多 5 張應驗證', async () => {
      prismaMock.practices.findUnique.mockResolvedValue({
        id: 1,
        external_id: practiceExternalId,
        user_id: userId,
        status: 'active',
        first_checkin_at: new Date(),
        deleted_at: null
      } as any);
      prismaMock.practice_checkins.findFirst.mockResolvedValue(null);

      // API 驗證規則：imageUrls 最多 5 張
      const tooManyImages = [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
        'https://example.com/6.jpg'
      ];

      const response = await authPost(
        `${API_BASE}/${practiceExternalId}/checkins`,
        { mood: 'happy', imageUrls: tooManyImages },
        userToken
      );

      expectError(response, 400);
    });
  });
});
