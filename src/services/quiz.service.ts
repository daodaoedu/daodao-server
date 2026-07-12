/**
 * 測驗結果服務
 * 處理測驗結果的業務邏輯和數據庫操作
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/services/database/prisma.service';
import { createSuccessResponse } from '@/utils/response-helper';
import { loggerService } from '@/services/logging/logger.service';
import type { ApiResponse, ApiSuccessResponse } from '@/types/api-response.types';
import type { QuizResultData, QuizResultResponse, QuizPendingResponse } from '@/types/quiz.types';

/** 暫存過期時間：24 小時 */
const PENDING_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * 保存測驗結果（已認證用戶）
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
 * 暫存測驗結果（匿名用戶，不需認證）
 * 產生 claim_token，登入後可認領
 */
export const createPending = async (
  data: QuizResultData
): Promise<ApiSuccessResponse<QuizPendingResponse>> => {
  const claimToken = randomUUID();
  const expiresAt = new Date(Date.now() + PENDING_EXPIRY_MS);

  await prisma.quiz_results.create({
    data: {
      user_id: null,
      result_type: data.resultType.toUpperCase(),
      scores: data.scores,
      answers: data.answers || undefined,
      completed_at: new Date(),
      claim_token: claimToken,
      expires_at: expiresAt
    }
  });

  // 附帶清理過期暫存（非阻塞）
  cleanupExpiredPending().catch(() => undefined);

  return createSuccessResponse({ claimToken });
};

/**
 * 透過 claim_token 認領匿名測驗結果
 * @returns 認領成功的結果，找不到或已過期則回傳 null
 */
export const claimByToken = async (
  userId: number,
  claimToken: string
): Promise<QuizResultResponse | null> => {
  // 原子操作：updateMany 帶完整 WHERE 避免 race condition
  const { count } = await prisma.quiz_results.updateMany({
    where: {
      claim_token: claimToken,
      user_id: null,
      expires_at: { gt: new Date() }
    },
    data: {
      user_id: userId,
      claim_token: null,
      expires_at: null
    }
  });

  if (count === 0) {
    return null;
  }

  const claimed = await prisma.quiz_results.findFirst({
    where: { user_id: userId },
    orderBy: { completed_at: 'desc' }
  });

  if (!claimed) {
    return null;
  }

  loggerService.info('Quiz result claimed', { userId, quizResultId: claimed.id });

  return {
    id: claimed.id,
    resultType: claimed.result_type,
    scores: claimed.scores as Record<string, number>,
    completedAt: claimed.completed_at.toISOString()
  };
};

/**
 * 取得用戶最新測驗結果
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
 * 清理過期的匿名暫存測驗結果
 */
export const cleanupExpiredPending = async (): Promise<number> => {
  const { count } = await prisma.quiz_results.deleteMany({
    where: {
      user_id: null,
      expires_at: { lt: new Date() }
    }
  });

  if (count > 0) {
    loggerService.info('Cleaned up expired pending quiz results', { count });
  }

  return count;
};

export const quizService = {
  saveResult,
  createPending,
  claimByToken,
  getLatestResult,
  cleanupExpiredPending
};

export default quizService;
