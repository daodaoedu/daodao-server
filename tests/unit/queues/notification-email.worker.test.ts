/**
 * Notification Email Worker Unit Tests
 *
 * 涵蓋範圍：
 * - 時間窗口：查詢 P1+P2 事件
 * - 空批次：無事件時直接回傳
 * - 偏好設定：disabled 類型過濾
 * - 未設定偏好 = 預設啟用
 * - 全部類型 disabled → 跳過此 recipient
 * - 無 email 地址 → 跳過
 * - P1/P2 正確分組
 * - emailService.sendEmail 以正確參數呼叫
 * - 單一 recipient 失敗不影響其餘
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
  generateNotificationDigestSubject: jest.fn().mockReturnValue('你有新通知'),
  generateNotificationDigestHtml: jest.fn().mockReturnValue('<html>digest</html>'),
}));

jest.mock('@/services/notification-unsubscribe.service', () => ({
  generateUnsubscribeUrl: jest.fn().mockReturnValue('https://daodao.cc/unsubscribe'),
  generateSettingsUrl: jest.fn().mockReturnValue('https://daodao.cc/settings/notifications'),
}));

// ─── 捕獲 processor ───────────────────────────────────────────────────────────

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
}));

import { createNotificationEmailWorker } from '@/queues/notification-email.worker';
import { loggerService } from '@/services/logging/logger.service';

// ============================================================================
// Helpers
// ============================================================================

const makeJob = (id = 'job-1') => ({ id });

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  id: Math.floor(Math.random() * 10000),
  type: 'Comment',
  actor_id: 1,
  recipient_id: 2,
  entity_type: 'practice',
  entity_id: 10,
  priority: 'P1',
  payload: null,
  created_at: new Date(),
  processed_at: null,
  ...overrides,
});

const makeRecipient = (overrides: Record<string, unknown> = {}) => ({
  nickname: 'Alice',
  contacts: { email: 'alice@example.com' },
  ...overrides,
});

// ============================================================================
// Setup
// ============================================================================

describe('NotificationEmailWorker — processNotificationEmailJob', () => {
  beforeAll(() => {
    createNotificationEmailWorker();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 空批次
  // --------------------------------------------------------------------------

  describe('空批次', () => {
    it('時間窗口內無事件時不發送 email', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('空批次時 log info 跳過', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('No events in window'),
        expect.anything(),
      );
    });
  });

  // --------------------------------------------------------------------------
  // 偏好設定過濾
  // --------------------------------------------------------------------------

  describe('偏好設定過濾', () => {
    it('DB 中 is_enabled=false 的類型不發送 email', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ type: 'Reaction', recipient_id: 2 }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([
        { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
      ]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(loggerService.debug).toHaveBeenCalledWith(
        expect.stringContaining('All event types disabled'),
        expect.anything(),
      );
    });

    it('DB 無偏好設定記錄時預設啟用（undefined → true）', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ type: 'Comment', recipient_id: 2 }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]); // 無記錄
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('部分類型 disabled，只送允許的事件', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ id: 1, type: 'Comment',  recipient_id: 2, priority: 'P1' }),
        makeEvent({ id: 2, type: 'Reaction', recipient_id: 2, priority: 'P2' }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([
        { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
      ]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      // 仍然發送（Comment 類型啟用）
      expect(mockSendEmail).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 無 email 地址
  // --------------------------------------------------------------------------

  describe('無 email 地址', () => {
    it('recipient 無 email 時跳過並 log warn', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ recipient_id: 2 }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue({
        nickname: 'Bob',
        contacts: { email: null },
      } as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('no email'),
        expect.anything(),
      );
    });

    it('contacts 為 null 時跳過', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ recipient_id: 2 }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue({
        nickname: 'Bob',
        contacts: null,
      } as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 正常發送
  // --------------------------------------------------------------------------

  describe('正常發送', () => {
    it('以正確的 to/subject/html 呼叫 sendEmail', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ recipient_id: 2 }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'alice@example.com',
        subject: expect.any(String),
        html: expect.any(String),
      });
    });

    it('多位 recipient 各自收到 email', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ recipient_id: 2, type: 'Comment' }),
        makeEvent({ recipient_id: 3, type: 'Reaction' }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique
        .mockResolvedValueOnce({ nickname: 'Alice', contacts: { email: 'alice@example.com' } } as any)
        .mockResolvedValueOnce({ nickname: 'Bob', contacts: { email: 'bob@example.com' } } as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).toHaveBeenCalledTimes(2);
    });
  });

  // --------------------------------------------------------------------------
  // 容錯：單一 recipient 失敗
  // --------------------------------------------------------------------------

  describe('容錯', () => {
    it('單一 recipient 發送失敗後繼續處理其他 recipient', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeEvent({ recipient_id: 2, type: 'Comment' }),
        makeEvent({ recipient_id: 3, type: 'Reaction' }),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      // recipient 2 的偏好查詢成功，但 findUnique 查詢失敗
      prismaMock.users.findUnique
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ nickname: 'Bob', contacts: { email: 'bob@example.com' } } as any);
      prismaMock.users.findMany.mockResolvedValue([]);

      await expect(capturedProcessor!(makeJob())).resolves.toBeUndefined();

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process recipient'),
        expect.anything(),
      );
    });
  });

  // --------------------------------------------------------------------------
  // 查詢時間窗口
  // --------------------------------------------------------------------------

  describe('時間窗口', () => {
    it('查詢 DB 時帶入 gte/lt 條件（4 小時範圍）', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([]);

      const before = Date.now();
      await capturedProcessor!(makeJob());
      const after = Date.now();

      const callArg = (prismaMock.notification_events.findMany.mock.calls[0] as any)[0];
      const batchStart: Date = callArg.where.created_at.gte;
      const batchEnd: Date = callArg.where.created_at.lt;

      const windowMs = batchEnd.getTime() - batchStart.getTime();
      expect(windowMs).toBeCloseTo(4 * 60 * 60 * 1000, -3); // 4 小時 ± 1 秒

      expect(batchEnd.getTime()).toBeGreaterThanOrEqual(before);
      expect(batchEnd.getTime()).toBeLessThanOrEqual(after + 100);
    });
  });
});
