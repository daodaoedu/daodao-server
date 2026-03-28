/**
 * Connection Service
 * 連結系統業務邏輯：雙向、高承諾的夥伴關係
 *
 * 核心設計：
 * - 動態門檻：互動 < 3 次須填寫連結原因；>= 3 次可信任豁免
 * - 並發請求自動合併：A→B 與 B→A 同時發出時，直接建立連結
 * - connections 表的所有讀寫均以 (min(a,b), max(a,b)) 正規化 ID
 */

import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import { externalToInternalId } from './id-converter.service';
import { interactionCountService } from './interaction-count.service';
import { notificationEventService } from './notification-event.service';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../middleware/error.middleware';
import {
  createSuccessResponse,
  createPaginatedResponse,
} from '../utils/response-helper';
import { calculatePagination } from '../utils/pagination-helper';
import type { ApiSuccessResponse, PaginatedApiResponse } from '../types/api-response.types';

// ============================================================================
// Types
// ============================================================================

export interface ConnectionItem {
  connectionId: number;
  userId:       number;
  externalId:   string;
  nickname:     string | null;
  photoUrl:     string | null;
  connectedAt:  string;
}

export interface ConnectionRequestItem {
  requestId:           number;
  requesterExternalId: string;
  requesterNickname:   string | null;
  requesterPhotoUrl:   string | null;
  receiverExternalId:  string;
  receiverNickname:    string | null;
  receiverPhotoUrl:    string | null;
  intent:              string | null;
  interactionCount:    number;
  createdAt:           string;
}

// ============================================================================
// Helpers
// ============================================================================

const normalizePair = (x: number, y: number) => ({
  a: Math.min(x, y),
  b: Math.max(x, y),
});

// ============================================================================
// Service Functions
// ============================================================================

/**
 * 發送連結請求
 * - 自我連結防護
 * - 動態門檻：互動 < 3 次時，intent 為必填
 * - 並發請求自動合併：B→A 已存在 pending 時，直接 accept
 */
const sendRequest = async (
  requesterId:       number,
  receiverExternalId: string,
  intent?:           string,
  contextPracticeExternalId?: string
): Promise<ApiSuccessResponse<{ message: string }>> => {
  if (!receiverExternalId) throw new BadRequestError('需要提供收件者 ID');

  const receiverId = await externalToInternalId('user', receiverExternalId);

  // 自我連結防護
  if (requesterId === receiverId) {
    throw new BadRequestError('無法連結自己');
  }

  // 已連結？
  const { a, b } = normalizePair(requesterId, receiverId);
  const existing = await prisma.connections.findUnique({
    where: { user_a_id_user_b_id: { user_a_id: a, user_b_id: b } },
  });
  if (existing) {
    throw new BadRequestError('已經是夥伴關係');
  }

  // 動態門檻：互動 < 3 次須填寫 intent
  const bypass = await interactionCountService.hasFamiliarityBypass(requesterId, receiverId);
  if (!bypass && (!intent || intent.trim().length === 0)) {
    throw new BadRequestError('互動次數未達門檻，請填寫連結原因');
  }

  // 情境實踐 ID（選填）
  let contextPracticeId: number | undefined;
  if (contextPracticeExternalId) {
    contextPracticeId = await externalToInternalId('practice', contextPracticeExternalId);
  }

  // 並發請求合併：檢查 B→A 是否已有 pending
  const reverseRequest = await prisma.connection_requests.findUnique({
    where: {
      requester_id_receiver_id: {
        requester_id: receiverId,
        receiver_id:  requesterId,
      },
    },
  });

  if (reverseRequest && reverseRequest.status === 'pending') {
    // 直接合併為連結
    await prisma.$transaction([
      prisma.connection_requests.update({
        where: { id: reverseRequest.id },
        data:  { status: 'accepted', updated_at: new Date() },
      }),
      prisma.connections.create({
        data: { user_a_id: a, user_b_id: b },
      }),
    ]);
    return createSuccessResponse({ message: '對方已向你發出連結請求，已自動建立夥伴關係' });
  }

  // 正常建立請求（upsert 防止重複）
  const upsertedRequest = await prisma.connection_requests.upsert({
    where: {
      requester_id_receiver_id: {
        requester_id: requesterId,
        receiver_id:  receiverId,
      },
    },
    update: {
      status:              'pending',
      intent:              intent?.trim() ?? null,
      context_practice_id: contextPracticeId ?? null,
      updated_at:          new Date(),
    },
    create: {
      requester_id:        requesterId,
      receiver_id:         receiverId,
      intent:              intent?.trim() ?? null,
      status:              'pending',
      context_practice_id: contextPracticeId ?? null,
    },
  });

  // Enqueue connect.request notification to followers of requester
  // Only for new requests (created_at equals updated_at), not re-sends
  const isNewRequest =
    upsertedRequest.created_at !== null &&
    upsertedRequest.updated_at !== null &&
    upsertedRequest.created_at.getTime() === upsertedRequest.updated_at.getTime();
  if (isNewRequest) {
    try {
      const { enqueueSocialNotification } = await import('../queues/social-notification.queue');
      const followers = await prisma.follows.findMany({
        where: { target_type: 'user', target_id: requesterId },
        select: { follower_id: true }
      });
      for (const follower of followers) {
        if (follower.follower_id === requesterId) continue;
        await enqueueSocialNotification({
          event: 'connect.request',
          actorId: requesterId,
          recipientId: follower.follower_id,
          payload: { receiverId }
        });
      }
    } catch (e) {
      loggerService.warn('Failed to enqueue connect.request notification', { requesterId, receiverId, error: e });
    }
  }

  // Fire-and-forget: P1 Connect event
  prisma.users.findUnique({ where: { id: requesterId }, select: { nickname: true } })
    .then(actor => notificationEventService.createEvent({
      type: 'Connect',
      actorId: requesterId,
      recipientId: receiverId,
      entityType: 'connection',
      entityId: upsertedRequest.id,
      payload: { actorName: actor?.nickname ?? null, intent: intent?.trim() ?? null, connection_request_id: upsertedRequest.id, url: `${process.env.FRONTEND_URL ?? 'https://app.daodao.so'}/connections` },
      priority: 'P1',
    }))
    .catch(() => {});

  return createSuccessResponse({ message: '連結請求已送出' });
};

/**
 * 接受連結請求
 */
const acceptRequest = async (
  currentUserId: number,
  requestId:     number
): Promise<ApiSuccessResponse<{ message: string }>> => {
  const request = await prisma.connection_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new NotFoundError('連結請求不存在');
  if (request.receiver_id !== currentUserId) throw new ForbiddenError('無權操作此請求');
  if (request.status !== 'pending') throw new BadRequestError('此請求已被處理');

  const { a, b } = normalizePair(request.requester_id, request.receiver_id);

  await prisma.$transaction([
    prisma.connection_requests.update({
      where: { id: requestId },
      data:  { status: 'accepted', updated_at: new Date() },
    }),
    prisma.connections.upsert({
      where:  { user_a_id_user_b_id: { user_a_id: a, user_b_id: b } },
      update: {},
      create: { user_a_id: a, user_b_id: b },
    }),
  ]);

  // Fire-and-forget: P1 ConnectAccepted event — notify the original requester
  prisma.users.findUnique({ where: { id: currentUserId }, select: { nickname: true } })
    .then(actor => notificationEventService.createEvent({
      type: 'ConnectAccepted',
      actorId: currentUserId,
      recipientId: request.requester_id,
      entityType: 'connection',
      entityId: requestId,
      payload: { actorName: actor?.nickname ?? null, url: `${process.env.FRONTEND_URL ?? 'https://app.daodao.so'}/connections` },
      priority: 'P1',
    }))
    .catch(() => {});

  // 更新接收者的 Connect 通知狀態，讓重整後仍顯示「已同意」
  prisma.notifications.updateMany({
    where: { recipient_id: currentUserId, type: 'Connect', entity_id: requestId },
    data:  { type: 'connect-agree' },
  }).catch(() => {});

  return createSuccessResponse({ message: '已接受連結請求' });
};

/**
 * 拒絕連結請求（對方不會收到拒絕通知）
 */
const rejectRequest = async (
  currentUserId: number,
  requestId:     number
): Promise<ApiSuccessResponse<{ message: string }>> => {
  const request = await prisma.connection_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new NotFoundError('連結請求不存在');
  if (request.receiver_id !== currentUserId) throw new ForbiddenError('無權操作此請求');
  if (request.status !== 'pending') throw new BadRequestError('此請求已被處理');

  await prisma.connection_requests.update({
    where: { id: requestId },
    data:  { status: 'rejected', updated_at: new Date() },
  });

  // 更新接收者的 Connect 通知狀態，讓重整後仍顯示「已忽略」
  prisma.notifications.updateMany({
    where: { recipient_id: currentUserId, type: 'Connect', entity_id: requestId },
    data:  { type: 'connect-rejected' },
  }).catch(() => {});

  return createSuccessResponse({ message: '已忽略連結請求' });
};

/**
 * 撤回自己發出的連結請求
 */
const withdrawRequest = async (
  requesterId: number,
  requestId:   number
): Promise<ApiSuccessResponse<{ message: string }>> => {
  const request = await prisma.connection_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new NotFoundError('連結請求不存在');
  if (request.requester_id !== requesterId) throw new ForbiddenError('無權撤回此請求');
  if (request.status !== 'pending') throw new BadRequestError('此請求已被處理，無法撤回');

  await prisma.connection_requests.delete({ where: { id: requestId } });

  return createSuccessResponse({ message: '已撤回連結請求' });
};

/**
 * 解除連結（任一方皆可）
 * 解除後雙方立即失去對彼此非公開內容的存取權
 */
const disconnect = async (
  currentUserId:    number,
  targetExternalId: string
): Promise<ApiSuccessResponse<{ message: string }>> => {
  const targetId = await externalToInternalId('user', targetExternalId);
  const { a, b } = normalizePair(currentUserId, targetId);

  const connection = await prisma.connections.findUnique({
    where: { user_a_id_user_b_id: { user_a_id: a, user_b_id: b } },
  });

  if (!connection) throw new NotFoundError('尚未建立夥伴關係');

  await prisma.connections.delete({
    where: { user_a_id_user_b_id: { user_a_id: a, user_b_id: b } },
  });

  return createSuccessResponse({ message: '已解除連結' });
};

/**
 * 取得我的夥伴列表
 */
const getConnections = async (
  userId: number,
  page:   number,
  limit:  number
): Promise<PaginatedApiResponse<ConnectionItem>> => {
  const [total, rows] = await Promise.all([
    prisma.connections.count({
      where: { OR: [{ user_a_id: userId }, { user_b_id: userId }] },
    }),
    prisma.connections.findMany({
      where:   { OR: [{ user_a_id: userId }, { user_b_id: userId }] },
      orderBy: { connected_at: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
  ]);

  // 取得對方用戶資訊
  const partnerIds = rows.map(r => (r.user_a_id === userId ? r.user_b_id : r.user_a_id));
  const partners = await prisma.users.findMany({
    where:  { id: { in: partnerIds } },
    select: { id: true, external_id: true, nickname: true, contacts: { select: { photo_url: true } } },
  });
  const partnerMap = new Map(partners.map(u => [u.id, u]));

  const items: ConnectionItem[] = rows.map(r => {
    const partnerId = r.user_a_id === userId ? r.user_b_id : r.user_a_id;
    const partner   = partnerMap.get(partnerId);
    return {
      connectionId: r.id,
      userId:       partnerId,
      externalId:   partner?.external_id ?? '',
      nickname:     partner?.nickname ?? null,
      photoUrl:     partner?.contacts?.photo_url ?? null,
      connectedAt:  (r.connected_at ?? new Date()).toISOString(),
    };
  });

  const pagination = calculatePagination(page, limit, total);
  return createPaginatedResponse(items, pagination);
};

/**
 * 取得收到的待處理連結請求
 */
const getPendingIncoming = async (
  userId: number,
  page:   number,
  limit:  number
): Promise<PaginatedApiResponse<ConnectionRequestItem>> => {
  const [total, rows] = await Promise.all([
    prisma.connection_requests.count({
      where: { receiver_id: userId, status: 'pending' },
    }),
    prisma.connection_requests.findMany({
      where:   { receiver_id: userId, status: 'pending' },
      orderBy: { created_at: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        requester: { select: { id: true, external_id: true, nickname: true, contacts: { select: { photo_url: true } } } },
      },
    }),
  ]);

  const items: ConnectionRequestItem[] = await Promise.all(
    rows.map(async r => {
      const interactionCount = await interactionCountService.getCount(r.requester_id, userId);
      return {
        requestId:           r.id,
        requesterExternalId: r.requester.external_id ?? '',
        requesterNickname:   r.requester.nickname ?? null,
        requesterPhotoUrl:   r.requester.contacts?.photo_url ?? null,
        receiverExternalId:  '',
        receiverNickname:    null,
        receiverPhotoUrl:    null,
        intent:              r.intent ?? null,
        interactionCount,
        createdAt:           (r.created_at ?? new Date()).toISOString(),
      };
    })
  );

  const pagination = calculatePagination(page, limit, total);
  return createPaginatedResponse(items, pagination);
};

/**
 * 取得發出的連結請求
 */
const getPendingOutgoing = async (
  userId: number,
  page:   number,
  limit:  number
): Promise<PaginatedApiResponse<ConnectionRequestItem>> => {
  const [total, rows] = await Promise.all([
    prisma.connection_requests.count({
      where: { requester_id: userId, status: 'pending' },
    }),
    prisma.connection_requests.findMany({
      where:   { requester_id: userId, status: 'pending' },
      orderBy: { created_at: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        receiver: { select: { id: true, external_id: true, nickname: true, contacts: { select: { photo_url: true } } } },
      },
    }),
  ]);

  const items: ConnectionRequestItem[] = rows.map(r => ({
    requestId:           r.id,
    requesterExternalId: '',
    requesterNickname:   null,
    requesterPhotoUrl:   null,
    receiverExternalId:  r.receiver.external_id ?? '',
    receiverNickname:    r.receiver.nickname ?? null,
    receiverPhotoUrl:    r.receiver.contacts?.photo_url ?? null,
    intent:              r.intent ?? null,
    interactionCount:    0,
    createdAt:           (r.created_at ?? new Date()).toISOString(),
  }));

  const pagination = calculatePagination(page, limit, total);
  return createPaginatedResponse(items, pagination);
};

/**
 * 檢查兩個用戶是否已連結
 */
const isConnected = async (userX: number, userY: number): Promise<boolean> => {
  const { a, b } = normalizePair(userX, userY);
  const connection = await prisma.connections.findUnique({
    where: { user_a_id_user_b_id: { user_a_id: a, user_b_id: b } },
  });
  return connection !== null;
};

// ============================================================================
// Export
// ============================================================================

export const connectionService = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  withdrawRequest,
  disconnect,
  getConnections,
  getPendingIncoming,
  getPendingOutgoing,
  isConnected,
};
