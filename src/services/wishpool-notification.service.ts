/**
 * Wishpool 通知
 *
 * - wish.linked：許願被歸入／促成項目 → 通知許願者
 *   - 站內：寫 notification_events（P1，由 in-app worker 消費）
 *   - Email：即時寄到 wish.contact_email（無則帳號 email）；為避免重複，digest worker 已排除此 type
 * - roadmap.shipped：項目 status→done → 通知所有支持者（P2，digest 內依 entity 聚合防轟炸，寄帳號 email）
 */

import { prisma } from './database/prisma.service';
import { notificationEventService } from './notification-event.service';
import { loggerService } from './logging/logger.service';
import { emailService } from './email/email.service';
import { isSkipped, resolveTemplate } from './email/template-resolver.service';
import { wishLinkedDescriptor } from './email/template-descriptors';
import { generateUnsubscribeUrl } from './notification-unsubscribe.service';
import { createEmailLog, recordSkippedEmail, updateEmailLogStatus } from './email/email-log.service';
import { EMAIL_TYPES, EMAIL_STATUS } from '../types/email';
import { NOTIFICATION_TYPES } from '../constants/notification-type';

/** notification_preferences 中代表 email 的 channel 值（與 digest worker 一致） */
const EMAIL_CHANNEL = 'N01';

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

/**
 * 即時寄送「許願被採納」email 至 contact_email（無則帳號 email）。
 * best-effort：錯誤只 log、不影響主流程；不通知自己；尊重 email 偏好。
 */
async function sendWishLinkedEmail(params: NotifyWishLinkedParams): Promise<void> {
  const { wisherUserId, actorUserId, itemTitle, contactEmail } = params;

  if (wisherUserId === actorUserId) return; // 不通知自己

  try {
    const user = await prisma.users.findUnique({
      where: { id: wisherUserId },
      select: { nickname: true, contacts: { select: { email: true } } },
    });

    const to = contactEmail ?? user?.contacts?.email ?? null;
    if (!to) return;

    // 尊重 email 偏好（未設定預設開啟，與 digest worker 一致）
    const pref = await prisma.notification_preferences.findFirst({
      where: { user_id: wisherUserId, channel: EMAIL_CHANNEL, notification_type: NOTIFICATION_TYPES.WISH_LINKED },
      select: { is_enabled: true },
    });
    if (pref?.is_enabled === false) return;

    const resolved = await resolveTemplate(wishLinkedDescriptor, {
      recipientName: user?.nickname ?? '島島夥伴',
      itemTitle,
      url: roadmapUrl(),
      unsubscribeUrl: generateUnsubscribeUrl(wisherUserId, 'wish.linked'),
    });

    // 後台停用此模板時不寄，記一筆 skipped（daodao#236 AC-02）
    if (isSkipped(resolved)) {
      await recordSkippedEmail({
        userId: wisherUserId,
        emailType: EMAIL_TYPES.NOTIFICATION,
        subject: '你的許願已被島島採納 🎉',
      });
      return;
    }

    const { subject, html } = resolved;

    let log: { id: number; tracking_token: string | null } | null = null;
    try {
      log = await createEmailLog({
        userId: wisherUserId,
        emailType: EMAIL_TYPES.NOTIFICATION,
        subject,
        status: EMAIL_STATUS.PENDING,
      });
    } catch {
      log = null;
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      trackingToken: log?.tracking_token ?? undefined,
    });

    if (log) {
      await updateEmailLogStatus(
        log.id,
        result.success ? EMAIL_STATUS.SENT : EMAIL_STATUS.FAILED,
      ).catch(() => {});
    }
  } catch (error) {
    loggerService.error('wishpool: sendWishLinkedEmail failed', {
      wisherUserId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function notifyWishLinked(params: NotifyWishLinkedParams): Promise<void> {
  const { wisherUserId, actorUserId, itemId, itemTitle } = params;

  // 站內通知（沿用 notification_events → in-app worker）
  await notificationEventService.createEvent({
    type: NOTIFICATION_TYPES.WISH_LINKED,
    actorId: actorUserId,
    recipientId: wisherUserId,
    entityType: 'roadmap_item',
    entityId: itemId,
    payload: { entityTitle: itemTitle, url: roadmapUrl() },
    priority: 'P1',
  });

  // Email：即時寄到 contact_email；best-effort、不阻塞主流程
  void sendWishLinkedEmail(params).catch((error) => {
    loggerService.error('wishpool: sendWishLinkedEmail unhandled', {
      error: error instanceof Error ? error.message : String(error),
    });
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
  const batchSize = 100;
  for (let i = 0; i < supporters.length; i += batchSize) {
    const batch = supporters.slice(i, i + batchSize);
    await Promise.all(
      batch.map((s) =>
        notificationEventService.createEvent({
          type: NOTIFICATION_TYPES.ROADMAP_SHIPPED,
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
}

export const wishpoolNotificationService = {
  notifyWishLinked,
  notifyRoadmapShipped,
};
