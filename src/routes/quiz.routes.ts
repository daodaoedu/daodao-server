/**
 * 測驗結果路由 - 帶 OpenAPI 定義
 */

import { Router, RequestHandler } from 'express';
import { registry } from '@/config/openapi-registry';
import { authenticate } from '@/middleware/auth';
import { strictLimiter } from '@/middleware/rate-limit.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
  saveQuizResultBodySchema,
  saveQuizResultResponseSchema,
  getQuizResultResponseSchema,
  savePendingQuizResponseSchema,
  claimQuizResultResponseSchema
} from '@/validators/quiz.validators';
import { quizController } from '@/controllers/quiz.controller';

const router = Router();

// ============================================================================
// 公開路由（不需認證）
// ============================================================================

/**
 * POST /api/v1/quiz/pending - 暫存測驗結果（匿名）
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/quiz/pending',
  tags: ['Quiz'],
  summary: '暫存測驗結果（匿名）',
  description: '未登入用戶完成測驗後暫存結果。回傳 claim token 並設定 quiz_claim cookie，登入後可自動認領。暫存結果 24 小時後過期。',
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
      description: '暫存成功',
      content: {
        'application/json': {
          schema: savePendingQuizResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

router.post(
  '/pending',
  strictLimiter,
  validate(saveQuizResultBodySchema, 'body'),
  quizController.savePending as RequestHandler
);

// ============================================================================
// 需認證的路由
// ============================================================================

router.use(authenticate);

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
 * POST /api/v1/quiz/claim - 認領匿名測驗結果
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/quiz/claim',
  tags: ['Quiz'],
  summary: '認領匿名測驗結果',
  description: '透過 quiz_claim cookie 認領暫存的匿名測驗結果，將其關聯到當前登入用戶。認領後清除 cookie。',
  responses: {
    200: {
      description: '認領成功',
      content: {
        'application/json': {
          schema: claimQuizResultResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
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
// Express 路由定義（需認證）
// ============================================================================

router.post(
  '/',
  validate(saveQuizResultBodySchema, 'body'),
  quizController.saveResult as RequestHandler
);

router.post(
  '/claim',
  quizController.claimResult as RequestHandler
);

router.get(
  '/latest',
  quizController.getLatestResult as RequestHandler
);

export default router;
