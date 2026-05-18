import { Request, Response } from 'express';
import { asyncHandler, NotFoundError } from '@/middleware/error.middleware';
import { onboardingService } from '@/services/onboarding.service';
import { createSuccessResponse } from '@/utils/response-helper';

/**
 * GET /api/v1/onboarding/status
 * 回傳目前用戶的 Onboarding 進度。
 */
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new Error('User ID not found in request');

  const status = await onboardingService.getStatus(userId);
  if (!status) throw new NotFoundError('Onboarding record not found');

  res.status(200).json(createSuccessResponse(status));
});
