import { Request, Response } from 'express';
import { asyncHandler, NotFoundError } from '@/middleware/error.middleware';
import { onboardingService } from '@/services/onboarding.service';
import * as onboardingFlowService from '@/services/onboarding-flow.service';
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

/**
 * GET /api/v1/onboarding/flows/active
 * 回傳目前啟用的 Onboarding 流程（公開，不需登入）。
 */
export const getActiveFlow = asyncHandler(async (_req: Request, res: Response) => {
  const flow = await onboardingFlowService.getActiveFlow();
  res.json(createSuccessResponse(flow));
});

/**
 * POST /api/v1/onboarding/flows/:id/responses
 * 記錄用戶對某流程步驟的回答（需登入）。
 */
export const submitFlowResponse = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new Error('User ID not found in request');

  const flowId = parseInt(req.params.id, 10);
  const { stepId, answer } = req.body as { stepId: number; answer: string[] };

  if (!stepId || !Array.isArray(answer)) {
    res.status(400).json({ success: false, message: 'stepId and answer[] are required' });
    return;
  }

  await onboardingFlowService.recordResponse(userId, flowId, stepId, answer);
  res.json(createSuccessResponse({ recorded: true }));
});
