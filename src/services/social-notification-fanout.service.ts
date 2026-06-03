/**
 * Social Notification Fan-out Helpers
 *
 * 將社交通知事件 fan-out 到追蹤者和連結夥伴。
 * 所有函數皆為 fire-and-forget 設計，呼叫端應自行加 .catch(() => {})。
 */

import { prisma } from './database/prisma.service';
import type { SocialNotificationEventType } from '../types/social.types';

const FANOUT_BATCH_SIZE = 1000;

/**
 * Fan-out 通知給實踐的追蹤者
 * @param event - 社交通知事件類型
 * @param actorId - 觸發者 user id（會被排除在收件人外）
 * @param practiceId - 實踐 id
 * @param payload - 額外資料
 */
export async function fanoutToPracticeFollowers(
  event: SocialNotificationEventType,
  actorId: number,
  practiceId: number,
  payload: Record<string, unknown>
): Promise<void> {
  const { bulkEnqueueSocialNotifications } = await import('../queues/social-notification.queue');
  let cursor: number | undefined;
  do {
    const batch = await prisma.follows.findMany({
      where: {
        target_type: 'practice',
        target_id: practiceId,
        ...(cursor !== undefined ? { id: { gt: cursor } } : {}),
      },
      select: { id: true, follower_id: true },
      take: FANOUT_BATCH_SIZE,
      orderBy: { id: 'asc' },
    });
    const jobs = batch
      .filter(f => f.follower_id !== actorId)
      .map(f => ({ event, actorId, recipientId: f.follower_id, payload }));
    if (jobs.length > 0) {
      await bulkEnqueueSocialNotifications(jobs);
    }
    cursor = batch[batch.length - 1]?.id;
  } while (batch.length === FANOUT_BATCH_SIZE);
}

/**
 * Fan-out 通知給雙向連結夥伴
 * @param event - 社交通知事件類型
 * @param actorId - 觸發者 user id
 * @param payload - 額外資料
 */
export async function fanoutToConnectedPartners(
  event: SocialNotificationEventType,
  actorId: number,
  payload: Record<string, unknown>
): Promise<void> {
  const { bulkEnqueueSocialNotifications } = await import('../queues/social-notification.queue');
  let cursor: number | undefined;
  do {
    const batch = await prisma.connections.findMany({
      where: {
        AND: [
          { OR: [{ user_a_id: actorId }, { user_b_id: actorId }] },
          ...(cursor !== undefined ? [{ id: { gt: cursor } }] : []),
        ],
      },
      select: { id: true, user_a_id: true, user_b_id: true },
      take: FANOUT_BATCH_SIZE,
      orderBy: { id: 'asc' },
    });
    const jobs = batch.map(conn => ({
      event,
      actorId,
      recipientId: conn.user_a_id === actorId ? conn.user_b_id : conn.user_a_id,
      payload,
    }));
    if (jobs.length > 0) {
      await bulkEnqueueSocialNotifications(jobs);
    }
    cursor = batch[batch.length - 1]?.id;
  } while (batch.length === FANOUT_BATCH_SIZE);
}
