/**
 * Admin Roadmap Controller
 *
 * 後台收件匣（列表／歸併／促成／封存）、路線圖項目管理、趨勢報表。
 * 路由掛 authenticate + requireAdmin。
 */

import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { wishService } from '../services/wish.service';
import { roadmapAdminService } from '../services/roadmap-admin.service';
import { roadmapReportService } from '../services/roadmap-report.service';
import {
  AdminItemIdParam,
  CreateRoadmapItemInput,
  UpdateRoadmapItemInput,
  RoadmapReportQuery,
} from '../validators/roadmap.validators';
import {
  AdminWishListQuery,
  AdminWishIdParam,
  LinkWishInput,
  PromoteWishInput,
} from '../validators/wish.validators';

function requireActorId(req: Request): number {
  if (!req.user?.id) throw new UnauthorizedError('請先登入');
  return req.user.id;
}

// ─── 許願收件匣 ──────────────────────────────────────────────────────────────────

const listWishes = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AdminWishListQuery;
  const result = await wishService.listWishes(query);
  res.status(200).json(result);
});

const linkWish = asyncHandler(async (req: Request, res: Response) => {
  const actorId = requireActorId(req);
  const { id } = req.params as unknown as AdminWishIdParam;
  const body = req.body as LinkWishInput;
  const result = await wishService.linkToItem(id, body, actorId);
  res.status(200).json(result);
});

const promoteWish = asyncHandler(async (req: Request, res: Response) => {
  const actorId = requireActorId(req);
  const { id } = req.params as unknown as AdminWishIdParam;
  const body = req.body as PromoteWishInput;
  const result = await wishService.promoteToItem(id, body, actorId);
  res.status(201).json(result);
});

const archiveWish = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as AdminWishIdParam;
  const result = await wishService.archiveWish(id);
  res.status(200).json(result);
});

// ─── 路線圖項目管理 ──────────────────────────────────────────────────────────────

const createItem = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateRoadmapItemInput;
  const result = await roadmapAdminService.createItem(body);
  res.status(201).json(result);
});

const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const actorId = requireActorId(req);
  const { id } = req.params as unknown as AdminItemIdParam;
  const body = req.body as UpdateRoadmapItemInput;
  const result = await roadmapAdminService.updateItem(id, body, actorId);
  res.status(200).json(result);
});

// ─── 趨勢報表 ────────────────────────────────────────────────────────────────────

const getReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as RoadmapReportQuery;
  const result = await roadmapReportService.getReport(query);
  res.status(200).json(result);
});

export const adminRoadmapController = {
  listWishes,
  linkWish,
  promoteWish,
  archiveWish,
  createItem,
  updateItem,
  getReport,
};
