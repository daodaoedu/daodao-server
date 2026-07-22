/**
 * Notification Event Service Unit Tests
 *
 * 涵蓋範圍：
 * - 自我互動過濾（actor === recipient 時略過）
 * - 重複事件防護（1 分鐘內相同事件不重複寫入）
 * - 正常事件寫入
 * - 錯誤只 log 不拋出
 */

import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: mockLogger,
}));

import { notificationEventService } from '@/services/notification-event.service';
import type { CreateEventParams } from '@/services/notification-event.service';

// ============================================================================
// Helpers
// ============================================================================

const makeParams = (overrides: Partial<CreateEventParams> = {}): CreateEventParams => ({
  type: 'Comment',
  actorId: 1,
  recipientId: 2,
  entityType: 'practice',
  entityId: 10,
  priority: 'P1',
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('NotificationEventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 自我互動過濾
  // --------------------------------------------------------------------------

  describe('createEvent — 自我互動過濾', () => {
    it('actor === recipient 時不寫入 DB，直接回傳', async () => {
      const params = makeParams({ actorId: 5, recipientId: 5 });

      await notificationEventService.createEvent(params);

      expect(prismaMock.notification_events.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.notification_events.create).not.toHaveBeenCalled();
    });

    it('allows a system-generated self event and uses its longer dedupe window', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-22T00:00:00.000Z'));
      prismaMock.notification_events.findFirst.mockResolvedValue(null);
      prismaMock.notification_events.create.mockResolvedValue({} as never);

      await notificationEventService.createEvent(makeParams({
        actorId: 5,
        recipientId: 5,
        allowSelf: true,
        dedupeWindowMs: 6 * 24 * 60 * 60 * 1000
      }));
      expect(prismaMock.notification_events.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ created_at: { gte: new Date('2026-07-16T00:00:00.000Z') } })
      }));
      expect(prismaMock.notification_events.create).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });

  // --------------------------------------------------------------------------
  // 重複事件防護
  // --------------------------------------------------------------------------

  describe('createEvent — 重複事件防護', () => {
    it('1 分鐘內相同事件已存在時不重複寫入', async () => {
      prismaMock.notification_events.findFirst.mockResolvedValue({ id: 99 } as never);

      await notificationEventService.createEvent(makeParams());

      expect(prismaMock.notification_events.create).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'notification-event: duplicate event skipped',
        expect.objectContaining({ type: 'Comment', actorId: 1, entityId: 10 }),
      );
    });

    it('查詢重複事件時使用正確的 where 條件（type + actorId + entityId + 1 分鐘內）', async () => {
      prismaMock.notification_events.findFirst.mockResolvedValue(null);
      prismaMock.notification_events.create.mockResolvedValue({} as never);

      const before = Date.now();
      await notificationEventService.createEvent(makeParams());
      const after = Date.now();

      const call = prismaMock.notification_events.findFirst.mock.calls[0][0] as {
        where: { type: string; actor_id: number; entity_id: number; created_at: { gte: Date } };
      };
      expect(call.where.type).toBe('Comment');
      expect(call.where.actor_id).toBe(1);
      expect(call.where.entity_id).toBe(10);
      // created_at.gte 應在「現在 - 1 分鐘」附近
      const gte: Date = call.where.created_at.gte;
      expect(gte.getTime()).toBeGreaterThanOrEqual(before - 60_000 - 100);
      expect(gte.getTime()).toBeLessThanOrEqual(after - 60_000 + 100);
    });
  });

  // --------------------------------------------------------------------------
  // 正常寫入
  // --------------------------------------------------------------------------

  describe('createEvent — 正常寫入', () => {
    it('寫入 notification_events 並帶入正確欄位', async () => {
      prismaMock.notification_events.findFirst.mockResolvedValue(null);
      prismaMock.notification_events.create.mockResolvedValue({} as never);

      const params = makeParams({ payload: { foo: 'bar' } });
      await notificationEventService.createEvent(params);

      expect(prismaMock.notification_events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type:         'Comment',
          actor_id:     1,
          recipient_id: 2,
          entity_type:  'practice',
          entity_id:    10,
          priority:     'P1',
          processed_at: null,
          payload:      { foo: 'bar' },
        }),
      });
    });

    it('沒有 payload 時不帶 payload 欄位（undefined）', async () => {
      prismaMock.notification_events.findFirst.mockResolvedValue(null);
      prismaMock.notification_events.create.mockResolvedValue({} as never);

      await notificationEventService.createEvent(makeParams());

      const data = (prismaMock.notification_events.create.mock.calls[0][0] as { data: { payload?: unknown } }).data;
      expect(data.payload).toBeUndefined();
    });

    it('寫入成功後 log debug 訊息', async () => {
      prismaMock.notification_events.findFirst.mockResolvedValue(null);
      prismaMock.notification_events.create.mockResolvedValue({} as never);

      await notificationEventService.createEvent(makeParams());

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'notification-event: event created',
        expect.objectContaining({ type: 'Comment', actorId: 1, recipientId: 2 }),
      );
    });
  });

  // --------------------------------------------------------------------------
  // 錯誤處理
  // --------------------------------------------------------------------------

  describe('createEvent — 錯誤只 log 不拋出', () => {
    it('DB 寫入失敗時 log error 但不拋出例外', async () => {
      prismaMock.notification_events.findFirst.mockResolvedValue(null);
      prismaMock.notification_events.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(notificationEventService.createEvent(makeParams())).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'notification-event: failed to create event',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('findFirst 失敗時同樣只 log 不拋出', async () => {
      prismaMock.notification_events.findFirst.mockRejectedValue(new Error('Query timeout'));

      await expect(notificationEventService.createEvent(makeParams())).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
