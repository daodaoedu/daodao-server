import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { lighthousePreferenceService } from '../services/lighthouse-preference.service';
import { createSuccessResponse } from '../utils/response-helper';
import { lighthousePreferenceResponseSchema, type UpdateLighthousePreferenceInput } from '../validators/lighthouse-preference.validators';

/** Read the authenticated account's Lighthouse preference. */
const get = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('請先登入');
  res.json(createSuccessResponse(lighthousePreferenceResponseSchema.parse(await lighthousePreferenceService.get(req.user.id))));
});

/** Persist the authenticated account's selected organization. */
const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('請先登入');
  const { organizationId } = req.body as UpdateLighthousePreferenceInput;
  res.json(createSuccessResponse(lighthousePreferenceResponseSchema.parse(await lighthousePreferenceService.update(req.user.id, organizationId))));
});

export const lighthousePreferenceController = { get, update };
