import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { adminChallengeService } from '../services/admin-challenge.service';
import { createSuccessResponse } from '../utils/response-helper';
import {
  adminCohortListResponseSchema,
  adminCohortResponseSchema,
  adminParticipantListResponseSchema,
  adminProgramListResponseSchema,
  adminProgramResponseSchema,
  adminTemplateListResponseSchema,
  adminTemplateResponseSchema
} from '../validators/admin-challenge.validator';

const requireUserId = (req: Request): number => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};
const programId = (req: Request): number => Number(req.params.programId);
const cohortId = (req: Request): number => Number(req.params.cohortId);
const templateId = (req: Request): number => Number(req.params.templateId);

// ── program ─────────────────────────────────────────────────────

const listPrograms = asyncHandler(async (_req: Request, res: Response) => {
  res.json(createSuccessResponse(adminProgramListResponseSchema.parse(await adminChallengeService.listPrograms())));
});
const createProgram = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(adminProgramResponseSchema.parse(await adminChallengeService.createProgram(req.body))));
});
const updateProgram = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(adminProgramResponseSchema.parse(await adminChallengeService.updateProgram(programId(req), req.body))));
});
const archiveProgram = asyncHandler(async (req: Request, res: Response) => {
  await adminChallengeService.archiveProgram(programId(req));
  res.status(204).send();
});
const duplicateProgram = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(adminProgramResponseSchema.parse(await adminChallengeService.duplicateProgram(programId(req)))));
});

// ── cohort ──────────────────────────────────────────────────────

const listCohorts = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(adminCohortListResponseSchema.parse(await adminChallengeService.listCohorts(programId(req)))));
});
const createCohort = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(adminCohortResponseSchema.parse(await adminChallengeService.createCohort(programId(req), req.body))));
});
const updateCohort = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(adminCohortResponseSchema.parse(await adminChallengeService.updateCohort(programId(req), cohortId(req), req.body))));
});
const setCohortStatus = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(adminCohortResponseSchema.parse(await adminChallengeService.setCohortStatus(programId(req), cohortId(req), req.body.status))));
});
const archiveCohort = asyncHandler(async (req: Request, res: Response) => {
  await adminChallengeService.archiveCohort(programId(req), cohortId(req));
  res.status(204).send();
});
const duplicateCohort = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(adminCohortResponseSchema.parse(await adminChallengeService.duplicateCohort(programId(req), cohortId(req)))));
});
const listParticipants = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(adminParticipantListResponseSchema.parse(await adminChallengeService.listParticipants(programId(req), cohortId(req)))));
});

// ── template ────────────────────────────────────────────────────

const listTemplates = asyncHandler(async (_req: Request, res: Response) => {
  res.json(createSuccessResponse(adminTemplateListResponseSchema.parse(await adminChallengeService.listTemplates())));
});
const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(adminTemplateResponseSchema.parse(await adminChallengeService.createTemplate(req.body, requireUserId(req)))));
});
const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(adminTemplateResponseSchema.parse(await adminChallengeService.updateTemplate(templateId(req), req.body, requireUserId(req)))));
});
const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  await adminChallengeService.deleteTemplate(templateId(req));
  res.status(204).send();
});

export const adminChallengeController = {
  listPrograms, createProgram, updateProgram, archiveProgram, duplicateProgram,
  listCohorts, createCohort, updateCohort, setCohortStatus, archiveCohort, duplicateCohort, listParticipants,
  listTemplates, createTemplate, updateTemplate, deleteTemplate
};
