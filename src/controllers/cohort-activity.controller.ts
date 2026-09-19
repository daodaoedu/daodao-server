import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortActivityService } from '../services/cohort-activity.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortActivityDetailSchema, cohortActivityResponseSchema, type ActivityType, type CohortActivityQuery } from '../validators/cohort-activity.validators';

const actor = (req: Request): number => { if (!req.user) throw new UnauthorizedError(); return req.user.id; };

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await cohortActivityService.list(Number(req.params.programId), Number(req.params.cohortId), actor(req), req.query as unknown as CohortActivityQuery);
  res.json(createSuccessResponse(cohortActivityResponseSchema.parse(result)));
});

const get = asyncHandler(async (req: Request, res: Response) => {
  const result = await cohortActivityService.get(Number(req.params.programId), Number(req.params.cohortId), actor(req), req.params.type as ActivityType, String(req.params.activityId));
  res.json(createSuccessResponse(cohortActivityDetailSchema.parse(result)));
});

export const cohortActivityController = { list, get };
