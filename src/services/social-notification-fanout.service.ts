/**
 * Social Notification Fan-out Helpers
 *
 * 將社交通知事件 fan-out 到追蹤者和連結夥伴。
 * 所有函數皆為 fire-and-forget 設計，呼叫端應自行加 .catch(() => {})。
 */

import { prisma } from './database/prisma.service';
import type { SocialNotificationEventType } from '../types/social.types';

// Safety cap: prevents loading unbounded rows into memory.
// Accounts with more than FANOUT_MAX followers/connections will silently miss
// notifications beyond this threshold until cursor-based pagination is implemented.
const FANOUT_MAX = 1000;

export async function fanoutToPracticeFollowers(
  event: SocialNotificationEventType,
  actorId: number,
  practiceId: number,
  payload: Record<string, unknown>
): Promise<void> {
  const followers = await prisma.follows.findMany({
    where: { target_type: 'practice', target_id: practiceId },
    select: { follower_id: true },
    take: FANOUT_MAX,
  });
  if (followers.length === FANOUT_MAX) {
    console.warn(`[fanout] practice ${practiceId} has >= ${FANOUT_MAX} followers; notifications capped — migrate to cursor pagination`);
  }
  const { bulkEnqueueSocialNotifications } = await import('../queues/social-notification.queue');
  const jobs = followers
    .filter(f => f.follower_id !== actorId)
    .map(f => ({ event, actorId, recipientId: f.follower_id, payload }));
  await bulkEnqueueSocialNotifications(jobs);
}

export async function fanoutToConnectedPartners(
  event: SocialNotificationEventType,
  actorId: number,
  payload: Record<string, unknown>
): Promise<void> {
  const connections = await prisma.connections.findMany({
    where: { OR: [{ user_a_id: actorId }, { user_b_id: actorId }] },
    select: { user_a_id: true, user_b_id: true },
    take: FANOUT_MAX,
  });
  if (connections.length === FANOUT_MAX) {
    console.warn(`[fanout] actor ${actorId} has >= ${FANOUT_MAX} connections; notifications capped — migrate to cursor pagination`);
  }
  const { bulkEnqueueSocialNotifications } = await import('../queues/social-notification.queue');
  const jobs = connections.map(conn => ({
    event,
    actorId,
    recipientId: conn.user_a_id === actorId ? conn.user_b_id : conn.user_a_id,
    payload,
  }));
  await bulkEnqueueSocialNotifications(jobs);
}
