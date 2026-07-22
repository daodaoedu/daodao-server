import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortEncouragementService } from '../services/cohort-encouragement.service';
import { createSuccessResponse } from '../utils/response-helper';
import {
  cohortEncouragementDraftResponseSchema,
  cohortEncouragementResponseSchema
} from '../validators/cohort-encouragement.validators';

const draft = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = await cohortEncouragementService.draft(
    Number(req.params.programId),
    Number(req.params.cohortId),
    Number(req.params.checkinId),
    req.user.id
  );
  res.json(createSuccessResponse(cohortEncouragementDraftResponseSchema.parse(result)));
});

const submit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = await cohortEncouragementService.submit(
    Number(req.params.programId),
    Number(req.params.cohortId),
    Number(req.params.checkinId),
    req.user.id,
    String(req.body.content)
  );
  res.status(201).json(createSuccessResponse(cohortEncouragementResponseSchema.parse(result)));
});

export const cohortEncouragementController = { draft, submit };
