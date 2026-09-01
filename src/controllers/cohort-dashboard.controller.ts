import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortDashboardService } from '../services/cohort-dashboard.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortDashboardQuerySchema, cohortDashboardResponseSchema, cohortParticipantsQuerySchema, cohortParticipantsResponseSchema } from '../validators/cohort-dashboard.validators';

const actor = (req: Request): number => { if (!req.user) throw new UnauthorizedError(); return req.user.id; };
const get = asyncHandler(async (req: Request, res: Response) => {
  const query = cohortDashboardQuerySchema.parse(req.query);
  res.json(createSuccessResponse(cohortDashboardResponseSchema.parse(await cohortDashboardService.get(Number(req.params.programId), Number(req.params.cohortId), actor(req), query))));
});
const listParticipants = asyncHandler(async (req: Request, res: Response) => {
  const query = cohortParticipantsQuerySchema.parse(req.query);
  res.json(createSuccessResponse(cohortParticipantsResponseSchema.parse(await cohortDashboardService.listParticipants(Number(req.params.programId), Number(req.params.cohortId), actor(req), query))));
});
export const cohortDashboardController = { get, listParticipants };
