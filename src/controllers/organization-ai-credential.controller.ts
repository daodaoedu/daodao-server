import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { organizationAiCredentialService } from '../services/organization-ai-credential.service';
import { createSuccessResponse } from '../utils/response-helper';
import { organizationAiCredentialResponseSchema, organizationAiCredentialTestResultSchema, type SetOrganizationAiCredentialInput } from '../validators/organization-ai-credential.validators';

const actor = (req: Request): number => { if (!req.user) throw new UnauthorizedError(); return req.user.id; };
const org = (req: Request): number => Number(req.params.organizationId);

const get = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(organizationAiCredentialResponseSchema.parse(await organizationAiCredentialService.get(org(req), actor(req)))));
});
const set = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(organizationAiCredentialResponseSchema.parse(await organizationAiCredentialService.set(org(req), actor(req), req.body as SetOrganizationAiCredentialInput))));
});
const clear = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(organizationAiCredentialResponseSchema.parse(await organizationAiCredentialService.clear(org(req), actor(req)))));
});
const test = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(organizationAiCredentialTestResultSchema.parse(await organizationAiCredentialService.test(org(req), actor(req)))));
});

export const organizationAiCredentialController = { get, set, clear, test };
