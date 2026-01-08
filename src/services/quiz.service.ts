/**
 * 測驗結果服務
 * 處理測驗結果的業務邏輯和數據庫操作
 */

import { prisma } from '@/services/database/prisma.service';
import { createSuccessResponse } from '@/utils/response-helper';
import type { ApiResponse } from '@/types/api-response.types';
import type { QuizResultData, QuizResultResponse } from '@/types/quiz.types';

/**
 * 保存測驗結果
 *
 * @param userId - 用戶 ID（從 JWT token 獲取）
 * @param data - 測驗結果數據
 * @returns 包含保存成功的測驗結果信息
 */
export const saveResult = async (
  userId: number,
  data: QuizResultData
): Promise<ApiResponse<QuizResultResponse>> => {
  const result = await prisma.quiz_results.create({
    data: {
      user_id: userId,
      result_type: data.resultType.toUpperCase(),
      scores: data.scores,
      answers: data.answers || undefined,
      completed_at: new Date()
    }
  });

  return createSuccessResponse({
    id: result.id,
    resultType: result.result_type,
    scores: result.scores as Record<string, number>,
    completedAt: result.completed_at.toISOString()
  });
};

/**
 * 取得用戶最新測驗結果
 *
 * @param userId - 用戶 ID（從 JWT token 獲取）
 * @returns 用戶最新的測驗結果，若無結果則返回 null
 */
export const getLatestResult = async (
  userId: number
): Promise<ApiResponse<QuizResultResponse | null>> => {
  const result = await prisma.quiz_results.findFirst({
    where: { user_id: userId },
    orderBy: { completed_at: 'desc' }
  });

  if (!result) {
    return createSuccessResponse(null);
  }

  return createSuccessResponse({
    id: result.id,
    resultType: result.result_type,
    scores: result.scores as Record<string, number>,
    completedAt: result.completed_at.toISOString()
  });
};

/**
 * 測驗服務對象
 * 導出所有測驗相關的服務方法
 */
export const quizService = {
  saveResult,
  getLatestResult
};

export default quizService;
