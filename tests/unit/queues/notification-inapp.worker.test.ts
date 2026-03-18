/**
 * Notification In-App Worker Unit Tests
 *
 * 涵蓋範圍：
 * - 空批次時直接回傳
 * - P1 事件：每條各自建立一筆 notification
 * - P2 事件：依 (type, entity_type, entity_id) 聚合，aggregation_count 正確
 * - P2 聚合：取最新 actor_id
 * - 多 recipient 各自獨立處理
 * - 處理後 processedIds 更新 processed_at
 * - P1 失敗不中斷整批
 * - P2 失敗不中斷整批
 * - 達到 BATCH_LIMIT 時 log warn
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
  NOTIFICATION_INAPP_QUEUE_NAME: 'notification-inapp',
}));

// ─── 捕獲 BullMQ Worker 的 processor 函式 ────────────────────────────────────

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

import { createNotificationInAppWorker } from '@/queues/notification-inapp.worker';
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
  created_at: new Date('2024-01-01T00:00:00Z'),
  processed_at: null,
  ...overrides,
});

// ============================================================================
// Setup
// ============================================================================

describe('NotificationInAppWorker — processNotificationInAppJob', () => {
  beforeAll(() => {
    // 觸發 Worker 建立，捕獲 processor
    createNotificationInAppWorker();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 空批次
  // --------------------------------------------------------------------------

  describe('空批次', () => {
    it('無待處理事件時不寫入 notifications 也不更新 processed_at', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(prismaMock.notifications.create).not.toHaveBeenCalled();
      expect(prismaMock.notification_events.updateMany).not.toHaveBeenCalled();
    });

    it('無待處理事件時 log info 跳過訊息', async () => {
      prismaMock.notification_events.findMany.mockResolvedValue([]);

      await capturedProcessor!(makeJob());

      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('No pending events'),
        expect.anything(),
      );
    });
  });

  // --------------------------------------------------------------------------
  // P1 事件
  // --------------------------------------------------------------------------

  describe('P1 事件', () => {
    it('每條 P1 事件各自建立一筆 notification', async () => {
      const events = [
        makeEvent({ id: 1, priority: 'P1', actor_id: 10 }),
        makeEvent({ id: 2, priority: 'P1', actor_id: 11 }),
      ];
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create.mockResolvedValue({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 2 } as any);

      await capturedProcessor!(makeJob());

      expect(prismaMock.notifications.create).toHaveBeenCalledTimes(2);
    });

    it('P1 notification 寫入正確欄位，aggregation_count = 1', async () => {
      const event = makeEvent({ id: 1, priority: 'P1', actor_id: 10, entity_id: 20, type: 'Comment' });
      prismaMock.notification_events.findMany.mockResolvedValue([event] as any);
      prismaMock.notifications.create.mockResolvedValue({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 1 } as any);

      await capturedProcessor!(makeJob());

      expect(prismaMock.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipient_id: 2,
          actor_id: 10,
          type: 'Comment',
          entity_id: 20,
          priority: 'P1',
          aggregation_key: null,
          aggregation_count: 1,
        }),
      });
    });

    it('P1 單一事件失敗時其餘繼續處理', async () => {
      const events = [
        makeEvent({ id: 1, priority: 'P1', actor_id: 10 }),
        makeEvent({ id: 2, priority: 'P1', actor_id: 11 }),
      ];
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 1 } as any);

      await expect(capturedProcessor!(makeJob())).resolves.toBeUndefined();

      expect(prismaMock.notifications.create).toHaveBeenCalledTimes(2);
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create P1 notification'),
        expect.anything(),
      );
    });

    it('成功處理的事件 ID 加入 processedIds，最後更新 processed_at', async () => {
      const events = [
        makeEvent({ id: 5, priority: 'P1' }),
        makeEvent({ id: 6, priority: 'P1' }),
      ];
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create.mockResolvedValue({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 2 } as any);

      await capturedProcessor!(makeJob());

      expect(prismaMock.notification_events.updateMany).toHaveBeenCalledWith({
        where: { id: { in: expect.arrayContaining([5, 6]) } },
        data: { processed_at: expect.any(Date) },
      });
    });
  });

  // --------------------------------------------------------------------------
  // P2 聚合
  // --------------------------------------------------------------------------

  describe('P2 事件聚合', () => {
    it('同一 (type, entity_type, entity_id) 的 P2 事件合併為一筆 notification', async () => {
      const events = [
        makeEvent({ id: 1, priority: 'P2', type: 'Reaction', entity_type: 'practice', entity_id: 10, actor_id: 3 }),
        makeEvent({ id: 2, priority: 'P2', type: 'Reaction', entity_type: 'practice', entity_id: 10, actor_id: 4 }),
        makeEvent({ id: 3, priority: 'P2', type: 'Reaction', entity_type: 'practice', entity_id: 10, actor_id: 5 }),
      ];
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create.mockResolvedValue({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 3 } as any);

      await capturedProcessor!(makeJob());

      expect(prismaMock.notifications.create).toHaveBeenCalledTimes(1);
    });

    it('aggregation_count = 聚合事件數量', async () => {
      const events = [
        makeEvent({ id: 1, priority: 'P2', type: 'Reaction', entity_id: 10, created_at: new Date('2024-01-01T01:00:00Z') }),
        makeEvent({ id: 2, priority: 'P2', type: 'Reaction', entity_id: 10, created_at: new Date('2024-01-01T02:00:00Z') }),
        makeEvent({ id: 3, priority: 'P2', type: 'Reaction', entity_id: 10, created_at: new Date('2024-01-01T03:00:00Z') }),
      ];
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create.mockResolvedValue({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 3 } as any);

      await capturedProcessor!(makeJob());

      expect(prismaMock.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ aggregation_count: 3 }),
      });
    });

    it('P2 聚合使用最新事件的 actor_id', async () => {
      const events = [
        makeEvent({ id: 1, priority: 'P2', type: 'Reaction', entity_id: 10, actor_id: 100, created_at: new Date('2024-01-01T01:00:00Z') }),
        makeEvent({ id: 2, priority: 'P2', type: 'Reaction', entity_id: 10, actor_id: 200, created_at: new Date('2024-01-01T03:00:00Z') }), // 最新
        makeEvent({ id: 3, priority: 'P2', type: 'Reaction', entity_id: 10, actor_id: 150, created_at: new Date('2024-01-01T02:00:00Z') }),
      ];
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create.mockResolvedValue({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 3 } as any);

      await capturedProcessor!(makeJob());

      expect(prismaMock.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ actor_id: 200 }),
      });
    });

    it('不同 entity_id 的 P2 事件各自建立 notification', async () => {
      const events = [
        makeEvent({ id: 1, priority: 'P2', type: 'Reaction', entity_id: 10 }),
        makeEvent({ id: 2, priority: 'P2', type: 'Reaction', entity_id: 20 }), // 不同 entity
      ];
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create.mockResolvedValue({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 2 } as any);

      await capturedProcessor!(makeJob());

      expect(prismaMock.notifications.create).toHaveBeenCalledTimes(2);
    });

    it('P2 聚合的 aggregation_key 格式為 "type:entity_type:entity_id"', async () => {
      const events = [
        makeEvent({ id: 1, priority: 'P2', type: 'Reaction', entity_type: 'practice', entity_id: 42 }),
      ];
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create.mockResolvedValue({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 1 } as any);

      await capturedProcessor!(makeJob());

      expect(prismaMock.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          aggregation_key: 'Reaction:practice:42',
        }),
      });
    });

    it('P2 群組失敗時其餘繼續處理', async () => {
      const events = [
        makeEvent({ id: 1, priority: 'P2', type: 'Reaction', entity_id: 10 }),
        makeEvent({ id: 2, priority: 'P2', type: 'Comment', entity_id: 10 }), // 不同 type → 不同群組
      ];
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 1 } as any);

      await expect(capturedProcessor!(makeJob())).resolves.toBeUndefined();
      expect(prismaMock.notifications.create).toHaveBeenCalledTimes(2);
    });
  });

  // --------------------------------------------------------------------------
  // 多 recipient
  // --------------------------------------------------------------------------

  describe('多 recipient', () => {
    it('不同 recipient 的事件各自獨立處理', async () => {
      const events = [
        makeEvent({ id: 1, priority: 'P1', recipient_id: 2 }),
        makeEvent({ id: 2, priority: 'P1', recipient_id: 3 }),
        makeEvent({ id: 3, priority: 'P1', recipient_id: 4 }),
      ];
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create.mockResolvedValue({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 3 } as any);

      await capturedProcessor!(makeJob());

      const recipientIds = prismaMock.notifications.create.mock.calls.map(
        (c: any[]) => c[0].data.recipient_id,
      );
      expect(recipientIds).toEqual(expect.arrayContaining([2, 3, 4]));
    });
  });

  // --------------------------------------------------------------------------
  // BATCH_LIMIT
  // --------------------------------------------------------------------------

  describe('BATCH_LIMIT', () => {
    it('達到 5000 筆時 log warn 提示積壓', async () => {
      const events = Array.from({ length: 5000 }, (_, i) =>
        makeEvent({ id: i + 1, priority: 'P1' }),
      );
      prismaMock.notification_events.findMany.mockResolvedValue(events as any);
      prismaMock.notifications.create.mockResolvedValue({} as any);
      prismaMock.notification_events.updateMany.mockResolvedValue({ count: 5000 } as any);

      await capturedProcessor!(makeJob());

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('batch limit reached'),
        expect.anything(),
      );
    });
  });
});
