import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortExportService } from '../services/cohort-export.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortExportResponseSchema, exportConsentResponseSchema } from '../validators/cohort-export.validators';
const consent = asyncHandler(async (req: Request, res: Response) => { if (!req.user) throw new UnauthorizedError(); res.json(createSuccessResponse(exportConsentResponseSchema.parse(await cohortExportService.setConsent(Number(req.params.cohortId), req.user.id, req.body.consent)))); });
const exportOutcome = asyncHandler(async (req: Request, res: Response) => { if (!req.user) throw new UnauthorizedError(); res.json(createSuccessResponse(cohortExportResponseSchema.parse(await cohortExportService.exportOutcome(Number(req.params.programId), Number(req.params.cohortId), req.user.id)))); });
export const cohortExportController = { consent, exportOutcome };

