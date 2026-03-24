/**
 * Social Notification Fan-out Helpers
 *
 * 將社交通知事件 fan-out 到追蹤者和連結夥伴。
 * 所有函數皆為 fire-and-forget 設計，呼叫端應自行加 .catch(() => {})。
 */

import { prisma } from './database/prisma.service';
import type { SocialNotificationEventType } from '../types/social.types';

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
  const followers = await prisma.follows.findMany({
    where: { target_type: 'practice', target_id: practiceId },
    select: { follower_id: true },
  });
  const { bulkEnqueueSocialNotifications } = await import('../queues/social-notification.queue');
  const jobs = followers
    .filter(f => f.follower_id !== actorId)
    .map(f => ({ event, actorId, recipientId: f.follower_id, payload }));
  await bulkEnqueueSocialNotifications(jobs);
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
  const connections = await prisma.connections.findMany({
    where: { OR: [{ user_a_id: actorId }, { user_b_id: actorId }] },
    select: { user_a_id: true, user_b_id: true },
  });
  const { bulkEnqueueSocialNotifications } = await import('../queues/social-notification.queue');
  const jobs = connections.map(conn => ({
    event,
    actorId,
    recipientId: conn.user_a_id === actorId ? conn.user_b_id : conn.user_a_id,
    payload,
  }));
  await bulkEnqueueSocialNotifications(jobs);
}
