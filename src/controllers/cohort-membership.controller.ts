import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortMembershipService } from '../services/cohort-membership.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortEnrollmentRosterResponseSchema, cohortLearnerListResponseSchema, exitCohortResponseSchema } from '../validators/cohort-membership.validators';
const exit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.json(createSuccessResponse(exitCohortResponseSchema.parse(await cohortMembershipService.exit(Number(req.params.cohortId), req.user.id))));
});
const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await cohortMembershipService.remove(Number(req.params.programId), Number(req.params.cohortId), Number(req.params.enrollmentId), req.user.id);
  res.status(204).send();
});
const listLearners = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.json(createSuccessResponse(cohortLearnerListResponseSchema.parse(await cohortMembershipService.listLearners(Number(req.params.programId), Number(req.params.cohortId), req.user.id))));
});
const listEnrollments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.json(createSuccessResponse(cohortEnrollmentRosterResponseSchema.parse(await cohortMembershipService.listEnrollments(Number(req.params.programId), Number(req.params.cohortId), req.user.id))));
});
export const cohortMembershipController = { exit, remove, listLearners, listEnrollments };
