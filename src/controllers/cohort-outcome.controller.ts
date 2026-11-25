import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortOutcomeService } from '../services/cohort-outcome.service';
import { createSuccessResponse } from '../utils/response-helper';
import { getAuthCookieName } from '../utils/cookie-config';
import { cohortOutcomeResponseSchema, outcomeReportExportedResponseSchema, outcomeSummaryVersionSchema, type EditOutcomeSummaryInput, type GenerateOutcomeSummaryInput } from '../validators/cohort-outcome.validators';

const actor = (req: Request): number => { if (!req.user) throw new UnauthorizedError(); return req.user.id; };
const ids = (req: Request): [number, number] => [Number(req.params.programId), Number(req.params.cohortId)];
/** 轉發給 ai-backend 用的使用者 token（Bearer header 或本環境的 Auth Cookie） */
const userToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.[getAuthCookieName()];
  return cookie ?? null;
};

const get = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(cohortOutcomeResponseSchema.parse(await cohortOutcomeService.get(...ids(req), actor(req)))));
});
const generateSummary = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(outcomeSummaryVersionSchema.parse(await cohortOutcomeService.generateSummary(...ids(req), actor(req), req.body as GenerateOutcomeSummaryInput, userToken(req)))));
});
const editSummary = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(outcomeSummaryVersionSchema.parse(await cohortOutcomeService.editSummary(...ids(req), actor(req), req.body as EditOutcomeSummaryInput))));
});
const reportExported = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(outcomeReportExportedResponseSchema.parse(await cohortOutcomeService.recordReportExport(...ids(req), actor(req), (req.body as { filename?: string }).filename))));
});

export const cohortOutcomeController = { get, generateSummary, editSummary, reportExported };
