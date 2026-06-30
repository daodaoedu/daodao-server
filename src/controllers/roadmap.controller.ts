/**
 * Roadmap Controller
 *
 * 公開看板查詢、Hero 統計（optionalAuth）；投票／取消（authenticate）。
 */

import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { roadmapService } from '../services/roadmap.service';
import { ListRoadmapItemsQuery, SupportItemParam } from '../validators/roadmap.validators';

const listItems = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListRoadmapItemsQuery;
  const result = await roadmapService.listPublicItems({
    tab: query.status,
    category: query.category,
    cursor: query.cursor,
    limit: query.limit,
    currentUserId: req.user?.id ?? null,
  });
  res.status(200).json(result);
});

const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const result = await roadmapService.getStats();
  res.status(200).json(result);
});

const addSupport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('請先登入');
  const { externalId } = req.params as unknown as SupportItemParam;
  const result = await roadmapService.addSupport(externalId, req.user.id);
  res.status(200).json(result);
});

const removeSupport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('請先登入');
  const { externalId } = req.params as unknown as SupportItemParam;
  const result = await roadmapService.removeSupport(externalId, req.user.id);
  res.status(200).json(result);
});

export const roadmapController = {
  listItems,
  getStats,
  addSupport,
  removeSupport,
};
