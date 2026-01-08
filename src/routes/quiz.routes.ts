/**
 * 測驗結果路由
 * 定義測驗結果相關的 API 端點
 */

import { Router, RequestHandler } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validation.middleware';
import { saveQuizResultSchema } from '@/validators/quiz.validators';
import { quizController } from '@/controllers/quiz.controller';

const router = Router();

// 所有測驗路由都需要認證
router.use(authenticate);

/**
 * POST /
 * 保存測驗結果
 *
 * @description 保存用戶完成測驗後的結果數據
 * @access Private - 需要 JWT 認證
 * @body {QuizResultData} - 測驗結果數據（resultType, scores, answers）
 * @returns {QuizResultResponse} - 保存成功的測驗結果（201 Created）
 */
router.post(
  '/',
  validate(saveQuizResultSchema, 'body'),
  quizController.saveResult as RequestHandler
);

/**
 * GET /latest
 * 取得最新測驗結果
 *
 * @description 獲取當前用戶最新的測驗結果
 * @access Private - 需要 JWT 認證
 * @returns {QuizResultResponse} - 最新的測驗結果（200 OK）
 * @throws {NotFoundError} - 若用戶尚無測驗結果（404 Not Found）
 */
router.get(
  '/latest',
  quizController.getLatestResult as RequestHandler
);

export default router;
