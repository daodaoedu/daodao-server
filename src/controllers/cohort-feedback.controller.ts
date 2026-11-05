import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { getCohortFeedback } from '../services/cohort-feedback.service';
import { cohortFeedbackResponseSchema, type CohortFeedbackQuery } from '../validators/cohort-feedback.validators';
import { createSuccessResponse } from '../utils/response-helper';

/** 回傳場次 owner 可見的進度與按題匿名答案。 */
export const getCohortFeedbackController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('請先登入');
  const result = await getCohortFeedback(Number(req.params.programId), Number(req.params.cohortId), req.user.id, req.query as unknown as CohortFeedbackQuery);
  res.json(createSuccessResponse(cohortFeedbackResponseSchema.parse(result)));
});
