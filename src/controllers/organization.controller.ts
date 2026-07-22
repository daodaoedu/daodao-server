import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { organizationService } from '../services/organization.service';
import { createSuccessResponse } from '../utils/response-helper';
import {
  organizationListResponseSchema,
  organizationMemberListResponseSchema,
  organizationMemberResponseSchema,
  organizationResponseSchema,
  type AddOrganizationMemberInput,
  type AdminUpdateOrganizationInput,
  type CreateOrganizationInput,
  type UpdateOrganizationInput
} from '../validators/organization.validators';

const actorId = (req: Request): number => {
  if (!req.user) throw new UnauthorizedError('請先登入');
  return req.user.id;
};

const organizationId = (req: Request): number => Number(req.params.organizationId);

const listOrganizations = asyncHandler(async (req: Request, res: Response) => {
  const result = organizationListResponseSchema.parse(await organizationService.listForUser(actorId(req)));
  res.json(createSuccessResponse(result));
});

const listAllOrganizations = asyncHandler(async (_req: Request, res: Response) => {
  res.json(createSuccessResponse(organizationListResponseSchema.parse(await organizationService.listAll())));
});

const getOrganization = asyncHandler(async (req: Request, res: Response) => {
  const result = organizationResponseSchema.parse(await organizationService.getForUser(organizationId(req), actorId(req)));
  res.json(createSuccessResponse(result));
});

const createOrganization = asyncHandler(async (req: Request, res: Response) => {
  const result = organizationResponseSchema.parse(await organizationService.create(req.body as CreateOrganizationInput, actorId(req)));
  res.status(201).json(createSuccessResponse(result));
});

const updateOrganization = asyncHandler(async (req: Request, res: Response) => {
  const result = organizationResponseSchema.parse(await organizationService.update(organizationId(req), actorId(req), req.body as UpdateOrganizationInput));
  res.json(createSuccessResponse(result));
});

const adminUpdateOrganization = asyncHandler(async (req: Request, res: Response) => {
  const result = organizationResponseSchema.parse(await organizationService.adminUpdate(organizationId(req), actorId(req), req.body as AdminUpdateOrganizationInput));
  res.json(createSuccessResponse(result));
});

const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const result = organizationMemberListResponseSchema.parse(await organizationService.listMembers(organizationId(req), actorId(req)));
  res.json(createSuccessResponse(result));
});

const addMember = asyncHandler(async (req: Request, res: Response) => {
  const result = organizationMemberResponseSchema.parse(await organizationService.addMember(organizationId(req), actorId(req), req.body as AddOrganizationMemberInput));
  res.status(201).json(createSuccessResponse(result));
});

const removeMember = asyncHandler(async (req: Request, res: Response) => {
  await organizationService.removeMember(organizationId(req), actorId(req), Number(req.params.userId));
  res.status(204).send();
});

const adminListMembers = asyncHandler(async (req: Request, res: Response) => {
  const result = organizationMemberListResponseSchema.parse(await organizationService.listMembers(organizationId(req), actorId(req), true));
  res.json(createSuccessResponse(result));
});

const adminAddMember = asyncHandler(async (req: Request, res: Response) => {
  const result = organizationMemberResponseSchema.parse(await organizationService.addMember(organizationId(req), actorId(req), req.body as AddOrganizationMemberInput, true));
  res.status(201).json(createSuccessResponse(result));
});

const adminRemoveMember = asyncHandler(async (req: Request, res: Response) => {
  await organizationService.removeMember(organizationId(req), actorId(req), Number(req.params.userId), true);
  res.status(204).send();
});

export const organizationController = {
  listOrganizations, listAllOrganizations, getOrganization, createOrganization, updateOrganization,
  adminUpdateOrganization, listMembers, addMember, removeMember,
  adminListMembers, adminAddMember, adminRemoveMember
};
