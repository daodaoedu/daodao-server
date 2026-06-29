/**
 * 測驗結果控制器
 * 處理 HTTP 請求並調用服務層
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { NotFoundError } from '@/middleware/error.middleware';
import { quizService } from '@/services/quiz.service';
import { setQuizClaimCookie, clearQuizClaimCookie } from '@/utils/cookie-config';
import {
  saveQuizResultResponseSchema,
  getQuizResultResponseSchema,
  savePendingQuizResponseSchema,
  claimQuizResultResponseSchema
} from '@/validators/quiz.validators';

/**
 * 保存測驗結果（已認證用戶）
 *
 * @route POST /api/v1/quiz
 * @access Private
 */
export const saveResult = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('User ID not found in request');
  }

  const response = await quizService.saveResult(userId, req.body);
  const validatedResponse = saveQuizResultResponseSchema.parse(response);
  res.status(201).json(validatedResponse);
});

/**
 * 暫存測驗結果（匿名用戶，不需認證）
 * 設定 quiz_claim cookie 供後續認領
 *
 * @route POST /api/v1/quiz/pending
 * @access Public
 */
export const savePending = asyncHandler(async (req: Request, res: Response) => {
  const response = await quizService.createPending(req.body);

  setQuizClaimCookie(res, response.data.claimToken);

  const validatedResponse = savePendingQuizResponseSchema.parse(response);
  res.status(201).json(validatedResponse);
});

/**
 * 認領匿名測驗結果
 *
 * @route POST /api/v1/quiz/claim
 * @access Private
 */
export const claimResult = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('User ID not found in request');
  }

  const claimToken = req.cookies?.quiz_claim as string | undefined;
  if (!claimToken) {
    throw new NotFoundError('無可認領的測驗結果');
  }

  const result = await quizService.claimByToken(userId, claimToken);
  if (!result) {
    clearQuizClaimCookie(res);
    throw new NotFoundError('測驗結果不存在或已過期');
  }

  clearQuizClaimCookie(res);

  const response = claimQuizResultResponseSchema.parse({
    success: true,
    data: result,
    timestamp: new Date().toISOString()
  });
  res.json(response);
});

/**
 * 取得最新測驗結果
 *
 * @route GET /api/v1/quiz/latest
 * @access Private
 */
export const getLatestResult = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('User ID not found in request');
  }

  const response = await quizService.getLatestResult(userId);

  if (response.data === null) {
    throw new NotFoundError('尚無測驗結果');
  }

  const validatedResponse = getQuizResultResponseSchema.parse(response);
  res.json(validatedResponse);
});

export const quizController = {
  saveResult,
  savePending,
  claimResult,
  getLatestResult
};

export default quizController;
