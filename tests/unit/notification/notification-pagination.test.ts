/**
 * 通知系統：API 分頁測試（12.10）與 Reaction emoji 修正迴歸測試
 *
 * 涵蓋範圍：
 * - 12.10 驗證通知中心分頁：
 *   - API 預設回傳 20 筆
 *   - cursor 帶入後回傳下一頁
 *   - P1 通知置頂排序
 *   - unreadCount 正確回傳
 */

import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/services/notification-preference.service', () => ({
  notificationPreferenceService: {
    getPreferences:    jest.fn(),
    updatePreference:  jest.fn(),
    setGlobalEnabled:  jest.fn(),
  },
}));

jest.mock('@/services/notification-unsubscribe.service', () => ({
  verifyUnsubscribeToken: jest.fn(),
}));

jest.mock('@/utils/response-helper', () => ({
  createSuccessResponse: jest.fn().mockImplementation((data: unknown) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  })),
}));

jest.mock('@/middleware/error.middleware', () => {
  class UnauthorizedError extends Error {
    constructor(msg: string) { super(msg); this.name = 'UnauthorizedError'; }
  }
  class BadRequestError extends Error {
    constructor(msg: string) { super(msg); this.name = 'BadRequestError'; }
  }
  class NotFoundError extends Error {
    constructor(msg: string) { super(msg); this.name = 'NotFoundError'; }
  }

  const asyncHandler = (fn: Function) => fn; // 在測試中直接呼叫 handler

  return { asyncHandler, UnauthorizedError, BadRequestError, NotFoundError };
});

import { getNotifications } from '@/controllers/notification.controller';
import type { Request, Response } from 'express';

// ============================================================================
// Helpers
// ============================================================================

/**
 * 建立 mock notification 資料行
 */
const makeNotificationRow = (overrides: Record<string, unknown> = {}) => ({
  id:                Math.floor(Math.random() * 100_000),
  type:              'comment',
  entity_type:       'practice',
  entity_id:         10,
  priority:          'P2',
  is_read:           false,
  aggregation_key:   null,
  aggregation_count: 1,
  payload:           null,
  created_at:        new Date('2025-01-01T10:00:00Z'),
  actor: {
    external_id: 'actor-ext-1',
    nickname:    '用戶A',
    contacts:    { photo_url: null },
  },
  ...overrides,
});

/**
 * 建立 N 筆通知資料
 */
const makeRows = (count: number, overrides: Record<string, unknown> = {}) =>
  Array.from({ length: count }, (_, i) =>
    makeNotificationRow({ id: i + 1, ...overrides }),
  );

/**
 * 建立 mock Request / Response / next
 */
const makeReqRes = (
  userId: number,
  query: Record<string, string> = {},
) => {
  const req = {
    user:  { id: userId },
    query,
    params: {},
  } as unknown as Request;

  const jsonMock = jest.fn();
  const res = {
    json: jsonMock,
    status: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next = jest.fn();

  return { req, res, jsonMock, next };
};

/**
 * 呼叫 handler（透過 asyncHandler mock 直接呼叫原始 async fn）
 */
const callHandler = async (
  handler: Function,
  req: Request,
  res: Response,
  next = jest.fn(),
) => {
  // asyncHandler mock 返回 fn 本身，所以直接以 (req, res, next) 呼叫
  return handler(req, res, next);
};

// ============================================================================
// 12.10 通知中心分頁
// ============================================================================

describe('12.10 通知中心分頁：GET /api/v1/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 預設 20 筆
  // --------------------------------------------------------------------------

  describe('預設回傳 20 筆', () => {
    it('不帶 limit 參數時預設查詢 21 筆（limit+1，用於判斷 hasNext）', async () => {
      prismaMock.notifications.findMany.mockResolvedValue(makeRows(20) as any);
      prismaMock.notifications.count.mockResolvedValue(5);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const findManyCall = prismaMock.notifications.findMany.mock.calls[0][0] as any;
      expect(findManyCall.take).toBe(21); // 預設 limit=20，查 21 筆
    });

    it('回傳 20 筆時 items 長度為 20', async () => {
      prismaMock.notifications.findMany.mockResolvedValue(makeRows(20) as any);
      prismaMock.notifications.count.mockResolvedValue(3);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res, jsonMock } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const resp = jsonMock.mock.calls[0][0] as any;
      expect(resp.data.notifications).toHaveLength(20);
    });

    it('剛好 20 筆時 nextCursor 為 null（無下一頁）', async () => {
      prismaMock.notifications.findMany.mockResolvedValue(makeRows(20) as any);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res, jsonMock } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const resp = jsonMock.mock.calls[0][0] as any;
      expect(resp.data.nextCursor).toBeNull();
    });

    it('有第 21 筆時 nextCursor 不為 null（有下一頁）', async () => {
      // 回傳 21 筆（limit+1），代表有下一頁
      prismaMock.notifications.findMany.mockResolvedValue(makeRows(21) as any);
      prismaMock.notifications.count.mockResolvedValue(5);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res, jsonMock } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const resp = jsonMock.mock.calls[0][0] as any;
      expect(resp.data.nextCursor).not.toBeNull();
      // items 仍然只有 20 筆
      expect(resp.data.notifications).toHaveLength(20);
    });
  });

  // --------------------------------------------------------------------------
  // cursor 帶入後回傳下一頁
  // --------------------------------------------------------------------------

  describe('cursor 帶入後回傳下一頁', () => {
    it('帶入有效 cursor 後查詢加入 AND 條件（用於分頁過濾）', async () => {
      const lastNotification = makeNotificationRow({
        id:         50,
        priority:   'P1',
        created_at: new Date('2025-01-01T12:00:00Z'),
      });
      const cursor = Buffer.from(
        JSON.stringify({ p: 'P1', c: '2025-01-01T12:00:00.000Z', id: 50 }),
      ).toString('base64');

      prismaMock.notifications.findMany.mockResolvedValue([lastNotification] as any);
      prismaMock.notifications.count.mockResolvedValue(2);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res } = makeReqRes(1, { cursor });
      await callHandler(getNotifications, req, res);

      const findManyCall = prismaMock.notifications.findMany.mock.calls[0][0] as any;
      // cursor 解析後應在 where 條件中加入 AND
      expect(findManyCall.where.AND).toBeDefined();
      expect(Array.isArray(findManyCall.where.AND)).toBe(true);
    });

    it('cursor 帶入後第二頁 items 正確回傳', async () => {
      const secondPageRows = makeRows(5);
      const cursor = Buffer.from(
        JSON.stringify({ p: 'P2', c: '2025-01-01T10:00:00.000Z', id: 20 }),
      ).toString('base64');

      prismaMock.notifications.findMany.mockResolvedValue(secondPageRows as any);
      prismaMock.notifications.count.mockResolvedValue(1);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res, jsonMock } = makeReqRes(1, { cursor });
      await callHandler(getNotifications, req, res);

      const resp = jsonMock.mock.calls[0][0] as any;
      expect(resp.data.notifications).toHaveLength(5);
      expect(resp.data.nextCursor).toBeNull(); // 5 筆 < 20，無下一頁
    });

    it('cursor 格式無效時拋出 BadRequestError', async () => {
      const { req, res } = makeReqRes(1, { cursor: 'not-valid-base64-json!!' });

      await expect(callHandler(getNotifications, req, res)).rejects.toThrow('Invalid cursor');
    });

    it('nextCursor 是 base64 編碼的 JSON，包含 p、c、id 欄位', async () => {
      prismaMock.notifications.findMany.mockResolvedValue(makeRows(21) as any); // 有下一頁
      prismaMock.notifications.count.mockResolvedValue(3);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res, jsonMock } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const resp = jsonMock.mock.calls[0][0] as any;
      const rawCursor = Buffer.from(resp.data.nextCursor, 'base64').toString();
      const parsed = JSON.parse(rawCursor);

      expect(parsed).toHaveProperty('p');  // priority
      expect(parsed).toHaveProperty('c');  // created_at ISO string
      expect(parsed).toHaveProperty('id'); // notification id
    });
  });

  // --------------------------------------------------------------------------
  // P1 通知置頂排序
  // --------------------------------------------------------------------------

  describe('P1 通知置頂排序', () => {
    it('orderBy 包含 priority asc（P1 < P2，P1 優先顯示）', async () => {
      prismaMock.notifications.findMany.mockResolvedValue([]);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const findManyCall = prismaMock.notifications.findMany.mock.calls[0][0] as any;
      const orderBy = findManyCall.orderBy as any[];

      // 第一排序：priority asc
      expect(orderBy[0]).toEqual({ priority: 'asc' });
    });

    it('orderBy 第二層為 created_at desc（新通知在前）', async () => {
      prismaMock.notifications.findMany.mockResolvedValue([]);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const findManyCall = prismaMock.notifications.findMany.mock.calls[0][0] as any;
      const orderBy = findManyCall.orderBy as any[];

      expect(orderBy[1]).toEqual({ created_at: 'desc' });
    });

    it('P1 通知排在 P2 通知之前（字母升冪：P1 < P2）', async () => {
      // P1 和 P2 混合的 21 筆資料，P1 在前
      const rows = [
        ...makeRows(3, { priority: 'P1' }),
        ...makeRows(18, { priority: 'P2' }),
      ];
      prismaMock.notifications.findMany.mockResolvedValue(rows as any);
      prismaMock.notifications.count.mockResolvedValue(2);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res, jsonMock } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const resp = jsonMock.mock.calls[0][0] as any;
      // 前三筆應為 P1
      const first3Priorities = resp.data.notifications.slice(0, 3).map((n: any) => n.priority);
      expect(first3Priorities.every((p: string) => p === 'P1')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // unreadCount 正確
  // --------------------------------------------------------------------------

  describe('unreadCount 正確回傳', () => {
    it('回傳格式含 unreadCount 欄位', async () => {
      prismaMock.notifications.findMany.mockResolvedValue(makeRows(5) as any);
      prismaMock.notifications.count.mockResolvedValue(7);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res, jsonMock } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const resp = jsonMock.mock.calls[0][0] as any;
      expect(resp.data).toHaveProperty('unreadCount');
      expect(resp.data.unreadCount).toBe(7);
    });

    it('count 查詢條件包含 is_read: false 與正確 recipient_id', async () => {
      prismaMock.notifications.findMany.mockResolvedValue([]);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res } = makeReqRes(42);
      await callHandler(getNotifications, req, res);

      const countCall = prismaMock.notifications.count.mock.calls[0][0] as any;
      expect(countCall.where).toMatchObject({
        recipient_id: 42,
        is_read:      false,
      });
    });

    it('unreadCount 不受 cursor 分頁影響（始終回傳全量未讀數）', async () => {
      const cursor = Buffer.from(
        JSON.stringify({ p: 'P2', c: '2025-01-01T10:00:00.000Z', id: 10 }),
      ).toString('base64');

      prismaMock.notifications.findMany.mockResolvedValue(makeRows(3) as any);
      prismaMock.notifications.count.mockResolvedValue(15); // 全量未讀
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res, jsonMock } = makeReqRes(1, { cursor });
      await callHandler(getNotifications, req, res);

      const resp = jsonMock.mock.calls[0][0] as any;
      // unreadCount 應為全量 15，而非當前分頁的數量
      expect(resp.data.unreadCount).toBe(15);
    });

    it('全部已讀時 unreadCount 為 0', async () => {
      prismaMock.notifications.findMany.mockResolvedValue(makeRows(3) as any);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res, jsonMock } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const resp = jsonMock.mock.calls[0][0] as any;
      expect(resp.data.unreadCount).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 回應格式
  // --------------------------------------------------------------------------

  describe('回應格式', () => {
    it('回應格式包含 notifications、nextCursor、unreadCount', async () => {
      prismaMock.notifications.findMany.mockResolvedValue(makeRows(3) as any);
      prismaMock.notifications.count.mockResolvedValue(1);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res, jsonMock } = makeReqRes(1);
      await callHandler(getNotifications, req, res);

      const resp = jsonMock.mock.calls[0][0] as any;
      expect(resp.success).toBe(true);
      expect(resp.data).toHaveProperty('notifications');
      expect(resp.data).toHaveProperty('nextCursor');
      expect(resp.data).toHaveProperty('unreadCount');
    });

    it('未登入時拋出 UnauthorizedError', async () => {
      const req = { user: undefined, query: {}, params: {} } as unknown as Request;
      const res = { json: jest.fn() } as unknown as Response;

      await expect(callHandler(getNotifications, req, res)).rejects.toThrow('需要登入');
    });

    it('查詢條件包含 recipient_id = 當前用戶 id', async () => {
      prismaMock.notifications.findMany.mockResolvedValue([]);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const { req, res } = makeReqRes(99);
      await callHandler(getNotifications, req, res);

      const findManyCall = prismaMock.notifications.findMany.mock.calls[0][0] as any;
      expect(findManyCall.where.recipient_id).toBe(99);
    });
  });
});

// ============================================================================
// Regression: reaction notification API response 包含正確的 reactionType
// ============================================================================

describe('Regression: reaction 通知 API response 包含 reactionType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('payload 中的 reactionType（encourage）應出現在 API response', async () => {
    prismaMock.notifications.findMany.mockResolvedValue([
      makeNotificationRow({
        id: 1,
        type: 'PracticeReaction',
        entity_type: 'practice',
        payload: { reactionType: 'encourage', practice_title: '書摘記錄', entity_external_id: 'ext-1' },
      }),
    ] as any);
    prismaMock.notifications.count.mockResolvedValue(0);
    prismaMock.practices.findMany.mockResolvedValue([]);

    const { req, res, jsonMock } = makeReqRes(1);
    await callHandler(getNotifications, req, res);

    const resp = jsonMock.mock.calls[0][0] as any;
    const notification = resp.data.notifications[0];
    expect(notification.reactionType).toBe('encourage');
  });

  it('payload 中的 reactionType（fire）應出現在 API response', async () => {
    prismaMock.notifications.findMany.mockResolvedValue([
      makeNotificationRow({
        id: 2,
        type: 'PracticeReaction',
        entity_type: 'practice',
        payload: { reactionType: 'fire', practice_title: '書摘記錄', entity_external_id: 'ext-2' },
      }),
    ] as any);
    prismaMock.notifications.count.mockResolvedValue(0);
    prismaMock.practices.findMany.mockResolvedValue([]);

    const { req, res, jsonMock } = makeReqRes(1);
    await callHandler(getNotifications, req, res);

    const resp = jsonMock.mock.calls[0][0] as any;
    const notification = resp.data.notifications[0];
    expect(notification.reactionType).toBe('fire');
  });

  it('非 reaction 通知（留言）不應包含 reactionType', async () => {
    prismaMock.notifications.findMany.mockResolvedValue([
      makeNotificationRow({
        id: 3,
        type: 'comment',
        payload: { content: '很棒的實踐！', practice_title: '書摘記錄' },
      }),
    ] as any);
    prismaMock.notifications.count.mockResolvedValue(0);
    prismaMock.practices.findMany.mockResolvedValue([]);

    const { req, res, jsonMock } = makeReqRes(1);
    await callHandler(getNotifications, req, res);

    const resp = jsonMock.mock.calls[0][0] as any;
    const notification = resp.data.notifications[0];
    expect(notification.reactionType).toBeUndefined();
  });
});
