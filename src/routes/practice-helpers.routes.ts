/**
 * Practice 輔助功能路由
 * 處理鼓勵句和引導句相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { practiceController } from '../controllers/practice.controller';
import { validate } from '../middleware/validation.middleware';
import {
  encouragementResponseSchema,
  tagPromptQuerySchema,
  tagPromptResponseSchema
} from '../validators/practice.validators';
import { apiSuccessResponseSchema, paginatedApiResponseSchema } from '../validators/api-response.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

/**
 * GET /api/v1/checkin-encouragements/random - 取得隨機鼓勵句
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/checkin-encouragements/random',
  tags: ['Practice Helpers'],
  summary: '取得隨機鼓勵句',
  description: '取得打卡時顯示的隨機鼓勵句',
  responses: {
    200: {
      description: '成功獲取鼓勵句',
      content: {
        'application/json': {
          schema: apiSuccessResponseSchema(encouragementResponseSchema)
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/tag-prompts - 取得引導句列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/tag-prompts',
  tags: ['Practice Helpers'],
  summary: '取得引導句列表',
  description: '取得標籤相關的引導句，用於打卡時顯示',
  request: {
    query: tagPromptQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取引導句列表',
      content: {
        'application/json': {
          schema: apiSuccessResponseSchema(z.array(tagPromptResponseSchema))
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

// ============================================================================
// Express 路由定義
// ============================================================================

/**
 * GET /checkin-encouragements/random
 * 取得隨機鼓勵句
 * 公開存取
 */
router.get('/checkin-encouragements/random',
  practiceController.getRandomEncouragement as RequestHandler);

/**
 * GET /tag-prompts
 * 取得引導句列表
 * 公開存取
 */
router.get('/tag-prompts',
  validate(tagPromptQuerySchema, 'query'),
  practiceController.getTagPrompts as RequestHandler);

export default router;
