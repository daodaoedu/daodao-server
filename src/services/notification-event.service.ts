/**
 * Notification Event Service
 *
 * 負責將業務事件寫入 notification_events 表，
 * 供下游的通知處理器（worker）消費。
 *
 * 設計原則：
 * - 錯誤只 log 不拋出，避免影響主要業務流程
 * - 自我互動過濾：actor 與 recipient 相同時略過
 * - 重複事件防護：相同 (type, actorId, recipientId, entityId) 在 1 分鐘內不重複寫入
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateEventParams {
  /** 事件類型，例如 Comment、Reaction、Follow、Connect */
  type: string;
  /** 觸發者 user id */
  actorId: number;
  /** 接收者 user id */
  recipientId: number;
  /** 關聯實體類型，例如 comment、practice、user、connection、buddy_request */
  entityType: string;
  /** 關聯實體 id */
  entityId: number;
  /** 額外自訂資訊 */
  payload?: Record<string, unknown>;
  /** 事件優先級 */
  priority: 'P1' | 'P2' | 'P3';
  /** 系統排程事件可允許 actor 與 recipient 相同。 */
  allowSelf?: boolean;
  /** 覆寫預設一分鐘的防重複時間窗。 */
  dedupeWindowMs?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * 建立通知事件服務物件（factory function 風格）
 */
const createNotificationEventService = () => {
  /**
   * 將一筆業務事件寫入 notification_events 表。
   *
   * @param params - 事件參數
   */
  const createEvent = async (params: CreateEventParams): Promise<void> => {
    const { type, actorId, recipientId, entityType, entityId, payload, priority, allowSelf = false, dedupeWindowMs = 60 * 1000 } = params;

    // 1. 自我互動過濾
    if (actorId === recipientId && !allowSelf) {
      return;
    }

    try {
      // 2. 重複事件防護：相同 (type, actorId, recipientId, entityId) 在 1 分鐘內不重複寫入
      const dedupeSince = new Date(Date.now() - dedupeWindowMs);

      const existing = await prisma.notification_events.findFirst({
        where: {
          type,
          actor_id: actorId,
          recipient_id: recipientId,
          entity_id: entityId,
          created_at: {
            gte: dedupeSince,
          },
        },
        select: { id: true },
      });

      if (existing) {
        loggerService.debug('notification-event: duplicate event skipped', {
          type,
          actorId,
          entityId,
        });
        return;
      }

      // 3. 寫入 notification_events（processed_at 預設 null）
      await prisma.notification_events.create({
        data: {
          type,
          actor_id: actorId,
          recipient_id: recipientId,
          entity_type: entityType,
          entity_id: entityId,
          payload: payload ? (payload as Prisma.InputJsonValue) : undefined,
          priority,
          processed_at: null,
        },
      });

      loggerService.debug('notification-event: event created', {
        type,
        actorId,
        recipientId,
        entityType,
        entityId,
        priority,
      });
    } catch {
      // Payload and database errors may contain redeemable invitation tokens.
      loggerService.error('notification-event: failed to create event', {
        type,
        actorId,
        recipientId,
        entityType,
        entityId,
        priority,
      });
    }
  };

  return { createEvent };
};

export const notificationEventService = createNotificationEventService();

export default notificationEventService;
