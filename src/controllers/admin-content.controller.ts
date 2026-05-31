import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import { getContentPerformance, setContentFeatured } from '../services/admin-content.service';

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

export default { getPerformance, updateFeatured };
