/**
 * Notification Weekly Worker Unit Tests
 *
 * 涵蓋範圍：
 * - getWeeklyRange：週一~週日 UTC 範圍計算正確
 * - 空週次：無事件時不發送
 * - 事件類型統計正確（Reaction, Comment, UserFollowed+PracticeFollowed, Connect）
 * - 偏好設定過濾
 * - 無 email 地址 → 跳過
 * - 正確呼叫 sendEmail
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
  NOTIFICATION_WEEKLY_QUEUE_NAME: 'notification-weekly',
}));

const mockSendEmail = jest.fn().mockResolvedValue({ success: true });

jest.mock('@/services/email/email.service', () => ({
  emailService: { sendEmail: mockSendEmail },
}));

jest.mock('@/services/email/notification-weekly-template', () => ({
  generateWeeklyDigestSubject: jest.fn().mockReturnValue('本週摘要'),
  generateWeeklyDigestHtml: jest.fn().mockReturnValue('<html>weekly</html>'),
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

import { createNotificationWeeklyWorker } from '@/queues/notification-weekly.worker';
import { loggerService } from '@/services/logging/logger.service';

// ============================================================================
// Helpers
// ============================================================================

const makeJob = (id = 'job-weekly-1') => ({ id });

const makeWeeklyEvent = (type: string, recipientId = 2) => ({
  recipient_id: recipientId,
  type,
  priority: 'P1',
});

const makeRecipient = (overrides: Record<string, unknown> = {}) => ({
  nickname: 'Alice',
  contacts: { email: 'alice@example.com' },
  ...overrides,
});

// ============================================================================
// Setup
// ============================================================================

describe('NotificationWeeklyWorker', () => {
  beforeAll(() => {
    createNotificationWeeklyWorker();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 空週次
  // --------------------------------------------------------------------------

  describe('空週次', () => {
    it('本週無事件時不發送 email', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('空週次時 log info 跳過', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('No events this week'),
        expect.anything(),
      );
    });
  });

  // --------------------------------------------------------------------------
  // 統計正確性
  // --------------------------------------------------------------------------

  describe('事件類型統計', () => {
    it('Reaction 統計計入 stats.reactions', async () => {
      const { generateWeeklyDigestSubject } = require('@/services/email/notification-weekly-template');
      const { generateWeeklyDigestHtml } = require('@/services/email/notification-weekly-template');

      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Reaction'),
        makeWeeklyEvent('Reaction'),
        makeWeeklyEvent('Reaction'),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.practices.findMany.mockResolvedValue([]);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      const callArg = (generateWeeklyDigestHtml as jest.Mock).mock.calls[0][0];
      expect(callArg.stats.reactions).toBe(3);
    });

    it('Comment 統計計入 stats.comments', async () => {
      const { generateWeeklyDigestHtml } = require('@/services/email/notification-weekly-template');

      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Comment'),
        makeWeeklyEvent('Comment'),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      const callArg = (generateWeeklyDigestHtml as jest.Mock).mock.calls[0][0];
      expect(callArg.stats.comments).toBe(2);
    });

    it('UserFollowed + PracticeFollowed 合併計入 stats.newFollowers', async () => {
      const { generateWeeklyDigestHtml } = require('@/services/email/notification-weekly-template');

      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('UserFollowed'),
        makeWeeklyEvent('UserFollowed'),
        makeWeeklyEvent('PracticeFollowed'),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      const callArg = (generateWeeklyDigestHtml as jest.Mock).mock.calls[0][0];
      expect(callArg.stats.newFollowers).toBe(3);
    });

    it('Connect 計入 stats.connectRequests', async () => {
      const { generateWeeklyDigestHtml } = require('@/services/email/notification-weekly-template');

      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Connect'),
        makeWeeklyEvent('Connect'),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      const callArg = (generateWeeklyDigestHtml as jest.Mock).mock.calls[0][0];
      expect(callArg.stats.connectRequests).toBe(2);
    });

    it('未出現的類型 stats 值為 0', async () => {
      const { generateWeeklyDigestHtml } = require('@/services/email/notification-weekly-template');

      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Reaction'),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      const callArg = (generateWeeklyDigestHtml as jest.Mock).mock.calls[0][0];
      expect(callArg.stats.comments).toBe(0);
      expect(callArg.stats.newFollowers).toBe(0);
      expect(callArg.stats.connectRequests).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 偏好設定過濾
  // --------------------------------------------------------------------------

  describe('偏好設定過濾', () => {
    it('disabled 類型不計入 allowedStats，全 disabled → 不發送', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Reaction'),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([
        { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
      ]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('無偏好記錄時預設啟用，正常發送', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Comment'),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 無 email 地址
  // --------------------------------------------------------------------------

  describe('無 email 地址', () => {
    it('recipient 無 email 時跳過並 log warn', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Comment'),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue({
        nickname: 'NoEmail',
        contacts: { email: null },
      } as any);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('no email'),
        expect.anything(),
      );
    });
  });

  // --------------------------------------------------------------------------
  // 正常發送
  // --------------------------------------------------------------------------

  describe('正常發送', () => {
    it('以 recipient email 呼叫 sendEmail', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Comment'),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'alice@example.com',
        subject: expect.any(String),
        html: expect.any(String),
      });
    });

    it('weeklyData 包含 recipientName、weekStart、weekEnd', async () => {
      const { generateWeeklyDigestHtml } = require('@/services/email/notification-weekly-template');

      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Reaction'),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      const callArg = (generateWeeklyDigestHtml as jest.Mock).mock.calls[0][0];
      expect(callArg.recipientName).toBe('Alice');
      expect(typeof callArg.weekStart).toBe('string'); // 格式 M/D
      expect(typeof callArg.weekEnd).toBe('string');
    });

    it('多位 recipient 各自收到週報', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Reaction', 2),
        makeWeeklyEvent('Comment', 3),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique
        .mockResolvedValueOnce({ nickname: 'Alice', contacts: { email: 'alice@example.com' } } as any)
        .mockResolvedValueOnce({ nickname: 'Bob', contacts: { email: 'bob@example.com' } } as any);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(mockSendEmail).toHaveBeenCalledTimes(2);
    });
  });

  // --------------------------------------------------------------------------
  // 容錯
  // --------------------------------------------------------------------------

  describe('容錯', () => {
    it('單一 recipient 處理失敗後繼續處理其餘', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([
        makeWeeklyEvent('Reaction', 2),
        makeWeeklyEvent('Comment', 3),
      ] as any);
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);
      prismaMock.users.findUnique
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ nickname: 'Bob', contacts: { email: 'bob@example.com' } } as any);
      prismaMock.practices.findMany.mockResolvedValue([]);

      await expect(capturedProcessor!(makeJob())).resolves.toBeUndefined();

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process recipient'),
        expect.anything(),
      );
    });
  });

  // --------------------------------------------------------------------------
  // 時間範圍
  // --------------------------------------------------------------------------

  describe('週時間範圍', () => {
    it('查詢 DB 時帶入 gte/lte，範圍約 7 天', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      const callArg = (prismaMock.notification_events.findMany.mock.calls[0] as any)[0];
      const weekStart: Date = callArg.where.created_at.gte;
      const weekEnd: Date = callArg.where.created_at.lte;

      const rangeMs = weekEnd.getTime() - weekStart.getTime();
      // 週一 00:00 ~ 週日 23:59:59.999 ≈ 7 天
      expect(rangeMs).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
      expect(rangeMs).toBeLessThan(8 * 24 * 60 * 60 * 1000);
    });

    it('weekStart 是 UTC+8 週一 00:00（UTC 偏移 8 小時後 = 週一）', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      const callArg = (prismaMock.notification_events.findMany.mock.calls[0] as any)[0];
      const weekStart: Date = callArg.where.created_at.gte;

      // UTC+8 週一 00:00 = UTC 週日 16:00 或週一 16:00
      // 將 weekStart 轉回 UTC+8 查看是週一 00:00
      const utc8 = new Date(weekStart.getTime() + 8 * 60 * 60 * 1000);
      expect(utc8.getUTCHours()).toBe(0);
      expect(utc8.getUTCMinutes()).toBe(0);
      // 週一 = 1
      expect(utc8.getUTCDay()).toBe(1);
    });
  });
});
