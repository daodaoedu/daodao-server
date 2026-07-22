import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortJoinService } from '../services/cohort-join.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortJoinInfoResponseSchema, cohortJoinResultResponseSchema, cohortMemberHomeResponseSchema, myCohortsResponseSchema } from '../validators/cohort-join.validators';

const info = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(cohortJoinInfoResponseSchema.parse(await cohortJoinService.getJoinInfo(req.params.joinToken)))); });
const join = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.status(201).json(createSuccessResponse(cohortJoinResultResponseSchema.parse(await cohortJoinService.join(req.params.joinToken, req.user.id, req.body.consent))));
});
const memberHome = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.json(createSuccessResponse(cohortMemberHomeResponseSchema.parse(await cohortJoinService.getMemberHome(Number(req.params.cohortId), req.user.id))));
});
const listMyCohorts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.json(createSuccessResponse(myCohortsResponseSchema.parse(await cohortJoinService.listMyCohorts(req.user.id))));
});
export const cohortJoinController = { info, join, memberHome, listMyCohorts };
