import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortMessageService } from '../services/cohort-message.service';
import { createSuccessResponse } from '../utils/response-helper';
import {
  cohortMessageListResponseSchema, cohortMessageResponseSchema, cohortMessageTemplateListQuerySchema, cohortMessageTemplateListResponseSchema,
  cohortMessageTemplateResponseSchema, cohortParticipantCheckinsResponseSchema, type CreateCohortMessageTemplateInput, type SendCohortMessageInput
} from '../validators/cohort-message.validators';

const actor = (req: Request): number => { if (!req.user) throw new UnauthorizedError(); return req.user.id; };
const num = (req: Request, key: string): number => Number(req.params[key]);
const listCheckins = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(cohortParticipantCheckinsResponseSchema.parse(await cohortMessageService.listCheckins(num(req, 'programId'), num(req, 'cohortId'), actor(req), num(req, 'userId'), num(req, 'practiceId')))));
});
const listMessages = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(cohortMessageListResponseSchema.parse(await cohortMessageService.listMessages(num(req, 'programId'), num(req, 'cohortId'), actor(req), num(req, 'userId')))));
});
const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(cohortMessageResponseSchema.parse(await cohortMessageService.sendMessage(num(req, 'programId'), num(req, 'cohortId'), actor(req), num(req, 'userId'), req.body as SendCohortMessageInput))));
});
const listTemplates = asyncHandler(async (req: Request, res: Response) => {
  const query = cohortMessageTemplateListQuerySchema.parse(req.query);
  res.json(createSuccessResponse(cohortMessageTemplateListResponseSchema.parse(await cohortMessageService.listTemplates(num(req, 'organizationId'), actor(req), query.category))));
});
const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(cohortMessageTemplateResponseSchema.parse(await cohortMessageService.createTemplate(num(req, 'organizationId'), actor(req), req.body as CreateCohortMessageTemplateInput))));
});
const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  await cohortMessageService.deleteTemplate(num(req, 'organizationId'), actor(req), num(req, 'templateId'));
  res.status(204).send();
});
export const cohortMessageController = { listCheckins, listMessages, sendMessage, listTemplates, createTemplate, deleteTemplate };
