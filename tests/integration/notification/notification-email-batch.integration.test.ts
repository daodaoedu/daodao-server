/**
 * Notification Email Batch Integration Tests
 *
 * 涵蓋範圍：
 * - 12.3 驗證 4 小時 Email 批次：不同時間點的事件在同一批次 email 中同時出現
 * - 12.4 驗證偏好設定即時生效：關閉 Reaction Email → 後續 Reaction 事件不進入 Email 批次
 * - 12.5 驗證退訂連結：點擊退訂連結 → 不需登入 → preferences 更新 → 下一批次不發送
 *
 * Regression tests included for each scenario.
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

jest.mock('@/queues/connection', () => ({
  getQueueConnection: jest.fn().mockReturnValue({}),
}));

jest.mock('@/queues/notification.queue', () => ({
  NOTIFICATION_EMAIL_QUEUE_NAME: 'notification-email',
}));

const mockSendEmail = jest.fn().mockResolvedValue({ success: true });

jest.mock('@/services/email/email.service', () => ({
  emailService: { sendEmail: mockSendEmail },
}));

jest.mock('@/services/email/notification-digest-template', () => ({
  generateNotificationDigestSubject: jest
    .fn()
    .mockReturnValue('【島島阿學】你的互動摘要'),
  generateNotificationDigestHtml: jest.fn().mockReturnValue('<html>digest</html>'),
}));

jest.mock('@/queues/social-notification.queue', () => ({
  enqueueSocialNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue(undefined),
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

// ─── 捕獲 email worker processor ─────────────────────────────────────────────

let capturedProcessor: ((job: { id: string }) => Promise<void>) | null = null;

const mockWorkerInstance = {
  on: jest.fn().mockReturnThis(),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(
    (_name: string, processor: (job: { id: string }) => Promise<void>) => {
      capturedProcessor = processor;
      return mockWorkerInstance;
    },
  ),
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-id' }),
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  })),
}));

import { createNotificationEmailWorker } from '@/queues/notification-email.worker';
import { notificationPreferenceService } from '@/services/notification-preference.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeJob = (id = 'batch-job-1') => ({ id });

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  id: Math.floor(Math.random() * 100000),
  type: 'Comment',
  actor_id: 10,
  recipient_id: 20,
  entity_type: 'practice',
  entity_id: 99,
  priority: 'P1' as const,
  payload: null,
  created_at: new Date(),
  processed_at: null,
  ...overrides,
});

const makeRecipient = (overrides: Record<string, unknown> = {}) => ({
  nickname: 'TestUser',
  contacts: { email: 'user@example.com' },
  ...overrides,
});

// ============================================================================
// Suite Setup
// ============================================================================

let app: Express.Application;

interface Express {
  Application: unknown;
}

describe('Notification Email Batch Integration Tests', () => {
  beforeAll(async () => {
    createNotificationEmailWorker();
    const { getTestApp } = await import('@tests/utils/test-app');
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ success: true });
  });

  // --------------------------------------------------------------------------
  // 12.3 驗證 4 小時 Email 批次
  // --------------------------------------------------------------------------

  describe('12.3 — 4 小時批次：不同時間點的事件在同一批次 email 同時出現', () => {
    beforeEach(() => {
      // 凍結時間至 2026-03-26T12:00:00Z，確保 09:15 與 11:30 的事件落在 4 小時視窗內
      jest.useFakeTimers({ now: new Date('2026-03-26T12:00:00Z') });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('09:15 的留言事件與 11:30 的按讚事件，在同一批次中一起送出', async () => {
      const commentAt0915 = makeEvent({
        id: 1,
        type: 'Comment',
        recipient_id: 20,
        priority: 'P1',
        created_at: new Date('2026-03-26T09:15:00Z'),
      });
      const reactionAt1130 = makeEvent({
        id: 2,
        type: 'Reaction',
        recipient_id: 20,
        priority: 'P2',
        created_at: new Date('2026-03-26T11:30:00Z'),
      });

      // 批次視窗涵蓋兩個事件（08:00–12:00）
      prismaMock.notification_events.findMany.mockResolvedValue([
        commentAt0915,
        reactionAt1130,
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      // 兩個事件都被包含，只發送一封 email
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: expect.any(String),
        html: expect.any(String),
      });
    });

    it('regression — 單一時間點的事件同樣正常發送', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ type: 'Comment', recipient_id: 20, priority: 'P1' }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it('同一批次中 P1 事件與 P2 事件分別呈現在 digest 中', async () => {
      const { generateNotificationDigestHtml } = await import(
        '@/services/email/notification-digest-template'
      );

      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ id: 1, type: 'Comment',  recipient_id: 20, priority: 'P1' }),
        makeEvent({ id: 2, type: 'Reaction', recipient_id: 20, priority: 'P2' }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      // generateNotificationDigestHtml 以含 p1Events 和 p2Events 的 data 呼叫
      const callData = (generateNotificationDigestHtml as jest.Mock).mock.calls[0][0];
      expect(callData.p1Events).toHaveLength(1);
      expect(callData.p2Events).toHaveLength(1);
      expect(callData.p1Events[0].type).toBe('Comment');
      expect(callData.p2Events[0].type).toBe('Reaction');
    });
  });

  // --------------------------------------------------------------------------
  // 12.4 驗證偏好設定即時生效
  // --------------------------------------------------------------------------

  describe('12.4 — 偏好設定即時生效：關閉 Reaction Email → 批次排除 Reaction 事件', () => {
    it('關閉 Reaction N01 偏好後，下一批次的 Reaction 事件不進入 email', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ type: 'Reaction', recipient_id: 20, priority: 'P2' }),
      ] as any);
      // DB 中 Reaction N01 is_enabled = false（模擬偏好設定已更新）
      prismaMock.notification_preferences.findMany.mockResolvedValue([
        { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
      ]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('只關閉 Reaction，Comment 仍正常發送', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ id: 1, type: 'Comment',  recipient_id: 20, priority: 'P1' }),
        makeEvent({ id: 2, type: 'Reaction', recipient_id: 20, priority: 'P2' }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([
        { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
      ]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      // 仍然發送（Comment 事件啟用）
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it('regression — 未設偏好時預設全部啟用', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ type: 'Reaction', recipient_id: 20 }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]); // 無記錄
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('notificationPreferenceService.updatePreference 呼叫後，DB 記錄即時反映在下一批次', async () => {
      // 模擬偏好已更新（is_enabled: false）
      prismaMock.notification_preferences.upsert.mockResolvedValue({
        id: 1,
        user_id: 20,
        notification_type: 'Reaction',
        channel: 'N01',
        is_enabled: false,
        updated_at: new Date(),
      } as any);

      // 更新偏好
      await notificationPreferenceService.updatePreference(20, 'Reaction', 'N01', false);
      expect(prismaMock.notification_preferences.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { is_enabled: false },
          where: expect.objectContaining({
            user_id_notification_type_channel: expect.objectContaining({
              user_id: 20,
              notification_type: 'Reaction',
              channel: 'N01',
            }),
          }),
        }),
      );

      // 下一批次：DB 回傳已停用的偏好
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ type: 'Reaction', recipient_id: 20 }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([
        { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
      ]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());
      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 12.5 驗證退訂連結
  // --------------------------------------------------------------------------

  describe('12.5 — 退訂連結：不需登入 → preferences 更新 → 下一批次不發送', () => {
    it('合法 token 退訂後回傳 200 HTML，且不需要登入', async () => {
      const { generateUnsubscribeToken } = await import(
        '@/services/notification-unsubscribe.service'
      );
      const token = generateUnsubscribeToken(20, 'Reaction');

      prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);

      const res = await request(app as any)
        .get('/api/v1/notifications/unsubscribe')
        .query({ token });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('已成功取消訂閱');
    });

    it('合法 token 退訂後 updatePreference 以 N01 is_enabled=false 呼叫', async () => {
      const { generateUnsubscribeToken } = await import(
        '@/services/notification-unsubscribe.service'
      );
      const token = generateUnsubscribeToken(20, 'Reaction');

      prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);

      await request(app as any)
        .get('/api/v1/notifications/unsubscribe')
        .query({ token });

      expect(prismaMock.notification_preferences.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { is_enabled: false },
          where: expect.objectContaining({
            user_id_notification_type_channel: expect.objectContaining({
              user_id: 20,
              notification_type: 'Reaction',
              channel: 'N01',
            }),
          }),
        }),
      );
    });

    it('digest type 退訂 → setGlobalEnabled(false) 被呼叫（所有 N01/N03 停用）', async () => {
      const { generateUnsubscribeToken } = await import(
        '@/services/notification-unsubscribe.service'
      );
      const token = generateUnsubscribeToken(20, 'digest');

      prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);
      prismaMock.$transaction.mockImplementation(async (ops: any) => {
        if (Array.isArray(ops)) return Promise.all(ops);
        return ops(prismaMock);
      });

      const res = await request(app as any)
        .get('/api/v1/notifications/unsubscribe')
        .query({ token });

      expect(res.status).toBe(200);
      // digest 退訂觸發 setGlobalEnabled → 16 types × 2 channels (N01, N03) = 32 次 upsert
      expect(prismaMock.notification_preferences.upsert).toHaveBeenCalledTimes(32);
    });

    it('無效 token 回傳 400 HTML 頁面', async () => {
      const res = await request(app as any)
        .get('/api/v1/notifications/unsubscribe')
        .query({ token: 'invalid-token' });

      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('退訂連結已過期');
    });

    it('token 缺失時回傳 400', async () => {
      const res = await request(app as any).get('/api/v1/notifications/unsubscribe');

      expect(res.status).toBe(400);
    });

    it('regression — 退訂後偏好 DB 已更新，下一批次不發送該類型 email', async () => {
      // 已更新偏好（is_enabled: false）
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ type: 'Reaction', recipient_id: 20 }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([
        { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
      ]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });
});
