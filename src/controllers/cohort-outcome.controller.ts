import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortOutcomeService } from '../services/cohort-outcome.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortOutcomeResponseSchema } from '../validators/cohort-outcome.validators';
const get = asyncHandler(async (req: Request, res: Response) => { if (!req.user) throw new UnauthorizedError(); const result = await cohortOutcomeService.get(Number(req.params.programId), Number(req.params.cohortId), req.user.id); res.json(createSuccessResponse(result ? cohortOutcomeResponseSchema.parse(result) : null)); });
export const cohortOutcomeController = { get };

