import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortFeedService } from '../services/cohort-feed.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortFeedResponseSchema } from '../validators/cohort-feed.validators';
const get = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const programId = req.params.programId === undefined ? undefined : Number(req.params.programId);
  const feed = await cohortFeedService.get(
    Number(req.params.cohortId),
    req.user.id,
    Number(req.query.limit),
    Number(req.query.offset),
    programId
  );
  res.json(createSuccessResponse(cohortFeedResponseSchema.parse(feed)));
});
export const cohortFeedController = { get };
