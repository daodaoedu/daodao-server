/**
 * 測驗結果路由 - 帶 OpenAPI 定義
 * 展示如何使用 zod-to-openapi 官方推薦的 registry.registerPath() 方法
 */

import { Router, RequestHandler } from 'express';
import { registry } from '@/config/openapi-registry';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validation.middleware';
import {
  saveQuizResultSchema,
  saveQuizResultBodySchema,
  saveQuizResultResponseSchema,
  getQuizResultResponseSchema
} from '@/validators/quiz.validators';
import { quizController } from '@/controllers/quiz.controller';

const router = Router();

// 所有測驗路由都需要認證
router.use(authenticate);

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * POST /api/v1/quiz - 保存測驗結果
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/quiz',
  tags: ['Quiz'],
  summary: '保存測驗結果',
  description: '保存用戶完成測驗後的結果數據，包括結果類型 (L/C/A/D/O)、各維度分數和答題記錄。系統會自動記錄完成時間並關聯到當前登入用戶。',
  request: {
    body: {
      description: '測驗結果數據',
      content: {
        'application/json': {
          schema: saveQuizResultBodySchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '測驗結果保存成功',
      content: {
        'application/json': {
          schema: saveQuizResultResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/quiz/latest - 取得最新測驗結果
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/quiz/latest',
  tags: ['Quiz'],
  summary: '取得最新測驗結果',
  description: '獲取當前已登入用戶最新的測驗結果。若用戶尚未完成任何測驗，將返回 404 錯誤。',
  responses: {
    200: {
      description: '成功獲取測驗結果',
      content: {
        'application/json': {
          schema: getQuizResultResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ============================================================================
// Express 路由定義
// ============================================================================

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
