/**
 * Wishpool 通知
 *
 * 沿用既有 notification_events 管線（in-app worker + 4h digest email worker）：
 * - wish.linked：許願被歸入／促成項目 → 通知許願者（P1）
 * - roadmap.shipped：項目 status→done → 通知所有支持者（P2，digest 內依 entity 聚合防轟炸）
 *
 * Email 由 digest worker 取帳號 email 發送；wish 的 contact_email 一併帶入 payload 備用。
 */

import { prisma } from './database/prisma.service';
import { notificationEventService } from './notification-event.service';

function roadmapUrl(): string {
  const base = process.env.FRONTEND_URL ?? 'https://app.daodao.so';
  return `${base.replace(/\/$/, '')}/roadmap`;
}

export interface NotifyWishLinkedParams {
  wisherUserId: number;
  actorUserId: number;
  itemId: number;
  itemTitle: string;
  contactEmail?: string | null;
}

export async function notifyWishLinked(params: NotifyWishLinkedParams): Promise<void> {
  const { wisherUserId, actorUserId, itemId, itemTitle, contactEmail } = params;
  await notificationEventService.createEvent({
    type: 'wish.linked',
    actorId: actorUserId,
    recipientId: wisherUserId,
    entityType: 'roadmap_item',
    entityId: itemId,
    payload: { entityTitle: itemTitle, url: roadmapUrl(), contactEmail: contactEmail ?? undefined },
    priority: 'P1',
  });
}

export interface NotifyRoadmapShippedParams {
  itemId: number;
  itemTitle: string;
  actorUserId: number;
}

export async function notifyRoadmapShipped(params: NotifyRoadmapShippedParams): Promise<void> {
  const { itemId, itemTitle, actorUserId } = params;

  const supporters = await prisma.roadmap_item_supports.findMany({
    where: { roadmap_item_id: itemId },
    select: { user_id: true },
  });

  const url = roadmapUrl();
  await Promise.all(
    supporters.map((s) =>
      notificationEventService.createEvent({
        type: 'roadmap.shipped',
        actorId: actorUserId,
        recipientId: s.user_id,
        entityType: 'roadmap_item',
        entityId: itemId,
        payload: { entityTitle: itemTitle, url },
        priority: 'P2',
      }),
    ),
  );
}

export const wishpoolNotificationService = {
  notifyWishLinked,
  notifyRoadmapShipped,
};
