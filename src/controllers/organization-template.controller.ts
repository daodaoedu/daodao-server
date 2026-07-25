import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { organizationTemplateService } from '../services/organization-template.service';
import { createSuccessResponse } from '../utils/response-helper';
import { organizationTemplateListResponseSchema, organizationTemplateResponseSchema, templateBindingResponseSchema, type BindOrganizationTemplateInput, type CreateOrganizationTemplateInput, type UpdateOrganizationTemplateInput } from '../validators/organization-template.validators';
const actor = (req: Request): number => { if (!req.user) throw new UnauthorizedError(); return req.user.id; };
const org = (req: Request): number => Number(req.params.organizationId);
const template = (req: Request): number => Number(req.params.templateId);
const list = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(organizationTemplateListResponseSchema.parse(await organizationTemplateService.list(org(req), actor(req))))); });
const create = asyncHandler(async (req: Request, res: Response) => { res.status(201).json(createSuccessResponse(organizationTemplateResponseSchema.parse(await organizationTemplateService.create(org(req), actor(req), req.body as CreateOrganizationTemplateInput)))); });
const update = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(organizationTemplateResponseSchema.parse(await organizationTemplateService.update(org(req), template(req), actor(req), req.body as UpdateOrganizationTemplateInput)))); });
const remove = asyncHandler(async (req: Request, res: Response) => { await organizationTemplateService.remove(org(req), template(req), actor(req)); res.status(204).send(); });
const bind = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(templateBindingResponseSchema.parse(await organizationTemplateService.bind(org(req), template(req), Number(req.params.cohortId), actor(req), true, req.body as BindOrganizationTemplateInput)))); });
const unbind = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(templateBindingResponseSchema.parse(await organizationTemplateService.bind(org(req), template(req), Number(req.params.cohortId), actor(req), false)))); });
export const organizationTemplateController = { list, create, update, remove, bind, unbind };

