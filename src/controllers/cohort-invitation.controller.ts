import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortInvitationService } from '../services/cohort-invitation.service';
import { createSuccessResponse } from '../utils/response-helper';
import { inviteMembersResponseSchema, resendInvitationResponseSchema, type InviteMembersInput } from '../validators/cohort-invitation.validators';
const invite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = inviteMembersResponseSchema.parse(await cohortInvitationService.invite(Number(req.params.programId), Number(req.params.cohortId), req.user.id, req.body as InviteMembersInput));
  res.status(req.body.preview ? 200 : 201).json(createSuccessResponse(result));
});
const resend = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = resendInvitationResponseSchema.parse(await cohortInvitationService.resend(Number(req.params.programId), Number(req.params.cohortId), Number(req.params.enrollmentId), req.user.id));
  res.json(createSuccessResponse(result));
});
export const cohortInvitationController = { invite, resend };
