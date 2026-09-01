import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortFocusService } from '../services/cohort-focus.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortFocusResponseSchema } from '../validators/cohort-focus.validators';
const get = asyncHandler(async (req: Request, res: Response) => { if (!req.user) throw new UnauthorizedError(); res.json(createSuccessResponse(cohortFocusResponseSchema.parse(await cohortFocusService.get(Number(req.params.programId), Number(req.params.cohortId), req.user.id)))); });
export const cohortFocusController = { get };

