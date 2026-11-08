/**
 * Notification Controller
 * 處理通知偏好設定及通知列表的 HTTP 請求
 */

import { Request, Response } from 'express';
import type { Prisma } from '../../generated/prisma';
import { asyncHandler, UnauthorizedError, NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { notificationPreferenceService } from '../services/notification-preference.service';
import { verifyUnsubscribeToken } from '../services/notification-unsubscribe.service';
import { prisma } from '../services/database/prisma.service';
import { NOTIFICATION_TYPES } from '../constants/notification-type';
import { createSuccessResponse } from '../utils/response-helper';

// ============================================================================
// Preferences
// ============================================================================

/**
 * GET /api/v1/notifications/preferences
 * 取得當前用戶通知偏好設定
 */
export const getPreferences = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const result = await notificationPreferenceService.getPreferences(req.user.id);
  res.json(result);
});

/**
 * PUT /api/v1/notifications/preferences
 * 批次更新通知偏好設定，或使用全局開關
 *
 * Body（擇一或同時）：
 *   - globalEnabled: boolean              → 全局開關（N01、N03）
 *   - preferences: [{type, channel, isEnabled}] → 逐筆更新
 *
 * N02 (InApp) 固定開啟，任何對 N02 的 isEnabled 更新都會被忽略。
 */
export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const userId = req.user.id;
  const { globalEnabled, preferences } = req.body as {
    globalEnabled?: boolean;
    preferences?:  { type: string; channel: string; isEnabled: boolean }[];
  };

  // 全局開關
  if (typeof globalEnabled === 'boolean') {
    const result = await notificationPreferenceService.setGlobalEnabled(userId, globalEnabled);
    res.json(result);
    return;
  }

  // 批次更新（N02 直接忽略）
  if (Array.isArray(preferences) && preferences.length > 0) {
    const filtered = preferences.filter(p => p.channel !== 'N02');

    await Promise.all(
      filtered.map(p =>
        notificationPreferenceService.updatePreference(userId, p.type, p.channel, p.isEnabled)
      )
    );

    const result = await notificationPreferenceService.getPreferences(userId);
    res.json(result);
    return;
  }

  // body 為空或無效
  res.json(await notificationPreferenceService.getPreferences(userId));
});

// ============================================================================
// Notifications
// ============================================================================

/**
 * GET /api/v1/notifications
 * 列出當前用戶的 In-App 通知
 * - P1 優先，再依 created_at DESC
 * - cursor 分頁：?cursor=<id>&limit=20
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const userId  = req.user.id;
  const limit   = Math.min(parseInt(String(req.query.limit ?? '20'), 10) || 20, 100);
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

  const where: Prisma.notificationsWhereInput = {
    recipient_id: userId,
    type: { not: NOTIFICATION_TYPES.COHORT_WEEKLY_DIGEST },
  };

  if (cursor) {
    let parsed: { p: string; c: string; id: number };
    try {
      parsed = JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch {
      throw new BadRequestError('Invalid cursor');
    }
    const { p, c, id } = parsed;
    where.AND = [
      {
        OR: [
          { priority: { gt: p } },
          { priority: p, created_at: { lt: new Date(c) } },
          { priority: p, created_at: { lte: new Date(c) }, id: { lt: id } },
        ]
      }
    ];
  }

  // 查詢 limit + 1 筆，用來判斷是否有下一頁
  const rows = await prisma.notifications.findMany({
    where,
    orderBy: [
      { priority:   'asc' },   // P1 < P2，字母升冪即 P1 優先
      { created_at: 'desc' },
      { id:         'desc' },  // tiebreaker，確保排序唯一性
    ],
    take: limit + 1,
    select: {
      id:               true,
      type:             true,
      entity_type:      true,
      entity_id:        true,
      priority:         true,
      is_read:          true,
      aggregation_key:  true,
      aggregation_count: true,
      payload:          true,
      created_at:       true,
      actor: {
        select: {
          external_id: true,
          nickname:    true,
          custom_id:   true,
          contacts: {
            select: {
              photo_url: true,
            },
          },
        },
      },
    },
  });

  const hasNext    = rows.length > limit;
  const items      = hasNext ? rows.slice(0, limit) : rows;
  const lastItem = items[items.length - 1];
  const nextCursor = hasNext
    ? Buffer.from(JSON.stringify({
        p: lastItem.priority,
        c: (lastItem.created_at ?? new Date()).toISOString(),
        id: lastItem.id
      })).toString('base64')
    : null;

  // 查詢未讀通知數（不受 cursor 分頁影響，始終返回全量未讀數）
  const unreadCount = await prisma.notifications.count({
    where: { recipient_id: userId, is_read: false, type: { not: NOTIFICATION_TYPES.COHORT_WEEKLY_DIGEST } },
  });

  // 對 payload 缺少 entity_external_id 的 practice 通知，批次補查 external_id
  const missingExternalIdPracticeIds = items
    .filter((row) => {
      const p = (row.payload ?? {}) as Record<string, unknown>;
      return row.entity_type === 'practice' && !p.entity_external_id;
    })
    .map((row) => row.entity_id);

  const practiceExternalIdMap = new Map<number, string>();
  if (missingExternalIdPracticeIds.length > 0) {
    const practices = await prisma.practices.findMany({
      where: { id: { in: missingExternalIdPracticeIds } },
      select: { id: true, external_id: true },
    });
    for (const p of practices) {
      if (p.external_id) practiceExternalIdMap.set(p.id, p.external_id);
    }
  }

  // 對 payload 缺少 entity_external_id 的 comment 通知，補查對應 practice/checkin metadata
  const missingExternalIdCommentIds = items
    .filter((row) => {
      const p = (row.payload ?? {}) as Record<string, unknown>;
      return row.entity_type === 'comment' && !p.entity_external_id;
    })
    .map((row) => row.entity_id);

  const commentMetadataMap = new Map<number, { entityExternalId?: string; checkinId?: number }>();
  if (missingExternalIdCommentIds.length > 0) {
    const comments = await prisma.comments.findMany({
      where: {
        id: { in: missingExternalIdCommentIds },
        target_type: { in: ['practice', 'checkin'] },
      },
      select: { id: true, target_type: true, target_id: true },
    });

    const practiceCommentIds = comments
      .filter((comment) => comment.target_type === 'practice')
      .map((comment) => comment.target_id);
    const checkinIds = comments
      .filter((comment) => comment.target_type === 'checkin')
      .map((comment) => comment.target_id);
    const practiceIds = [...new Set(practiceCommentIds)];
    if (practiceIds.length > 0) {
      const practices = await prisma.practices.findMany({
        where: { id: { in: practiceIds } },
        select: { id: true, external_id: true },
      });
      const practiceIdMap = new Map(
        practices
          .filter((practice) => Boolean(practice.external_id))
          .map((practice) => [practice.id, practice.external_id as string])
      );

      for (const comment of comments.filter((item) => item.target_type === 'practice')) {
        const externalId = practiceIdMap.get(comment.target_id);
        if (externalId) {
          commentMetadataMap.set(comment.id, { entityExternalId: externalId });
        }
      }
    }

    if (checkinIds.length > 0) {
      const checkins = await prisma.practice_checkins.findMany({
        where: { id: { in: [...new Set(checkinIds)] } },
        select: {
          id: true,
          practices: {
            select: { external_id: true },
          },
        },
      });
      const checkinMap = new Map(
        checkins.map((checkin) => [
          checkin.id,
          checkin.practices?.external_id
            ? { entityExternalId: checkin.practices.external_id, checkinId: checkin.id }
            : { checkinId: checkin.id },
        ])
      );

      for (const comment of comments.filter((item) => item.target_type === 'checkin')) {
        const metadata = checkinMap.get(comment.target_id);
        if (metadata) {
          commentMetadataMap.set(comment.id, metadata);
        }
      }
    }
  }

  /** 將 payload JSONB 展開為前端所需欄位 */
  const notifications = items.map((row) => {
    const p = (row.payload ?? {}) as Record<string, unknown>;
    // 補查表以 entity_id 為 key，只能套用在同類型的通知上；否則其他類型（如 feedback）的 id
    // 撞到同頁 practice／comment 的 id 時會被換成別的實體（daodao#451）
    const commentMetadata = row.entity_type === 'comment' ? commentMetadataMap.get(row.entity_id) : undefined;
    const practiceExternalId = row.entity_type === 'practice' ? practiceExternalIdMap.get(row.entity_id) : undefined;
    // 優先使用 payload 中的 external_id，否則查補查表，最後 fallback 到 entity_id
    const entityId =
      (p.entity_external_id as string | undefined) ??
      commentMetadata?.entityExternalId ??
      practiceExternalId ??
      String(row.entity_id);
    return {
      id:               row.id,
      type:             row.type,
      entityType:       row.entity_type,
      entityId,
      priority:         row.priority as 'P1' | 'P2',
      isRead:           row.is_read ?? false,
      aggregationCount: row.aggregation_count ?? 1,
      createdAt:        row.created_at,
      actor: {
        id:       row.actor.external_id ?? '',
        name:     row.actor.nickname ?? '',
        photoURL: row.actor.contacts?.photo_url ?? undefined,
        customId: row.actor.custom_id ?? null,
      },
      ...(p.practice_title !== undefined        && { practiceTitle:        p.practice_title as string }),
      ...(p.intent !== undefined                && { connectMessage:        p.intent as string }),
      ...(p.content !== undefined               && { content:               p.content as string }),
      ...(p.connection_request_id !== undefined && { connectionRequestId:   p.connection_request_id as number }),
      ...(p.reactionType !== undefined          && { reactionType:          p.reactionType as string }),
      ...(typeof p.url === 'string'             && { url: p.url }),
      ...(typeof p.cohortName === 'string'      && { cohortName: p.cohortName }),
      ...(typeof p.message === 'string'         && { message: p.message }),
      ...(typeof p.entityTitle === 'string'     && { entityTitle: p.entityTitle }),
      ...(row.entity_type === 'buddy_request'   && { buddyRequestId:        row.entity_id }),
      ...((p.checkinId !== undefined || commentMetadata?.checkinId !== undefined) && {
        checkinId: (p.checkinId as number | undefined) ?? commentMetadata?.checkinId,
      }),
      ...(row.entity_type === 'checkin'         && { checkinId:             row.entity_id }),
    };
  });

  res.json(createSuccessResponse({
    notifications,
    nextCursor,
    unreadCount,
  }));
});

/**
 * PATCH /api/v1/notifications/:id/read
 * 標記單則通知為已讀
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const userId         = req.user.id;
  const notificationId = parseInt(req.params.id, 10);

  const notification = await prisma.notifications.findUnique({
    where:  { id: notificationId },
    select: { id: true, recipient_id: true },
  });

  if (!notification || notification.recipient_id !== userId) {
    throw new NotFoundError('通知不存在');
  }

  await prisma.notifications.update({
    where: { id: notificationId },
    data:  { is_read: true },
  });

  res.json(createSuccessResponse({ id: notificationId, isRead: true }));
});

// ============================================================================
// 退訂
// ============================================================================

/** 島島阿學 Frontend URL */
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://app.daodao.so';

/** 通知設定頁 URL */
const SETTINGS_URL = `${FRONTEND_URL}/settings/notifications`;

/**
 * GET /api/v1/notifications/unsubscribe?token=<jwt>
 * 驗證退訂 token 並更新偏好設定，回傳 HTML 結果頁
 *
 * 不需要登入驗證（公開路由）。
 */
export const unsubscribeEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';

  const payload = token ? verifyUnsubscribeToken(token) : null;

  if (!payload) {
    // token 無效或已過期
    res.status(400).send(`<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>退訂連結已過期 - 島島阿學</title>
  <style>
    body { font-family: 'Noto Sans TC', Arial, sans-serif; background: #F5FFFD; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border-radius: 12px; padding: 48px 40px; max-width: 440px; text-align: center; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
    h1 { color: #0D3036; font-size: 22px; margin: 0 0 16px; }
    p { color: #295E5C; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; background: #16B9B3; color: #0D3036; text-decoration: none; padding: 12px 28px; border-radius: 24px; font-weight: 600; font-size: 15px; }
    .icon { font-size: 40px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⏰</div>
    <h1>退訂連結已過期</h1>
    <p>這個退訂連結已過期或無效。<br>你可以前往設定頁手動管理通知偏好。</p>
    <a href="${SETTINGS_URL}">前往通知設定</a>
  </div>
</body>
</html>`);
    return;
  }

  // token 有效：更新偏好設定（停用該通知類型的 email channel）
  // 'digest' 為摘要 email 特殊類型，退訂代表關閉所有 email 通知
  if (payload.notificationType === 'digest') {
    await notificationPreferenceService.setGlobalEnabled(payload.userId, false);
  } else {
    await notificationPreferenceService.updatePreference(
      payload.userId,
      payload.notificationType,
      'N01',
      false
    );
  }

  res.status(200).send(`<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>已成功取消訂閱 - 島島阿學</title>
  <style>
    body { font-family: 'Noto Sans TC', Arial, sans-serif; background: #F5FFFD; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border-radius: 12px; padding: 48px 40px; max-width: 440px; text-align: center; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
    h1 { color: #0D3036; font-size: 22px; margin: 0 0 16px; }
    p { color: #295E5C; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; background: #16B9B3; color: #0D3036; text-decoration: none; padding: 12px 28px; border-radius: 24px; font-weight: 600; font-size: 15px; }
    .icon { font-size: 40px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>已成功取消訂閱</h1>
    <p>你已成功取消此類型的 Email 通知。<br>如果想重新啟用，或管理其他通知設定，請前往設定頁。</p>
    <a href="${SETTINGS_URL}">前往通知設定</a>
  </div>
</body>
</html>`);
});

/**
 * PATCH /api/v1/notifications/read-all
 * 將當前用戶所有未讀通知標記為已讀
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');

  const userId = req.user.id;

  const { count } = await prisma.notifications.updateMany({
    where: { recipient_id: userId, is_read: false },
    data:  { is_read: true },
  });

  res.json(createSuccessResponse({ updated: count }));
});
