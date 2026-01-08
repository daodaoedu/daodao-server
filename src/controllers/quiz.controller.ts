/**
 * 測驗結果控制器
 * 處理 HTTP 請求並調用服務層
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { NotFoundError } from '@/middleware/error.middleware';
import { quizService } from '@/services/quiz.service';
import {
  saveQuizResultResponseSchema,
  getQuizResultResponseSchema
} from '@/validators/quiz.validators';

/**
 * 保存測驗結果
 *
 * @route POST /api/v1/quizResults
 * @access Private - 需要 JWT 認證
 */
export const saveResult = asyncHandler(async (req: Request, res: Response) => {
  // 從認證的用戶信息中獲取用戶 ID
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('User ID not found in request');
  }

  // 調用服務層保存測驗結果
  const response = await quizService.saveResult(userId, req.body);

  // 驗證響應格式
  const validatedResponse = saveQuizResultResponseSchema.parse(response);

  // 返回成功響應（201 Created）
  res.status(201).json(validatedResponse);
});

/**
 * 取得最新測驗結果
 *
 * @route GET /api/v1/quizResults/latest
 * @access Private - 需要 JWT 認證
 */
export const getLatestResult = asyncHandler(async (req: Request, res: Response) => {
  // 從認證的用戶信息中獲取用戶 ID
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('User ID not found in request');
  }

  // 調用服務層獲取最新結果
  const response = await quizService.getLatestResult(userId);

  // 如果沒有結果，返回 404
  if (response.data === null) {
    throw new NotFoundError('尚無測驗結果');
  }

  // 驗證響應格式
  const validatedResponse = getQuizResultResponseSchema.parse(response);

  // 返回成功響應（200 OK）
  res.json(validatedResponse);
});

/**
 * 測驗控制器對象
 * 導出所有測驗相關的控制器方法
 */
export const quizController = {
  saveResult,
  getLatestResult
};

export default quizController;
