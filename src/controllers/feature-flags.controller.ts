import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import { createFeatureFlag, getPublicFeatureFlags, listFeatureFlags, updateFeatureFlag } from '../services/feature-flags.service';
import type { CreateFeatureFlagInput, UpdateFeatureFlagInput } from '../validators/feature-flags.validator';

/** Evaluate private current-user/current-organization flags without caching. */
export const getPublicFlags = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user && !req.user.isTemp ? req.user.id : undefined;
  const organizationId = req.query.organizationId === undefined ? undefined : Number(req.query.organizationId);
  res.json(createSuccessResponse(await getPublicFeatureFlags(userId, organizationId)));
});
/** Read the registry administrative metadata. */
export const getAdminFlags = asyncHandler(async (_req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  res.json(createSuccessResponse(await listFeatureFlags()));
});
/** Register an off feature with its authenticated administrator audit. */
export const postAdminFlag = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.set('Cache-Control', 'no-store');
  res.status(201).json(createSuccessResponse(await createFeatureFlag(req.body as CreateFeatureFlagInput, {
    adminId: req.user.id, ipAddress: req.ip, userAgent: req.get('user-agent')
  })));
});
/** Persist full validated configuration and roster with its authenticated audit. */
export const patchAdminFlag = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.set('Cache-Control', 'no-store');
  res.json(createSuccessResponse(await updateFeatureFlag(req.params.key, req.body as UpdateFeatureFlagInput, {
    adminId: req.user.id, ipAddress: req.ip, userAgent: req.get('user-agent')
  })));
});
