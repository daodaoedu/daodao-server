import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortDashboardService } from '../services/cohort-dashboard.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortDashboardResponseSchema } from '../validators/cohort-dashboard.validators';
const get = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.json(createSuccessResponse(cohortDashboardResponseSchema.parse(await cohortDashboardService.get(Number(req.params.programId), Number(req.params.cohortId), req.user.id))));
});
export const cohortDashboardController = { get };

