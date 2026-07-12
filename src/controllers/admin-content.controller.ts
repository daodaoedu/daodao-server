import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createPaginatedResponse, createSuccessResponse } from '../utils/response-helper';
import { getContentPerformance, listCheckins as listCheckinsService, setContentFeatured } from '../services/admin-content.service';

const getPerformance = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? Number(req.query.days) : undefined;
  const data = await getContentPerformance(days);
  res.json(createSuccessResponse(data));
});

const updateFeatured = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { featured } = req.body as { featured: boolean };
  const item = await setContentFeatured(id, featured);
  res.json(createSuccessResponse(item));
});

const getCheckins = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? Number(req.query.days) : undefined;
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 100));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const result = await listCheckinsService(days, limit, offset);
  res.json(createPaginatedResponse(result.items, {
    currentPage: result.pagination.currentPage,
    totalPages: result.pagination.totalPages,
    totalItems: result.pagination.totalCount,
    itemsPerPage: result.pagination.limit,
    hasNext: result.pagination.hasNext,
    hasPrev: result.pagination.hasPrev,
  }));
});

export default { getPerformance, updateFeatured, getCheckins };
