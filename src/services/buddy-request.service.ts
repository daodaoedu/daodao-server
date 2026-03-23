/**
 * Buddy Request Service
 * Buddy 請求系統業務邏輯：針對特定實踐發送學習夥伴請求
 *
 * 核心設計：
 * - 防重複：同一 (requester, receiver, practice) 只能有一筆 pending
 * - 建立後發送 P1 通知事件給接收者
 * - Fan-out 給請求者所有追蹤者（P1 BuddyRequestFollower）
 * - 接受後通知請求者 P1 BuddyAccepted 事件
 */

import { prisma } from './database/prisma.service';
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

export interface BuddyRequestItem {
  requestId:           number;
  requesterExternalId: string;
  requesterNickname:   string | null;
  practiceId:          number;
  practiceTitle:       string;
  createdAt:           string;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * 發送 Buddy 請求
 * 1. 查詢 practice 確認存在並取得 practiceId 與 practice title
 * 2. 查詢 receiver 確認存在
 * 3. 防重複：同一 (requester, receiver, practice) 只能有一筆 pending
 * 4. 寫入 practice_buddy_requests 表（status='pending'）
 * 5. 通知被請求方（P1 BuddyRequest 事件）
 * 6. Fan-out 給請求者的所有追蹤者（P1 BuddyRequestFollower）
 */
const createBuddyRequest = async (
  requesterId:          number,
  practiceExternalId:   string,
  receiverExternalId:   string,
): Promise<ApiSuccessResponse<{ message: string }>> => {
  // 1. 查詢 practice
  const practice = await prisma.practices.findFirst({
    where: { external_id: practiceExternalId },
    select: { id: true, title: true },
  });
  if (!practice) throw new NotFoundError('找不到指定的實踐');

  const practiceId    = practice.id;
  const practiceTitle = practice.title;

  // 2. 查詢 receiver
  const receiver = await prisma.users.findFirst({
    where: { external_id: receiverExternalId },
    select: { id: true },
  });
  if (!receiver) throw new NotFoundError('找不到指定的用戶');

  const receiverId = receiver.id;

  // 自我請求防護
  if (requesterId === receiverId) {
    throw new BadRequestError('無法向自己發送 Buddy 請求');
  }

  // 3. 防重複：同一 (requester, receiver, practice) 只能有一筆 pending
  const existing = await prisma.practice_buddy_requests.findFirst({
    where: {
      requester_id: requesterId,
      receiver_id:  receiverId,
      practice_id:  practiceId,
      status:       'pending',
    },
  });
  if (existing) throw new BadRequestError('已有待處理的 Buddy 請求');

  // 4. 寫入 practice_buddy_requests 表
  const newRequest = await prisma.practice_buddy_requests.create({
    data: {
      requester_id: requesterId,
      receiver_id:  receiverId,
      practice_id:  practiceId,
      status:       'pending',
    },
  });

  // 5. 通知被請求方（P1 BuddyRequest）
  void notificationEventService.createEvent({
    type:        'BuddyRequest',
    actorId:     requesterId,
    recipientId: receiverId,
    entityType:  'buddy_request',
    entityId:    newRequest.id,
    payload:     { practice_id: practiceId, practice_title: practiceTitle },
    priority:    'P1',
  });

  // 6. Fan-out 給請求者的所有追蹤者（P1 BuddyRequestFollower）
  const followers = await prisma.follows.findMany({
    where: {
      target_type: 'user',
      target_id:   requesterId,
    },
    select: { follower_id: true },
  });

  for (const { follower_id } of followers) {
    void notificationEventService.createEvent({
      type:        'BuddyRequestFollower',
      actorId:     requesterId,
      recipientId: follower_id,
      entityType:  'buddy_request',
      entityId:    newRequest.id,
      payload:     { practice_id: practiceId, practice_title: practiceTitle },
      priority:    'P1',
    });
  }

  return createSuccessResponse({ message: 'Buddy 請求已送出' });
};

/**
 * 更新 Buddy 請求狀態（接受或忽略）
 * 1. 查詢確認 request 存在且 receiverId 是 receiver_id
 * 2. 更新 status
 * 3. 若 status='accepted'：通知 requester P1 BuddyAccepted 事件
 */
const updateBuddyRequest = async (
  requestId:  number,
  receiverId: number,
  status:     'accepted' | 'ignored',
): Promise<ApiSuccessResponse<{ message: string }>> => {
  // 1. 查詢確認 request 存在且 receiverId 符合
  const request = await prisma.practice_buddy_requests.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new NotFoundError('找不到指定的 Buddy 請求');
  if (request.receiver_id !== receiverId) throw new ForbiddenError('無權操作此請求');
  if (request.status !== 'pending') throw new BadRequestError('此請求已被處理');

  // 2. 更新 status
  await prisma.practice_buddy_requests.update({
    where: { id: requestId },
    data:  { status },
  });

  // 3. 若接受，通知請求者 P1 BuddyAccepted 事件
  if (status === 'accepted') {
    void notificationEventService.createEvent({
      type:        'BuddyAccepted',
      actorId:     receiverId,
      recipientId: request.requester_id,
      entityType:  'buddy_request',
      entityId:    requestId,
      payload:     { practice_id: request.practice_id },
      priority:    'P1',
    });
  }

  const message = status === 'accepted' ? 'Buddy 請求已接受' : 'Buddy 請求已忽略';
  return createSuccessResponse({ message });
};

/**
 * 查詢當前用戶收到的待處理 Buddy 請求列表（作為 receiver）
 */
const getPendingIncoming = async (
  receiverId: number,
  page:       number,
  limit:      number,
): Promise<PaginatedApiResponse<BuddyRequestItem>> => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.practice_buddy_requests.findMany({
      where: { receiver_id: receiverId, status: 'pending' },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        requester: {
          select: { external_id: true, nickname: true },
        },
        practices: {
          select: { id: true, title: true },
        },
      },
    }),
    prisma.practice_buddy_requests.count({
      where: { receiver_id: receiverId, status: 'pending' },
    }),
  ]);

  const data: BuddyRequestItem[] = items.map((item) => ({
    requestId:           item.id,
    requesterExternalId: item.requester.external_id ?? '',
    requesterNickname:   item.requester.nickname ?? null,
    practiceId:          item.practices.id,
    practiceTitle:       item.practices.title,
    createdAt:           (item.created_at ?? new Date()).toISOString(),
  }));

  const pagination = calculatePagination(page, limit, total);
  return createPaginatedResponse(data, pagination);
};

// ============================================================================
// Export
// ============================================================================

export const buddyRequestService = {
  createBuddyRequest,
  updateBuddyRequest,
  getPendingIncoming,
};
