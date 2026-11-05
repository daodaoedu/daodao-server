import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { organizationInvitationService } from '../services/organization-invitation.service';
import { recoverOrganizationInvitationEmails } from '../services/email/organization-invitation-dispatch.service';
import { createSuccessResponse } from '../utils/response-helper';
import { organizationInvitationResponseSchema, acceptOrganizationInvitationResponseSchema } from '../validators/organization-invitation.validators';

/** Reject temporary JWTs before interpreting an integer as a formal users.id. */
const userId = (req: Request): number => {
  if (!req.user || req.isTemporary || req.user.isTemp) throw new UnauthorizedError('請先完成正式帳號註冊');
  return req.user.id;
};
const ids = (req: Request) => ({ organizationId: Number(req.params.organizationId), invitationId: Number(req.params.invitationId) });
const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await organizationInvitationService.list(Number(req.params.organizationId));
  res.json(createSuccessResponse(organizationInvitationResponseSchema.array().parse(result)));
});
const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await organizationInvitationService.create(Number(req.params.organizationId), req.body.email, userId(req));
  void recoverOrganizationInvitationEmails().catch(() => undefined);
  res.status(201).json(createSuccessResponse(organizationInvitationResponseSchema.parse(result)));
});
const revoke = asyncHandler(async (req: Request, res: Response) => {
  const p = ids(req);
  const result = await organizationInvitationService.revoke(p.organizationId, p.invitationId, userId(req));
  res.json(createSuccessResponse(organizationInvitationResponseSchema.parse(result)));
});
const resend = asyncHandler(async (req: Request, res: Response) => {
  const p = ids(req);
  const result = await organizationInvitationService.resend(p.organizationId, p.invitationId, userId(req));
  void recoverOrganizationInvitationEmails().catch(() => undefined);
  res.json(createSuccessResponse(organizationInvitationResponseSchema.parse(result)));
});
const approve = asyncHandler(async (req: Request, res: Response) => {
  const p = ids(req);
  const result = await organizationInvitationService.approve(p.organizationId, p.invitationId, Number(req.params.requestId), userId(req));
  res.json(createSuccessResponse(organizationInvitationResponseSchema.parse(result)));
});
const accept = asyncHandler(async (req: Request, res: Response) => {
  const result = await organizationInvitationService.accept(req.body.token, userId(req));
  res.json(createSuccessResponse(acceptOrganizationInvitationResponseSchema.parse(result)));
});
export const organizationInvitationController = { list, create, revoke, resend, approve, accept };
