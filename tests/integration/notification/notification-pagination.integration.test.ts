/**
 * Notification Pagination Integration Tests
 *
 * 涵蓋範圍（12.10）：
 * - 驗證通知中心 GET /api/v1/notifications 預設回傳 20 筆
 * - 驗證帶 cursor 參數後回傳下一頁
 * - 驗證 P1 通知置頂排序（P1 排在 P2 之前）
 * - 驗證 unreadCount 正確
 * - Regression tests for each scenario
 */

import { prismaMock } from '@tests/utils/prisma-mock';
import { createAuthToken, expectSuccess, expectError } from '@tests/utils/api-helpers';
import request from 'supertest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

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

jest.mock('@/queues/social-notification.queue', () => ({
  enqueueSocialNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue({ id: 'job-id' }),
}));

jest.mock('@/queues/practice-email.queue', () => ({
  practiceEmailQueue: { add: jest.fn().mockResolvedValue({ id: 'job-id' }) },
  enqueuePracticeEmail: jest.fn().mockResolvedValue({ id: 'job-id' }),
}));

jest.mock('@/services/notification-event.service', () => ({
  notificationEventService: { createEvent: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockResolvedValue(1),
  internalToExternalId: jest.fn().mockResolvedValue('ext-1'),
  getTargetEntity: jest.fn().mockResolvedValue({ id: 1, user_id: 2 }),
  default: {
    getTargetEntity: jest.fn().mockResolvedValue({ id: 1, user_id: 2 }),
  },
}));

jest.mock('@/services/interaction-count.service', () => ({
  interactionCountService: {
    hasFamiliarityBypass: jest.fn().mockResolvedValue(true),
    getCount: jest.fn().mockResolvedValue(0),
    increment: jest.fn().mockResolvedValue(undefined),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_DATE = new Date('2023-01-01T12:00:00.000Z');

const USER_ID = 5;
const USER_TOKEN = createAuthToken({ id: USER_ID, email: 'notify@test.com' });

const makeActor = (overrides: Record<string, unknown> = {}) => ({
  external_id: 'ext-actor-1',
  nickname: 'ActorUser',
  contacts: { photo_url: null },
  ...overrides,
});

const makeNotification = (overrides: Record<string, unknown> = {}) => ({
  id: Math.floor(Math.random() * 100000),
  type: 'Comment',
  entity_type: 'practice',
  entity_id: 10,
  priority: 'P1',
  is_read: false,
  aggregation_key: null,
  aggregation_count: 1,
  payload: null,
  created_at: FIXED_DATE,
  actor: makeActor(),
  ...overrides,
});

/**
 * 產生 N 筆假通知（依 id 遞減排序，模擬 DB 查詢結果）
 */
const makeNotifications = (
  count: number,
  baseOverrides: Record<string, unknown> = {},
) =>
  Array.from({ length: count }, (_, i) =>
    makeNotification({ id: 1000 - i, ...baseOverrides }),
  );

/**
 * 產生 cursor base64 字串（模擬 nextCursor）
 */
const encodeCursor = (priority: string, createdAt: Date, id: number): string =>
  Buffer.from(JSON.stringify({ p: priority, c: createdAt.toISOString(), id })).toString(
    'base64',
  );

// ============================================================================
// Suite Setup
// ============================================================================

let app: unknown;

describe('Notification Pagination Integration Tests (12.10)', () => {
  beforeAll(async () => {
    const { getTestApp } = await import('@tests/utils/test-app');
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 預設回傳 20 筆
  // --------------------------------------------------------------------------

  describe('預設回傳 20 筆', () => {
    it('無 limit 參數時，API 回傳 20 筆通知', async () => {
      const rows = makeNotifications(20);
      prismaMock.notifications.findMany.mockResolvedValue(rows as any);
      prismaMock.notifications.count.mockResolvedValue(3);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const data = expectSuccess(res, 200);
      expect(data.notifications).toHaveLength(20);
    });

    it('API 查詢 DB 時 take = 21（limit+1，用於判斷下一頁）', async () => {
      prismaMock.notifications.findMany.mockResolvedValue(makeNotifications(20) as any);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const callArg = (prismaMock.notifications.findMany.mock.calls[0] as any)[0];
      expect(callArg.take).toBe(21); // 20 + 1
    });

    it('regression — 回傳筆數不超過 limit', async () => {
      const rows = makeNotifications(5);
      prismaMock.notifications.findMany.mockResolvedValue(rows as any);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const data = expectSuccess(res, 200);
      expect(data.notifications).toHaveLength(5);
    });

    it('無更多資料時 nextCursor 為 null', async () => {
      prismaMock.notifications.findMany.mockResolvedValue(makeNotifications(5) as any);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const data = expectSuccess(res, 200);
      expect(data.nextCursor).toBeNull();
    });

    it('有更多資料時 nextCursor 不為 null', async () => {
      // 返回 21 筆，表示有下一頁
      prismaMock.notifications.findMany.mockResolvedValue(makeNotifications(21) as any);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const data = expectSuccess(res, 200);
      expect(data.nextCursor).not.toBeNull();
      expect(typeof data.nextCursor).toBe('string');
      // 實際回傳仍為 20 筆
      expect(data.notifications).toHaveLength(20);
    });
  });

  // --------------------------------------------------------------------------
  // cursor 分頁
  // --------------------------------------------------------------------------

  describe('cursor 分頁：帶入 cursor 後回傳下一頁', () => {
    it('帶入合法 cursor 時，查詢條件包含 AND 過濾（不重複第一頁）', async () => {
      const lastNotif = makeNotification({ id: 980, priority: 'P1', created_at: FIXED_DATE });
      const cursor = encodeCursor(
        lastNotif.priority as string,
        lastNotif.created_at as Date,
        lastNotif.id as number,
      );

      prismaMock.notifications.findMany.mockResolvedValue(makeNotifications(5) as any);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`)
        .query({ cursor });

      const callArg = (prismaMock.notifications.findMany.mock.calls[0] as any)[0];
      // cursor 解析後應包含 AND 條件
      expect(callArg.where.AND).toBeDefined();
      expect(callArg.where.AND).toHaveLength(1);
    });

    it('帶入合法 cursor 後正常回傳下一頁資料', async () => {
      const page2 = makeNotifications(10, { id: 500, priority: 'P2' });
      const cursor = encodeCursor('P1', FIXED_DATE, 980);

      prismaMock.notifications.findMany.mockResolvedValue(page2 as any);
      prismaMock.notifications.count.mockResolvedValue(2);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`)
        .query({ cursor });

      const data = expectSuccess(res, 200);
      expect(data.notifications).toHaveLength(10);
    });

    it('無效 cursor 回傳 400', async () => {
      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`)
        .query({ cursor: 'not-valid-base64-json' });

      expectError(res, 400);
    });

    it('regression — 第一頁不帶 cursor 時查詢無 AND 條件', async () => {
      prismaMock.notifications.findMany.mockResolvedValue(makeNotifications(3) as any);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const callArg = (prismaMock.notifications.findMany.mock.calls[0] as any)[0];
      expect(callArg.where.AND).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // P1 通知置頂排序
  // --------------------------------------------------------------------------

  describe('P1 通知置頂排序', () => {
    it('DB 查詢 orderBy 第一條件為 priority asc（P1 < P2 字母序）', async () => {
      prismaMock.notifications.findMany.mockResolvedValue([]);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const callArg = (prismaMock.notifications.findMany.mock.calls[0] as any)[0];
      expect(callArg.orderBy[0]).toEqual({ priority: 'asc' });
    });

    it('orderBy 第二條件為 created_at desc', async () => {
      prismaMock.notifications.findMany.mockResolvedValue([]);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const callArg = (prismaMock.notifications.findMany.mock.calls[0] as any)[0];
      expect(callArg.orderBy[1]).toEqual({ created_at: 'desc' });
    });

    it('回傳結果中 P1 通知出現在 P2 通知之前', async () => {
      const p2Notif = makeNotification({ id: 200, priority: 'P2', type: 'Reaction' });
      const p1Notif = makeNotification({ id: 100, priority: 'P1', type: 'Comment' });
      // DB 已排序後的結果（P1 先於 P2）
      prismaMock.notifications.findMany.mockResolvedValue([p1Notif, p2Notif] as any);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const data = expectSuccess(res, 200);
      expect(data.notifications[0].priority).toBe('P1');
      expect(data.notifications[1].priority).toBe('P2');
    });

    it('regression — 排序 tiebreaker 為 id desc', async () => {
      prismaMock.notifications.findMany.mockResolvedValue([]);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const callArg = (prismaMock.notifications.findMany.mock.calls[0] as any)[0];
      expect(callArg.orderBy[2]).toEqual({ id: 'desc' });
    });
  });

  // --------------------------------------------------------------------------
  // unreadCount 正確
  // --------------------------------------------------------------------------

  describe('unreadCount 正確', () => {
    it('回傳值中包含 unreadCount 欄位', async () => {
      prismaMock.notifications.findMany.mockResolvedValue([]);
      prismaMock.notifications.count.mockResolvedValue(7);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const data = expectSuccess(res, 200);
      expect(data.unreadCount).toBe(7);
    });

    it('count 查詢條件為 recipient_id + is_read=false', async () => {
      prismaMock.notifications.findMany.mockResolvedValue([]);
      prismaMock.notifications.count.mockResolvedValue(3);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const countArg = (prismaMock.notifications.count.mock.calls[0] as any)[0];
      expect(countArg.where.recipient_id).toBe(USER_ID);
      expect(countArg.where.is_read).toBe(false);
    });

    it('unreadCount = 0 時正確回傳 0', async () => {
      prismaMock.notifications.findMany.mockResolvedValue([]);
      prismaMock.notifications.count.mockResolvedValue(0);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const data = expectSuccess(res, 200);
      expect(data.unreadCount).toBe(0);
    });

    it('unreadCount 不受 cursor 分頁影響（全量統計）', async () => {
      const cursor = encodeCursor('P1', new Date(), 999);

      prismaMock.notifications.findMany.mockResolvedValue(makeNotifications(5) as any);
      prismaMock.notifications.count.mockResolvedValue(25);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`)
        .query({ cursor });

      const data = expectSuccess(res, 200);
      // 分頁後只有 5 筆，但 unreadCount 仍反映全量未讀數
      expect(data.unreadCount).toBe(25);
    });

    it('regression — 有已讀通知時 unreadCount 不計入已讀', async () => {
      const notifs = [
        makeNotification({ is_read: false }),
        makeNotification({ is_read: true }),
      ];
      prismaMock.notifications.findMany.mockResolvedValue(notifs as any);
      // count 只計算 is_read=false
      prismaMock.notifications.count.mockResolvedValue(1);
      prismaMock.practices.findMany.mockResolvedValue([]);

      const res = await request(app as any)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${USER_TOKEN}`);

      const data = expectSuccess(res, 200);
      expect(data.unreadCount).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 認證
  // --------------------------------------------------------------------------

  describe('認證', () => {
    it('未帶 token 時回傳 401', async () => {
      const res = await request(app as any).get('/api/v1/notifications');
      expectError(res, 401);
    });
  });
});
