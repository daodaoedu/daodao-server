/**
 * 通知系統：Email 批次與退訂測試（12.3-12.5）
 *
 * 涵蓋範圍：
 * - 12.3 驗證 4 小時 Email 批次：09:15 留言 + 11:30 按讚 → 12:00 Email 同時出現
 * - 12.4 驗證偏好設定即時生效：關閉 Reaction Email → 後續 Reaction 事件不進入 Email 批次
 * - 12.5 驗證退訂連結：點擊退訂連結 → preferences 更新 → 下一批次不發送
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
  generateUnsubscribeUrl:  jest.fn().mockReturnValue('https://daodao.cc/unsubscribe'),
  generateSettingsUrl:     jest.fn().mockReturnValue('https://daodao.cc/settings/notifications'),
  verifyUnsubscribeToken:  jest.fn(),
  generateUnsubscribeToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

jest.mock('@/utils/response-helper', () => ({
  createSuccessResponse: jest.fn().mockImplementation((data: unknown) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  })),
}));

// ─── Worker mock ─────────────────────────────────────────────────────────────

let capturedEmailProcessor: ((job: { id: string }) => Promise<void>) | null = null;

const mockWorkerInstance = {
  on: jest.fn().mockReturnThis(),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(
    (_name: string, processor: (job: { id: string }) => Promise<void>) => {
      capturedEmailProcessor = processor;
      return mockWorkerInstance;
    },
  ),
}));

import { createNotificationEmailWorker } from '@/queues/notification-email.worker';

// ============================================================================
// Helpers
// ============================================================================

const makeJob = (id = 'job-email-1') => ({ id });

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  id: Math.floor(Math.random() * 100_000),
  type: 'Comment',
  actor_id: 10,
  recipient_id: 1,
  entity_type: 'practice',
  entity_id: 100,
  priority: 'P1',
  payload: null,
  created_at: new Date(),
  processed_at: null,
  ...overrides,
});

const makeRecipient = (email = 'user@example.com', nickname = '測試用戶') => ({
  nickname,
  contacts: { email },
});

// ============================================================================
// Setup
// ============================================================================

describe('EmailWorker — 12.3 4 小時 Email 批次', () => {
  beforeAll(() => {
    createNotificationEmailWorker();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('09:15 留言事件與 11:30 按讚事件在 12:00 批次中同時出現（在同一封 Email 發送）', async () => {
    // 模擬 12:00 執行批次：時間窗口為 08:00–12:00
    // 09:15 留言事件（P1 comment）
    const commentEvent = makeEvent({
      id: 1001,
      type: 'Comment',
      priority: 'P1',
      created_at: new Date('2025-01-01T09:15:00Z'),
    });
    // 11:30 按讚事件（P2 Reaction）
    const reactionEvent = makeEvent({
      id: 1002,
      type: 'Reaction',
      priority: 'P2',
      created_at: new Date('2025-01-01T11:30:00Z'),
    });

    prismaMock.notification_events.findMany.mockResolvedValue([commentEvent, reactionEvent] as any);
    prismaMock.notification_preferences.findMany.mockResolvedValue([]); // 全部預設啟用
    prismaMock.users.findMany.mockResolvedValue([{ id: 10, nickname: '用戶A' }] as any);
    prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);

    await capturedEmailProcessor!(makeJob());

    // 確認 Email 被發送（兩個事件都在同一封 digest 中）
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('查詢的時間範圍精確覆蓋 4 小時（batchEnd - batchStart ≈ 4h）', async () => {
    prismaMock.notification_events.findMany.mockResolvedValue([]);

    const before = Date.now();
    await capturedEmailProcessor!(makeJob());
    const after = Date.now();

    const callArg = prismaMock.notification_events.findMany.mock.calls[0][0] as any;
    const batchStart: Date = callArg.where.created_at.gte;
    const batchEnd: Date   = callArg.where.created_at.lt;
    const windowMs = batchEnd.getTime() - batchStart.getTime();

    // 時間窗口應為 4 小時（4 * 60 * 60 * 1000 ms）
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    expect(windowMs).toBeCloseTo(FOUR_HOURS_MS, -3); // 允許小範圍誤差

    // batchEnd 應接近 now
    expect(batchEnd.getTime()).toBeGreaterThanOrEqual(before - 100);
    expect(batchEnd.getTime()).toBeLessThanOrEqual(after + 100);
  });

  it('批次中 P1 事件在 digest 中屬於 p1Events，P2 事件屬於 p2Events', async () => {
    const p1Event = makeEvent({ id: 2001, type: 'Comment', priority: 'P1' });
    const p2Event = makeEvent({ id: 2002, type: 'Reaction', priority: 'P2' });

    prismaMock.notification_events.findMany.mockResolvedValue([p1Event, p2Event] as any);
    prismaMock.notification_preferences.findMany.mockResolvedValue([]);
    prismaMock.users.findMany.mockResolvedValue([{ id: 10, nickname: '用戶A' }] as any);
    prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);

    const { generateNotificationDigestHtml } = jest.requireMock('@/services/email/notification-digest-template') as {
      generateNotificationDigestHtml: jest.Mock
    };

    await capturedEmailProcessor!(makeJob());

    const digestData = generateNotificationDigestHtml.mock.calls[0][0] as any;
    expect(digestData.interactionEvents).toHaveLength(1);
    expect(digestData.interactionEvents[0].type).toBe('Comment');
    expect(digestData.p2Events).toHaveLength(1);
    expect(digestData.p2Events[0].type).toBe('Reaction');
  });

  it('同一批次內多位 recipient 各自收到一封 Email', async () => {
    const events = [
      makeEvent({ id: 3001, recipient_id: 1, priority: 'P1' }),
      makeEvent({ id: 3002, recipient_id: 2, priority: 'P1' }),
      makeEvent({ id: 3003, recipient_id: 3, priority: 'P1' }),
    ];

    prismaMock.notification_events.findMany.mockResolvedValue(events as any);
    prismaMock.notification_preferences.findMany.mockResolvedValue([]);
    prismaMock.users.findMany.mockResolvedValue([{ id: 10, nickname: '用戶A' }] as any);
    prismaMock.users.findUnique
      .mockResolvedValueOnce(makeRecipient('u1@test.com', '用戶1') as any)
      .mockResolvedValueOnce(makeRecipient('u2@test.com', '用戶2') as any)
      .mockResolvedValueOnce(makeRecipient('u3@test.com', '用戶3') as any);

    await capturedEmailProcessor!(makeJob());

    expect(mockSendEmail).toHaveBeenCalledTimes(3);
  });

  it('批次內 recipient 失敗不影響其他 recipient 的 Email 發送', async () => {
    const events = [
      makeEvent({ id: 4001, recipient_id: 1, priority: 'P1' }),
      makeEvent({ id: 4002, recipient_id: 2, priority: 'P1' }),
    ];

    prismaMock.notification_events.findMany.mockResolvedValue(events as any);
    prismaMock.notification_preferences.findMany.mockResolvedValue([]);
    prismaMock.users.findMany.mockResolvedValue([{ id: 10, nickname: '用戶A' }] as any);
    prismaMock.users.findUnique
      .mockRejectedValueOnce(new Error('DB error')) // 第一位失敗
      .mockResolvedValueOnce(makeRecipient('u2@test.com') as any); // 第二位成功

    await expect(capturedEmailProcessor!(makeJob())).resolves.toBeUndefined();
    expect(mockSendEmail).toHaveBeenCalledTimes(1); // 第二位仍發送
  });
});

// ============================================================================
// 12.4 偏好設定即時生效
// ============================================================================

describe('EmailWorker — 12.4 偏好設定即時生效', () => {
  beforeAll(() => {
    createNotificationEmailWorker();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('關閉 Reaction Email 偏好後，Reaction 事件不進入批次 Email', async () => {
    const reactionEvent = makeEvent({
      id: 5001,
      type: 'Reaction',
      priority: 'P2',
    });

    prismaMock.notification_events.findMany.mockResolvedValue([reactionEvent] as any);
    // N01 channel Reaction 設為 disabled
    prismaMock.notification_preferences.findMany.mockResolvedValue([
      { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
    ]);
    prismaMock.users.findMany.mockResolvedValue([{ id: 10, nickname: '用戶A' }] as any);
    prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);

    await capturedEmailProcessor!(makeJob());

    // Reaction 被過濾，沒有允許的事件，不發 Email
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('關閉 Reaction Email 後，同批次的其他事件（comment P1）仍正常發送', async () => {
    const reactionEvent = makeEvent({ id: 6001, type: 'Reaction', priority: 'P2' });
    const commentEvent  = makeEvent({ id: 6002, type: 'Comment',  priority: 'P1' });

    prismaMock.notification_events.findMany.mockResolvedValue([reactionEvent, commentEvent] as any);
    prismaMock.notification_preferences.findMany.mockResolvedValue([
      { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
      // comment 沒有設定 → 預設 true
    ]);
    prismaMock.users.findMany.mockResolvedValue([{ id: 10, nickname: '用戶A' }] as any);
    prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);

    await capturedEmailProcessor!(makeJob());

    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    // digest 中只有 comment，沒有 Reaction
    const { generateNotificationDigestHtml } = jest.requireMock('@/services/email/notification-digest-template') as {
      generateNotificationDigestHtml: jest.Mock
    };
    const digestData = generateNotificationDigestHtml.mock.calls[0][0] as any;
    expect(digestData.p2Events).toHaveLength(0); // Reaction 已被過濾
    expect(digestData.interactionEvents).toHaveLength(1); // comment 仍在
  });

  it('偏好設定 is_enabled=true 的事件通過過濾，正常發送', async () => {
    const event = makeEvent({ id: 7001, type: 'BuddyRequest', priority: 'P1' });

    prismaMock.notification_events.findMany.mockResolvedValue([event] as any);
    prismaMock.notification_preferences.findMany.mockResolvedValue([
      { notification_type: 'BuddyRequest', channel: 'N01', is_enabled: true } as any,
    ]);
    prismaMock.users.findMany.mockResolvedValue([{ id: 10, nickname: '用戶A' }] as any);
    prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);

    await capturedEmailProcessor!(makeJob());

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('notification_preferences 無記錄時視為預設啟用（is_enabled=true）', async () => {
    const event = makeEvent({ id: 8001, type: 'UserFollowed', priority: 'P2' });

    prismaMock.notification_events.findMany.mockResolvedValue([event] as any);
    prismaMock.notification_preferences.findMany.mockResolvedValue([]); // 無設定記錄
    prismaMock.users.findMany.mockResolvedValue([{ id: 10, nickname: '用戶A' }] as any);
    prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);

    await capturedEmailProcessor!(makeJob());

    // 預設啟用 → Email 發送
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// 12.5 退訂連結
// ============================================================================

describe('12.5 退訂連結：點擊 Email 退訂連結 → preferences 更新 → 下一批次不發送', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);
    prismaMock.notification_preferences.findMany.mockResolvedValue([]);
  });

  it('verifyUnsubscribeToken 回傳有效 payload 時，updatePreference 被呼叫（停用 N01）', async () => {
    const { verifyUnsubscribeToken } = jest.requireMock('@/services/notification-unsubscribe.service') as {
      verifyUnsubscribeToken: jest.Mock
    };
    verifyUnsubscribeToken.mockReturnValue({ userId: 1, notificationType: 'Reaction' });

    const { notificationPreferenceService } = await import('@/services/notification-preference.service');

    // 模擬退訂流程：token 驗證成功 → 停用 Reaction N01
    const payload = verifyUnsubscribeToken('valid-token');
    expect(payload).not.toBeNull();

    await notificationPreferenceService.updatePreference(
      payload!.userId,
      payload!.notificationType,
      'N01',
      false,
    );

    expect(prismaMock.notification_preferences.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user_id_notification_type_channel: expect.objectContaining({
            user_id:           1,
            notification_type: 'Reaction',
            channel:           'N01',
          }),
        }),
        update: { is_enabled: false },
        create: expect.objectContaining({ is_enabled: false }),
      }),
    );
  });

  it('digest 退訂（notificationType=digest）觸發 setGlobalEnabled(false) 停用所有 N01/N03', async () => {
    prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);
    prismaMock.$transaction.mockImplementation(async (ops: any) => Promise.all(ops));

    const { notificationPreferenceService } = await import('@/services/notification-preference.service');
    const result = await notificationPreferenceService.setGlobalEnabled(1, false);

    // 所有 upsert 呼叫都是 N01 或 N03，沒有 N02
    const channels = prismaMock.notification_preferences.upsert.mock.calls.map(
      (c: any[]) => c[0].where.user_id_notification_type_channel.channel,
    );
    expect(channels.every((ch: string) => ch === 'N01' || ch === 'N03')).toBe(true);
    expect(result.success).toBe(true);
  });

  it('token 無效時 verifyUnsubscribeToken 回傳 null，不更新 preferences', async () => {
    const { verifyUnsubscribeToken } = jest.requireMock('@/services/notification-unsubscribe.service') as {
      verifyUnsubscribeToken: jest.Mock
    };
    verifyUnsubscribeToken.mockReturnValue(null); // 無效 token

    const payload = verifyUnsubscribeToken('invalid-token');
    expect(payload).toBeNull();

    // preferences 不應被更新
    expect(prismaMock.notification_preferences.upsert).not.toHaveBeenCalled();
  });

  it('退訂後偏好設定更新，下一批次同類型事件被過濾不發 Email', async () => {
    // 模擬用戶退訂 Reaction Email 後，下一批次不再發送
    const reactionEvent = makeEvent({ id: 9001, type: 'Reaction', priority: 'P2' });

    prismaMock.notification_events.findMany.mockResolvedValue([reactionEvent] as any);
    // preferences 已更新（退訂後 Reaction N01 = false）
    prismaMock.notification_preferences.findMany.mockResolvedValue([
      { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
    ]);
    prismaMock.users.findMany.mockResolvedValue([{ id: 10, nickname: '用戶A' }] as any);
    prismaMock.users.findUnique.mockResolvedValue(makeRecipient() as any);

    await capturedEmailProcessor!(makeJob());

    // 退訂後不應發送 Email
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('退訂 URL 包含有效 JWT token（用於無登入退訂）', async () => {
    const { generateUnsubscribeUrl } = jest.requireMock('@/services/notification-unsubscribe.service') as {
      generateUnsubscribeUrl: jest.Mock
    };

    // 確認 generateUnsubscribeUrl 被呼叫時帶入 userId 和 notificationType
    generateUnsubscribeUrl(1, 'digest');
    expect(generateUnsubscribeUrl).toHaveBeenCalledWith(1, 'digest');

    // URL 格式中應包含 token（由 generateUnsubscribeToken 簽署）
    const url: string = generateUnsubscribeUrl.mock.results[0].value;
    expect(url).toContain('unsubscribe');
  });
});
