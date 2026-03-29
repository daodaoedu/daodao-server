/**
 * Reaction Controller
 *
 * 處理 Quick Reactions API 的 HTTP 請求：
 * - POST /api/v1/reactions   — upsert（新增或更換）
 * - DELETE /api/v1/reactions — remove（取消反應）
 * - GET /api/v1/reactions    — 取得目標反應計數
 */

import { Request, Response } from 'express';
import { reactionService } from '../services/reaction.service';
import {
  UpsertReactionSchema,
  RemoveReactionSchema,
  GetReactionsQuerySchema,
  GetReactionsListQuerySchema,
  GetReactionsBatchQuerySchema,
} from '../validators/reaction.validators';
import { ReactionTargetTypeValue, ReactionTypeValue } from '../types/reaction.types';
import { externalToInternalId, EntityType } from '../services/id-converter.service';
import { prisma } from '../services/database/prisma.service';
import { UnauthorizedError, BadRequestError } from '../middleware/error.middleware';

async function resolveTargetId(targetType: string, targetId: string): Promise<number> {
  if (targetType === 'comment' || targetType === 'checkin') {
    const id = parseInt(targetId, 10);
    if (isNaN(id)) throw new BadRequestError(`Invalid ${targetType} ID`);
    return id;
  }
  return externalToInternalId(targetType as EntityType, targetId);
}

/**
 * POST /api/v1/reactions
 * 新增或更換反應（需登入）
 */
async function upsertReaction(req: Request, res: Response): Promise<void> {
  if (!req.user?.id) throw new UnauthorizedError('Authentication required');

  const { targetType, targetId, reactionType } = req.body as UpsertReactionSchema;
  const internalTargetId = await resolveTargetId(targetType, targetId);

  const result = await reactionService.upsertReaction({
    targetType: targetType as ReactionTargetTypeValue,
    targetId: internalTargetId,
    userId: req.user.id,
    reactionType: reactionType as ReactionTypeValue,
  });

  res.status(200).json(result);
}

/**
 * DELETE /api/v1/reactions
 * 取消反應（需登入）
 */
async function removeReaction(req: Request, res: Response): Promise<void> {
  if (!req.user?.id) throw new UnauthorizedError('Authentication required');

  const { targetType, targetId } = req.body as RemoveReactionSchema;
  const internalTargetId = await resolveTargetId(targetType, targetId);

  const result = await reactionService.removeReaction({
    targetType: targetType as ReactionTargetTypeValue,
    targetId: internalTargetId,
    userId: req.user.id,
  });

  res.status(200).json(result);
}

/**
 * GET /api/v1/reactions?targetType=practice&targetId=1
 * 取得目標反應計數（可選登入）
 */
async function getReactions(req: Request, res: Response): Promise<void> {
  const { targetType, targetId } = req.query as unknown as GetReactionsQuerySchema;
  const internalTargetId = await resolveTargetId(targetType, targetId);

  const result = await reactionService.getReactionsByTarget({
    targetType: targetType as ReactionTargetTypeValue,
    targetId: internalTargetId,
    currentUserId: req.user?.id ?? null,
  });

  res.status(200).json(result);
}

/**
 * GET /api/v1/reactions/list?targetType=practice&targetId=xxx
 * 取得目標的個別用戶反應列表（可選登入）
 */
async function getReactionsList(req: Request, res: Response): Promise<void> {
  const { targetType, targetId } = req.query as unknown as GetReactionsListQuerySchema;
  const internalTargetId = await resolveTargetId(targetType, targetId);

  const result = await reactionService.getReactionsListByTarget({
    targetType: targetType as ReactionTargetTypeValue,
    targetId: internalTargetId,
    currentUserId: req.user?.id ?? null,
  });

  res.status(200).json(result);
}

/**
 * GET /api/v1/reactions/batch?targetType=practice&targetIds=uuid1,uuid2,...
 * 批次取得多個目標的反應計數 + 用戶反應列表（可選登入）
 */
async function getReactionsBatch(req: Request, res: Response): Promise<void> {
  const { targetType, targetIds } = req.query as unknown as GetReactionsBatchQuerySchema;

  // 批次轉換 external → internal ID（單次 DB 查詢）
  const practices = await prisma.practices.findMany({
    where: { external_id: { in: targetIds } },
    select: { id: true, external_id: true },
  });

  if (practices.length === 0) {
    throw new BadRequestError('找不到任何符合的目標');
  }

  const externalIdMap = new Map<number, string>();
  for (const p of practices) {
    if (p.external_id) {
      externalIdMap.set(p.id, p.external_id);
    }
  }

  const result = await reactionService.getReactionsBatchByTargets({
    targetType,
    targetIds: Array.from(externalIdMap.keys()),
    externalIdMap,
    currentUserId: req.user?.id ?? null,
  });

  res.status(200).json(result);
}

export const reactionController = {
  upsertReaction,
  removeReaction,
  getReactions,
  getReactionsList,
  getReactionsBatch,
};
