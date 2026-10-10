/**
 * Follow Service
 * 關注系統業務邏輯：支援關注「用戶」或「主題實踐」
 * 關注為單向、低承諾行為，無需對方同意
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { externalToInternalId } from './id-converter.service';
import { notificationEventService } from './notification-event.service';
import { NOTIFICATION_TYPES } from '../constants/notification-type';
import {
  BadRequestError,
  NotFoundError,
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

export interface FollowUserItem {
  userId:     number;
  externalId: string;
  nickname:   string | null;
  followedAt: string;
}

export interface FollowingUserProfile {
  id:         string;
  name:       string;
  photoURL:   string | null;
  bio:        string | null;
  identifier: string | null;
}

export interface FollowingPracticeProfile {
  id:            string;
  title:         string;
  ownerName:     string;
  ownerPhotoURL: string | null;
}

export interface FollowingItem {
  targetType: 'user' | 'practice';
  user?:      FollowingUserProfile;
  practice?:  FollowingPracticeProfile;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * following 列表只算「目標仍可顯示」的關注（daodao#293）：
 * - follows.target_id 是多型欄位、沒有 FK，使用者被硬刪除後會留下孤兒列 → 要求 users 仍存在
 * - practices 是軟刪除（deleted_at）→ 要求存在且 deleted_at IS NULL
 * count 與分頁共用同一段條件，totalItems／totalPages 才會等於實際回傳的可顯示筆數。
 */
const displayableFollowingWhere = (followerId: number): Prisma.Sql => Prisma.sql`
  f.follower_id = ${followerId}
  AND (
    (f.target_type = 'user'
      AND EXISTS (SELECT 1 FROM users u WHERE u.id = f.target_id))
    OR (f.target_type = 'practice'
      AND EXISTS (SELECT 1 FROM practices p WHERE p.id = f.target_id AND p.deleted_at IS NULL))
  )`;


// ============================================================================
// Service Functions
// ============================================================================

/**
 * 關注用戶
 * @throws BadRequestError 自我關注
 * @throws NotFoundError 目標用戶不存在
 */
const followUser = async (
  followerId: number,
  targetExternalId: string
): Promise<ApiSuccessResponse<{ message: string }>> => {
  const targetId = await externalToInternalId('user', targetExternalId);

  if (followerId === targetId) {
    throw new BadRequestError('無法關注自己');
  }

  await prisma.follows.upsert({
    where: {
      follower_id_target_type_target_id: {
        follower_id: followerId,
        target_type: 'user',
        target_id:   targetId,
      },
    },
    update: {},   // 已存在則不變動
    create: {
      follower_id: followerId,
      target_type: 'user',
      target_id:   targetId,
    },
  });

  // Fire-and-forget: P2 UserFollowed event
  prisma.users.findUnique({ where: { id: followerId }, select: { nickname: true } })
    .then(actor => notificationEventService.createEvent({
      type: NOTIFICATION_TYPES.USER_FOLLOWED,
      actorId: followerId,
      recipientId: targetId,
      entityType: 'user',
      entityId: targetId,
      payload: { actorName: actor?.nickname ?? null },
      priority: 'P2',
    }))
    .catch(() => {});


  return createSuccessResponse({ message: '關注成功' });
};

/**
 * 取消關注用戶
 */
const unfollowUser = async (
  followerId: number,
  targetExternalId: string
): Promise<ApiSuccessResponse<{ message: string }>> => {
  const targetId = await externalToInternalId('user', targetExternalId);

  await prisma.follows.deleteMany({
    where: {
      follower_id: followerId,
      target_type: 'user',
      target_id:   targetId,
    },
  });

  return createSuccessResponse({ message: '已取消關注' });
};

/**
 * 關注主題實踐
 * @throws BadRequestError 關注自己的實踐
 */
const followPractice = async (
  followerId: number,
  practiceExternalId: string
): Promise<ApiSuccessResponse<{ message: string }>> => {
  const practiceId = await externalToInternalId('practice', practiceExternalId);

  // 防止關注自己擁有的實踐（followerId 是 practice 的 owner 時）
  const practice = await prisma.practices.findUnique({
    where:  { id: practiceId },
    select: { user_id: true, title: true },
  });

  if (!practice) {
    throw new NotFoundError(`主題實踐不存在: ${practiceExternalId}`);
  }

  if (practice.user_id === followerId) {
    throw new BadRequestError('無法關注自己的主題實踐');
  }

  await prisma.follows.upsert({
    where: {
      follower_id_target_type_target_id: {
        follower_id: followerId,
        target_type: 'practice',
        target_id:   practiceId,
      },
    },
    update: {},
    create: {
      follower_id: followerId,
      target_type: 'practice',
      target_id:   practiceId,
    },
  });

  // Fire-and-forget: P2 PracticeFollowed event to practice owner
  prisma.users.findUnique({ where: { id: followerId }, select: { nickname: true } })
    .then(actor => notificationEventService.createEvent({
      type: NOTIFICATION_TYPES.PRACTICE_FOLLOWED,
      actorId: followerId,
      recipientId: practice.user_id,
      entityType: 'practice',
      entityId: practiceId,
      payload: { actorName: actor?.nickname ?? null, practice_id: practiceId, practice_title: practice.title },
      priority: 'P2',
    }))
    .catch(() => {});

  return createSuccessResponse({ message: '關注主題實踐成功' });
};

/**
 * 取消關注主題實踐
 */
const unfollowPractice = async (
  followerId: number,
  practiceExternalId: string
): Promise<ApiSuccessResponse<{ message: string }>> => {
  const practiceId = await externalToInternalId('practice', practiceExternalId);

  await prisma.follows.deleteMany({
    where: {
      follower_id: followerId,
      target_type: 'practice',
      target_id:   practiceId,
    },
  });

  return createSuccessResponse({ message: '已取消關注主題實踐' });
};

/**
 * 取得某用戶的「關注者」列表（誰關注了這個用戶）
 */
const getFollowers = async (
  userExternalId: string,
  page: number,
  limit: number
): Promise<PaginatedApiResponse<FollowUserItem>> => {
  const userId = await externalToInternalId('user', userExternalId);

  const [total, rows] = await Promise.all([
    prisma.follows.count({
      where: { target_type: 'user', target_id: userId },
    }),
    prisma.follows.findMany({
      where: { target_type: 'user', target_id: userId },
      orderBy: { created_at: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
      include: {
        follower: { select: { id: true, external_id: true, nickname: true } },
      },
    }),
  ]);

  const items: FollowUserItem[] = rows.map(r => ({
    userId:     r.follower.id,
    externalId: r.follower.external_id ?? '',
    nickname:   r.follower.nickname,
    followedAt: (r.created_at ?? new Date()).toISOString(),
  }));

  const pagination = calculatePagination(page, limit, total);
  return createPaginatedResponse(items, pagination);
};

/**
 * 取得某用戶「正在關注」的用戶與實踐列表
 */
const getFollowing = async (
  userExternalId: string,
  page: number,
  limit: number
): Promise<PaginatedApiResponse<FollowingItem>> => {
  const userId = await externalToInternalId('user', userExternalId);

  const where = displayableFollowingWhere(userId);
  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count FROM follows f WHERE ${where}`),
    prisma.$queryRaw<Array<{ target_type: string; target_id: number; created_at: Date | null }>>(Prisma.sql`
      SELECT f.target_type, f.target_id, f.created_at
      FROM follows f
      WHERE ${where}
      ORDER BY f.created_at DESC NULLS LAST, f.id DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}`),
  ]);
  const total = Number(countRows[0]?.count ?? 0);

  const userTargetIds    = rows.filter(r => r.target_type === 'user').map(r => r.target_id);
  const practiceTargetIds = rows.filter(r => r.target_type === 'practice').map(r => r.target_id);

  const [targetUsers, targetPractices] = await Promise.all([
    userTargetIds.length > 0
      ? prisma.users.findMany({
          where:  { id: { in: userTargetIds } },
          select: {
            id:              true,
            external_id:     true,
            nickname:        true,
            custom_id:       true,
            personal_slogan: true,
            contacts:        { select: { photo_url: true } },
          },
        })
      : [],
    practiceTargetIds.length > 0
      ? prisma.practices.findMany({
          where:  { id: { in: practiceTargetIds }, deleted_at: null },
          select: {
            id:          true,
            external_id: true,
            title:       true,
            users: {
              select: {
                nickname: true,
                contacts: { select: { photo_url: true } },
              },
            },
          },
        })
      : [],
  ]);

  const userMap     = new Map(targetUsers.map(u => [u.id, u]));
  const practiceMap = new Map(targetPractices.map(p => [p.id, p]));

  // 查詢與補資料之間目標剛好被刪除時直接略過，不回只有 targetType 的空殼（daodao#293）
  const items: FollowingItem[] = rows.flatMap((r): FollowingItem[] => {
    if (r.target_type === 'user') {
      const u = userMap.get(r.target_id);
      if (!u) return [];
      return [{
        targetType: 'user',
        user: {
          id:         u.external_id ?? '',
          name:       u.nickname ?? '',
          photoURL:   u.contacts?.photo_url ?? null,
          bio:        u.personal_slogan ?? null,
          identifier: u.custom_id ?? null,
        },
      }];
    }
    const p = practiceMap.get(r.target_id);
    if (!p) return [];
    return [{
      targetType: 'practice',
      practice: {
        id:            p.external_id ?? '',
        title:         p.title,
        ownerName:     p.users.nickname ?? '',
        ownerPhotoURL: p.users.contacts?.photo_url ?? null,
      },
    }];
  });

  const pagination = calculatePagination(page, limit, total);
  return createPaginatedResponse(items, pagination);
};

/**
 * 查詢當前用戶是否已關注某目標
 */
const checkFollowStatus = async (
  followerId: number,
  targetType: 'user' | 'practice',
  targetExternalId: string
): Promise<ApiSuccessResponse<{ isFollowing: boolean }>> => {
  const targetId = await externalToInternalId(targetType, targetExternalId);

  const existing = await prisma.follows.findUnique({
    where: {
      follower_id_target_type_target_id: {
        follower_id: followerId,
        target_type: targetType,
        target_id:   targetId,
      },
    },
    select: { follower_id: true },
  });

  return createSuccessResponse({ isFollowing: existing !== null });
};

// ============================================================================
// Export
// ============================================================================

export const followService = {
  followUser,
  unfollowUser,
  followPractice,
  unfollowPractice,
  getFollowers,
  getFollowing,
  checkFollowStatus,
};
