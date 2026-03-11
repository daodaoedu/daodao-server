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
} from '../validators/reaction.validators';
import { ReactionTargetTypeValue, ReactionTypeValue } from '../types/reaction.types';
import { externalToInternalId, EntityType } from '../services/id-converter.service';
import { UnauthorizedError, BadRequestError } from '../middleware/error.middleware';

async function resolveTargetId(targetType: string, targetId: string): Promise<number> {
  if (targetType === 'comment') {
    const id = parseInt(targetId, 10);
    if (isNaN(id)) throw new BadRequestError('Invalid comment ID');
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

export const reactionController = {
  upsertReaction,
  removeReaction,
  getReactions,
};
