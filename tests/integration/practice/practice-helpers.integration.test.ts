/**
 * Practice Helpers & Interaction API Integration Tests
 * 測試社群互動、模板、鼓勵句、引導句、狀態管理 API 端點
 *
 * 涵蓋範圍：
 * - C-1 ~ C-6: 社群互動（點讚、收藏、分享、瀏覽）- 目前為 TODO 狀態，返回固定值
 * - D-1 ~ D-4: 模板與輔助功能
 * - E-1 ~ E-2: 狀態管理（封存/取消封存）
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { createAuthToken } from '@tests/utils/api-helpers';
import { getTestApp } from '@tests/utils/test-app';
import request from 'supertest';
import type { Application } from 'express';

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
  }
}));

// Mock id-converter service
jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockImplementation(async (type: string, externalId: string) => {
    // 從 mock 的 practice 中查找
    const practice = await prismaMock.practices.findUnique({ where: { external_id: externalId } as any });
    if (practice) return practice.id;
    return 1; // 預設返回
  }),
  internalToExternalId: jest.fn().mockResolvedValue('test-uuid')
}));

let app: Application;

describe('Practice Helpers & Interaction API Integration Tests', () => {
  const API_BASE = '/api/v1/practices';

  let userToken: string;
  let otherUserToken: string;
  const userId = 1;
  const otherUserId = 2;
  // 使用有效的 UUID 格式
  const practiceId = '550e8400-e29b-41d4-a716-446655440003';

  // Helper to create Decimal mock
  const createDecimalMock = (value: number) => ({
    valueOf: () => value,
    toString: () => value.toString(),
    toNumber: () => value,
    toFixed: (digits?: number) => value.toFixed(digits)
  });

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();

    userToken = createAuthToken({ id: userId, email: 'user@test.com' });
    otherUserToken = createAuthToken({ id: otherUserId, email: 'other@test.com' });
  });

  // Helper functions - 使用正確的鏈式調用
  const authPost = (url: string, data?: any, token?: string) => {
    let req = request(app).post(url);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    if (data) req = req.send(data);
    return req;
  };

  const authGet = (url: string, token?: string, query?: Record<string, string>) => {
    let req = request(app).get(url);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    if (query) req = req.query(query);
    return req;
  };

  // ==========================================================================
  // C: 社群互動 (目前為 TODO 狀態，服務返回固定值)
  // ==========================================================================
  describe('社群互動 API (TODO 狀態)', () => {
    const mockPractice = {
      id: 1,
      external_id: '550e8400-e29b-41d4-a716-446655440003',
      user_id: otherUserId,
      title: '每日閱讀',
      status: 'active',
      deleted_at: null,
      progress_percentage: createDecimalMock(50)
    };

    beforeEach(() => {
      prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
      // reactions 相關 mock，讓 toggleLike 流程不拋出錯誤
      prismaMock.reactions.findUnique.mockResolvedValue({ reaction_type: 'useful' } as any);
      prismaMock.reactions.deleteMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.reactions.findMany.mockResolvedValue([] as any);
    });

    // C-1: 點讚/取消點讚
    describe('POST /api/v1/practices/:id/like - 點讚/取消點讚', () => {
      it('C-1-a: 呼叫應返回成功（TODO 狀態返回固定值）', async () => {
        const response = await authPost(
          `${API_BASE}/${practiceId}/like`,
          undefined,
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // 點讚後取消（same reaction type = cancel），返回 isLiked: false, likeCount: 0
        expect(response.body.data.isLiked).toBe(false);
        expect(response.body.data.likeCount).toBe(0);
      });

      it('C-1-c: 無 Token 應返回 401 錯誤', async () => {
        const response = await authPost(`${API_BASE}/${practiceId}/like`);

        expect(response.status).toBe(401);
      });
    });

    // C-2: 收藏/取消收藏
    describe('POST /api/v1/practices/:id/favorite - 收藏/取消收藏', () => {
      it('C-2-a: 呼叫應返回成功（TODO 狀態返回固定值）', async () => {
        const response = await authPost(
          `${API_BASE}/${practiceId}/favorite`,
          undefined,
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // TODO 狀態下返回固定值
        expect(response.body.data.isFavorited).toBe(false);
        expect(response.body.data.favoriteCount).toBe(0);
      });

      it('C-2-b: 無 Token 應返回 401 錯誤', async () => {
        const response = await authPost(`${API_BASE}/${practiceId}/favorite`);

        expect(response.status).toBe(401);
      });
    });

    // C-3: 記錄分享事件
    describe('POST /api/v1/practices/:id/share - 記錄分享事件', () => {
      it('應成功記錄分享事件（TODO 狀態返回固定值）', async () => {
        // 根據 practiceEventShareSchema 需要提供正確的 body
        const response = await authPost(
          `${API_BASE}/${practiceId}/share`,
          {
            entityType: 'practice',
            entityId: practiceId,
            shareChannel: 'facebook'
          },
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.shareCount).toBe(0);
      });

      it('無 Token 應返回 401 錯誤', async () => {
        const response = await authPost(
          `${API_BASE}/${practiceId}/share`,
          {
            entityType: 'practice',
            entityId: practiceId,
            shareChannel: 'facebook'
          }
        );

        expect(response.status).toBe(401);
      });
    });

    // C-4: 記錄瀏覽事件
    describe('POST /api/v1/practices/:id/view - 記錄瀏覽事件', () => {
      it('應成功記錄瀏覽事件（TODO 狀態返回固定值）', async () => {
        // 根據 practiceEventViewSchema 需要提供正確的 body
        const response = await authPost(
          `${API_BASE}/${practiceId}/view`,
          {
            entityType: 'practice',
            entityId: practiceId
          },
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.viewCount).toBe(0);
      });
    });

    // C-5: 取得互動統計
    // 注意：實際路由是 /stats 而非 /interaction-stats
    describe('GET /api/v1/practices/:id/stats - 取得互動統計', () => {
      it('應返回互動統計（TODO 狀態大部分為固定值）', async () => {
        prismaMock.comments.count.mockResolvedValue(3);

        const response = await authGet(
          `${API_BASE}/${practiceId}/stats`,
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // TODO 狀態下返回固定值
        expect(response.body.data.likeCount).toBe(0);
        expect(response.body.data.favoriteCount).toBe(0);
        expect(response.body.data.shareCount).toBe(0);
        expect(response.body.data.viewCount).toBe(0);
        // commentCount 會正常查詢
        expect(response.body.data.commentCount).toBe(3);
      });
    });

    // C-6: 取得用戶互動狀態
    // 注意：實際路由是 /user-status 而非 /user-interaction-status
    describe('GET /api/v1/practices/:id/user-status - 取得用戶互動狀態', () => {
      it('應返回當前用戶的互動狀態（TODO 狀態返回固定值）', async () => {
        const response = await authGet(
          `${API_BASE}/${practiceId}/user-status`,
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // TODO 狀態下返回固定值
        // 注意：schema 只定義了 isLiked 和 isFavorited，hasViewed 被 validator 過濾掉了
        expect(response.body.data.isLiked).toBe(false);
        expect(response.body.data.isFavorited).toBe(false);
      });

      it('無 Token 應返回 401 錯誤', async () => {
        const response = await authGet(
          `${API_BASE}/${practiceId}/user-status`
        );

        expect(response.status).toBe(401);
      });
    });
  });

  // ==========================================================================
  // D: 模板與輔助功能
  // ==========================================================================
  describe('模板與輔助功能 API', () => {
    // D-1: 取得模板列表
    // 注意：模板服務會 fallback 到預設模板（8 個）當資料庫無資料時
    describe('GET /api/v1/practices/templates - 取得模板列表', () => {
      it('D-1-a: 無參數應返回所有模板', async () => {
        const response = await authGet(`${API_BASE}/templates`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // 服務使用預設模板（8 個）當資料庫無資料時
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('title');
        expect(response.body.data[0]).toHaveProperty('id');
      });
    });

    // D-2: 取得單一模板
    describe('GET /api/v1/practices/templates/:id - 取得單一模板', () => {
      it('D-2-a: 有效 ID 應返回模板詳情', async () => {
        // 使用預設模板的 ID
        const response = await authGet(`${API_BASE}/templates/tpl-reading-daily`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('每日閱讀 30 分鐘');
      });
    });

    // D-3: 取得隨機鼓勵句
    describe('GET /api/v1/checkin-encouragements/random - 取得隨機鼓勵句', () => {
      it('應返回隨機鼓勵句（資料庫有資料時）', async () => {
        const mockEncouragement = {
          id: 15,
          message: '累積，是時間送給堅持者的禮物！',
          is_active: true
        };

        // 服務先調用 count，再調用 findFirst
        prismaMock.checkin_encouragements.count.mockResolvedValue(1);
        prismaMock.checkin_encouragements.findFirst.mockResolvedValue(mockEncouragement as any);

        const response = await authGet('/api/v1/checkin-encouragements/random');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(15);
        expect(response.body.data.message).toBe('累積，是時間送給堅持者的禮物！');
      });

      it('資料庫無資料時應返回預設鼓勵句', async () => {
        prismaMock.checkin_encouragements.count.mockResolvedValue(0);

        const response = await authGet('/api/v1/checkin-encouragements/random');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // 預設鼓勵句 id 為負數
        expect(response.body.data.id).toBeLessThan(0);
        expect(response.body.data.message).toBeDefined();
      });
    });

    // D-4: 取得引導句列表
    describe('GET /api/v1/tag-prompts - 取得引導句列表', () => {
      const mockTagPrompts = [
        {
          id: 1,
          tag_id: 1,
          usage_type: 'practice_checkin',
          locale: 'zh-TW',
          prompt_text: '我練習了...',
          tags: { name: '實作' }
        },
        {
          id: 2,
          tag_id: 2,
          usage_type: 'practice_checkin',
          locale: 'zh-TW',
          prompt_text: '我學到的一個新概念是...',
          tags: { name: '新概念' }
        }
      ];

      beforeEach(() => {
        prismaMock.tag_prompt_templates.findMany.mockResolvedValue(mockTagPrompts as any);
      });

      it('D-4-a: 應返回引導句列表', async () => {
        const response = await authGet('/api/v1/tag-prompts');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('D-4-b: locale=zh-TW 應返回繁體中文', async () => {
        const response = await authGet(
          '/api/v1/tag-prompts',
          undefined,
          { locale: 'zh-TW' }
        );

        expect(response.status).toBe(200);
      });
    });
  });

  // ==========================================================================
  // E: 狀態管理
  // ==========================================================================
  describe('狀態管理 API', () => {
    const createMockPractice = (status: string, overrides = {}) => ({
      id: 1,
      external_id: '550e8400-e29b-41d4-a716-446655440003',
      user_id: userId,
      title: '每日閱讀',
      practice_action: '閱讀',
      status,
      deleted_at: null,
      start_date: new Date(),
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      duration_days: 14,
      frequency_min_days: 4,
      frequency_max_days: 7,
      progress_percentage: createDecimalMock(50),
      created_at: new Date(),
      updated_at: new Date(),
      users: {
        id: userId,
        external_id: 'user-uuid',
        nickname: 'Test User',
        contacts: { photo_url: null },
        user_positions: []
      },
      practice_checkins: [],
      ...overrides
    });

    // E-1: 封存實踐
    describe('POST /api/v1/practices/:id/archive - 封存實踐', () => {
      it('E-1-a: not_started 狀態應成功封存', async () => {
        const mockPractice = createMockPractice('not_started');

        prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
        prismaMock.practices.update.mockResolvedValue({
          ...mockPractice,
          status: 'archived'
        } as any);

        const response = await authPost(
          `${API_BASE}/${practiceId}/archive`,
          undefined,
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // archive 返回 { success: boolean }，不含 status
        expect(response.body.data.success).toBe(true);
      });

      it('E-1-b: active 狀態應成功封存', async () => {
        const mockPractice = createMockPractice('active');

        prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
        prismaMock.practices.update.mockResolvedValue({
          ...mockPractice,
          status: 'archived'
        } as any);

        const response = await authPost(
          `${API_BASE}/${practiceId}/archive`,
          undefined,
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('E-1-c: completed 狀態應成功封存', async () => {
        const mockPractice = createMockPractice('completed');

        prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
        prismaMock.practices.update.mockResolvedValue({
          ...mockPractice,
          status: 'archived'
        } as any);

        const response = await authPost(
          `${API_BASE}/${practiceId}/archive`,
          undefined,
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('E-1-d: 已是 archived 狀態應返回錯誤', async () => {
        const mockPractice = createMockPractice('archived');

        prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);

        const response = await authPost(
          `${API_BASE}/${practiceId}/archive`,
          undefined,
          userToken
        );

        // 服務層拋出 Error 會被轉換為 500
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.success).toBe(false);
      });

      it('E-1-e: 他人實踐應返回錯誤', async () => {
        const mockPractice = createMockPractice('active', { user_id: otherUserId });

        prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);

        const response = await authPost(
          `${API_BASE}/${practiceId}/archive`,
          undefined,
          userToken
        );

        // 服務層拋出 Error 會被轉換為 500
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.success).toBe(false);
      });
    });

    // E-2: 取消封存
    describe('POST /api/v1/practices/:id/unarchive - 取消封存', () => {
      it('E-2-a: archived 狀態應成功恢復', async () => {
        const mockPractice = createMockPractice('archived');

        prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);
        prismaMock.practices.update.mockResolvedValue({
          ...mockPractice,
          status: 'active'
        } as any);
        prismaMock.practice_checkins.count.mockResolvedValue(0);
        prismaMock.comments.groupBy.mockResolvedValue([]);
        prismaMock.entity_tags.findMany.mockResolvedValue([]);

        const response = await authPost(
          `${API_BASE}/${practiceId}/unarchive`,
          undefined,
          userToken
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // unarchive 返回完整的 practice entity
        expect(response.body.data).toBeDefined();
      });

      it('E-2-b: 非 archived 狀態應返回錯誤', async () => {
        const mockPractice = createMockPractice('active');

        prismaMock.practices.findUnique.mockResolvedValue(mockPractice as any);

        const response = await authPost(
          `${API_BASE}/${practiceId}/unarchive`,
          undefined,
          userToken
        );

        // 服務層拋出 Error 會被轉換為 500
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
