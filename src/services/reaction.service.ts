/**
 * Reaction Service
 *
 * 處理 Quick Reactions 相關業務邏輯：
 * - upsertReaction：新增或更換反應（UPSERT，DB unique constraint 保證唯一）
 * - removeReaction：刪除反應
 * - getReactionsByTarget：取得目標的反應計數聚合與當前用戶狀態
 */

import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import { InternalServerError } from '../middleware/error.middleware';
import { ApiSuccessResponse } from '../types/api-response.types';
import { createSuccessResponse } from '../utils/response-helper';
import {
  UpsertReactionParams,
  RemoveReactionParams,
  GetReactionsByTargetParams,
  GetReactionsResponse,
  ReactionCount,
  REACTION_TYPE_VALUES,
  ReactionListItem,
  GetReactionsListResponse,
} from '../types/reaction.types';
import { notificationEventService } from './notification-event.service';

async function getCommentReactionPayload(
  comment: { target_type: string; target_id: number },
  reactionType: string
): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = { reactionType };

  if (comment.target_type === 'practice') {
    const practice = await prisma.practices.findUnique({
      where: { id: comment.target_id },
      select: { title: true, external_id: true },
    });

    if (practice) {
      payload.practice_title = practice.title ?? '';
      payload.entity_external_id = practice.external_id ?? '';
    }
  } else if (comment.target_type === 'checkin') {
    const checkin = await prisma.practice_checkins.findUnique({
      where: { id: comment.target_id },
      select: {
        id: true,
        practices: {
          select: { title: true, external_id: true },
        },
      },
    });

    if (checkin) {
      payload.checkinId = checkin.id;
      payload.practice_title = checkin.practices?.title ?? '';
      payload.entity_external_id = checkin.practices?.external_id ?? '';
    }
  }

  return payload;
}

/**
 * 新增或更換反應（UPSERT）
 * DB unique constraint 保證每人每目標只有一筆，重複送出即更新
 */
export async function upsertReaction(params: UpsertReactionParams): Promise<ApiSuccessResponse<GetReactionsResponse>> {
  const { targetType, targetId, userId, reactionType } = params;

  try {
    const existing = await prisma.reactions.findUnique({
      where: {
        target_type_target_id_user_id: {
          target_type: targetType,
          target_id: targetId,
          user_id: userId,
        },
      },
    });

    await prisma.reactions.upsert({
      where: {
        target_type_target_id_user_id: {
          target_type: targetType,
          target_id: targetId,
          user_id: userId,
        },
      },
      update: { reaction_type: reactionType },
      create: {
        target_type: targetType,
        target_id: targetId,
        user_id: userId,
        reaction_type: reactionType,
      },
    });

    loggerService.info('Reaction upserted', { targetType, targetId, userId, reactionType });

    // 新增反應（非更換類型）時發送通知
    if (existing === null) {
      try {
        if (targetType === 'practice') {
          const practice = await prisma.practices.findUnique({
            where: { id: targetId },
            select: { user_id: true, title: true, external_id: true },
          });

          if (practice && practice.user_id !== userId) {
            notificationEventService.createEvent({
              type: 'reaction',
              actorId: userId,
              recipientId: practice.user_id,
              entityType: 'practice',
              entityId: targetId,
              payload: {
                reactionType,
                practice_title: practice.title ?? '',
                entity_external_id: practice.external_id ?? '',
              },
              priority: 'P2',
            }).catch(() => {});

          }
        } else if (targetType === 'checkin') {
          const checkin = await prisma.practice_checkins.findUnique({
            where: { id: targetId },
            select: { user_id: true, practice_id: true },
          });

          if (checkin && checkin.user_id !== userId) {
            const practice = await prisma.practices.findUnique({
              where: { id: checkin.practice_id },
              select: { title: true, external_id: true },
            });

            notificationEventService.createEvent({
              type: 'reaction',
              actorId: userId,
              recipientId: checkin.user_id,
              entityType: 'checkin',
              entityId: targetId,
              payload: {
                reactionType,
                practice_title: practice?.title ?? '',
                entity_external_id: practice?.external_id ?? '',
              },
              priority: 'P2',
            }).catch(() => {});

          }
        } else if (targetType === 'comment') {
          const comment = await prisma.comments.findUnique({
            where: { id: targetId },
            select: { user_id: true, target_type: true, target_id: true },
          });

          if (comment && comment.user_id !== userId) {
            const payload = await getCommentReactionPayload(comment, reactionType);
            notificationEventService.createEvent({
              type: 'reaction',
              actorId: userId,
              recipientId: comment.user_id,
              entityType: 'comment',
              entityId: targetId,
              payload,
              priority: 'P2',
            }).catch(() => {});
          }
        } else if (targetType === 'persona_answer') {
          const answer = await prisma.persona_answers.findUnique({
            where: { id: targetId },
            select: { user_id: true, question_id: true },
          });

          if (answer && answer.user_id !== userId) {
            const baseUrl = process.env.FRONTEND_URL ?? 'https://app.daodao.so';
            const personaUrl = `${baseUrl}/persona/${answer.question_id}`;

            notificationEventService.createEvent({
              type: 'reaction',
              actorId: userId,
              recipientId: answer.user_id,
              entityType: 'persona_answer',
              entityId: targetId,
              payload: { reactionType, url: personaUrl },
              priority: 'P2',
            }).catch(() => {});
          }
        }
      } catch (enqueueError) {
        // 通知排隊失敗不影響主流程，只記錄警告
        loggerService.warn('Failed to enqueue reaction notification', {
          targetId,
          userId,
          error: enqueueError instanceof Error ? enqueueError.message : String(enqueueError),
        });
      }
    }

    return getReactionsByTarget({ targetType, targetId, currentUserId: userId });
  } catch (error) {
    loggerService.error('Failed to upsert reaction', { params, error });
    throw new InternalServerError('新增反應失敗');
  }
}

/**
 * 刪除反應（取消已選反應時呼叫）
 */
export async function removeReaction(params: RemoveReactionParams): Promise<ApiSuccessResponse<GetReactionsResponse>> {
  const { targetType, targetId, userId } = params;

  try {
    await prisma.reactions.deleteMany({
      where: {
        target_type: targetType,
        target_id: targetId,
        user_id: userId,
      },
    });

    loggerService.info('Reaction removed', { targetType, targetId, userId });

    return getReactionsByTarget({ targetType, targetId, currentUserId: userId });
  } catch (error) {
    loggerService.error('Failed to remove reaction', { params, error });
    throw new InternalServerError('刪除反應失敗');
  }
}

/**
 * 取得目標的反應聚合（含計數與最新用戶名稱）與當前用戶狀態
 */
export async function getReactionsByTarget(params: GetReactionsByTargetParams): Promise<ApiSuccessResponse<GetReactionsResponse>> {
  const { targetType, targetId, currentUserId } = params;

  try {
    const [allReactions, currentUserReaction] = await Promise.all([
      prisma.reactions.findMany({
        where: { target_type: targetType, target_id: targetId },
        include: {
          users: {
            select: { nickname: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      currentUserId
        ? prisma.reactions.findUnique({
            where: {
              target_type_target_id_user_id: {
                target_type: targetType,
                target_id: targetId,
                user_id: currentUserId,
              },
            },
            select: { reaction_type: true },
          })
        : null,
    ]);

    // 按 reaction_type 聚合計數，取最新反應的用戶名稱
    const countMap = new Map<string, { count: number; latestActorName: string | null }>();

    for (const r of allReactions) {
      const existing = countMap.get(r.reaction_type);
      if (!existing) {
        countMap.set(r.reaction_type, {
          count: 1,
          latestActorName: r.users.nickname ?? null,
        });
      } else {
        existing.count += 1;
      }
    }

    const reactions: ReactionCount[] = REACTION_TYPE_VALUES.map((type) => {
      const data = countMap.get(type);
      return {
        type,
        count: data?.count ?? 0,
        latestActorName: data?.latestActorName ?? null,
      };
    });

    return createSuccessResponse({
      reactions,
      currentUserReaction: (currentUserReaction?.reaction_type as GetReactionsResponse['currentUserReaction']) ?? null,
    });
  } catch (error) {
    loggerService.error('Failed to get reactions', { params, error });
    throw new InternalServerError('取得反應資料失敗');
  }
}

/**
 * 取得目標的個別用戶反應列表
 */
export async function getReactionsListByTarget(params: GetReactionsByTargetParams): Promise<ApiSuccessResponse<GetReactionsListResponse>> {
  const { targetType, targetId, currentUserId } = params;

  try {
    const allReactions = await prisma.reactions.findMany({
      where: { target_type: targetType, target_id: targetId },
      include: {
        users: {
          select: {
            external_id: true,
            nickname: true,
            custom_id: true,
            is_open_profile: true,
            contacts: { select: { photo_url: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const reactionUserIds = allReactions.map((r) => r.user_id);
    const connectedUserIds = new Set<number>();
    if (currentUserId && reactionUserIds.length > 0) {
      const connections = await prisma.connections.findMany({
        where: {
          OR: [
            { user_a_id: currentUserId, user_b_id: { in: reactionUserIds } },
            { user_b_id: currentUserId, user_a_id: { in: reactionUserIds } },
          ],
        },
        select: { user_a_id: true, user_b_id: true },
      });
      for (const c of connections) {
        connectedUserIds.add(c.user_a_id === currentUserId ? c.user_b_id : c.user_a_id);
      }
    }

    const items: ReactionListItem[] = allReactions.map((r) => ({
      userId: r.users.external_id ?? String(r.user_id),
      name: r.users.nickname ?? '未知用戶',
      photoURL: r.users.contacts?.photo_url ?? null,
      customId: r.users.custom_id ?? null,
      reactionType: r.reaction_type as ReactionListItem['reactionType'],
      reactedAt: (r.created_at ?? new Date()).toISOString(),
      isPublic: r.users.is_open_profile ?? false,
      isConnection: connectedUserIds.has(r.user_id),
    }));

    return createSuccessResponse({ items });
  } catch (error) {
    loggerService.error('Failed to get reactions list', { params, error });
    throw new InternalServerError('取得反應列表失敗');
  }
}

/**
 * 批次取得多個目標的反應聚合 + 個別用戶反應列表
 */
export async function getReactionsBatchByTargets(params: {
  targetType: string;
  targetIds: number[];
  externalIdMap: Map<number, string>;
  currentUserId: number | null;
}): Promise<ApiSuccessResponse<Record<string, { reactions: ReactionCount[]; currentUserReaction: string | null; items: ReactionListItem[] }>>> {
  const { targetType, targetIds, externalIdMap, currentUserId } = params;

  try {
    const allReactions = await prisma.reactions.findMany({
      where: { target_type: targetType, target_id: { in: targetIds } },
      include: {
        users: {
          select: {
            external_id: true,
            nickname: true,
            custom_id: true,
            is_open_profile: true,
            contacts: { select: { photo_url: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Batch-check connections for all reaction users
    const allReactionUserIds = [...new Set(allReactions.map((r) => r.user_id))];
    const batchConnectedUserIds = new Set<number>();
    if (currentUserId && allReactionUserIds.length > 0) {
      const connections = await prisma.connections.findMany({
        where: {
          OR: [
            { user_a_id: currentUserId, user_b_id: { in: allReactionUserIds } },
            { user_b_id: currentUserId, user_a_id: { in: allReactionUserIds } },
          ],
        },
        select: { user_a_id: true, user_b_id: true },
      });
      for (const c of connections) {
        batchConnectedUserIds.add(c.user_a_id === currentUserId ? c.user_b_id : c.user_a_id);
      }
    }

    // Group by target_id
    const byTarget = new Map<number, typeof allReactions>();
    for (const r of allReactions) {
      const arr = byTarget.get(r.target_id) ?? [];
      arr.push(r);
      byTarget.set(r.target_id, arr);
    }

    // Build result for each external ID
    const result: Record<string, { reactions: ReactionCount[]; currentUserReaction: string | null; items: ReactionListItem[] }> = {};

    for (const [internalId, externalId] of externalIdMap.entries()) {
      const reactions = byTarget.get(internalId) ?? [];

      // Aggregate counts
      const countMap = new Map<string, { count: number; latestActorName: string | null }>();
      for (const r of reactions) {
        const existing = countMap.get(r.reaction_type);
        if (!existing) {
          countMap.set(r.reaction_type, { count: 1, latestActorName: r.users.nickname ?? null });
        } else {
          existing.count += 1;
        }
      }

      const reactionCounts: ReactionCount[] = REACTION_TYPE_VALUES.map((type) => {
        const data = countMap.get(type);
        return { type, count: data?.count ?? 0, latestActorName: data?.latestActorName ?? null };
      });

      // Current user reaction
      const currentUserReaction = currentUserId
        ? (reactions.find((r) => r.user_id === currentUserId)?.reaction_type ?? null)
        : null;

      // Individual reaction list items
      const items: ReactionListItem[] = reactions.map((r) => ({
        userId: r.users.external_id ?? String(r.user_id),
        name: r.users.nickname ?? '未知用戶',
        photoURL: r.users.contacts?.photo_url ?? null,
        customId: r.users.custom_id ?? null,
        reactionType: r.reaction_type as ReactionListItem['reactionType'],
        reactedAt: (r.created_at ?? new Date()).toISOString(),
        isPublic: r.users.is_open_profile ?? false,
        isConnection: batchConnectedUserIds.has(r.user_id),
      }));

      result[externalId] = { reactions: reactionCounts, currentUserReaction, items };
    }

    return createSuccessResponse(result);
  } catch (error) {
    loggerService.error('Failed to get batch reactions', { params: { targetType, targetIds }, error });
    throw new InternalServerError('批次取得反應資料失敗');
  }
}

export const reactionService = {
  upsertReaction,
  removeReaction,
  getReactionsByTarget,
  getReactionsListByTarget,
  getReactionsBatchByTargets,
};
