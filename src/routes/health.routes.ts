/**
 * 健康檢查路由
 * 原為 routes/index.ts 內的 inline handler——但 OpenAPI 生成器只載入
 * `*routes.ts` 檔案，inline 寫法不會進 contract，導致 f2e 端
 * 依 openapi-types 呼叫 /api/v1/health 時型別缺失。
 */

import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';

const router = Router();

export const healthResponseSchema = z.object({
  success: z.literal(true).openapi({ description: '服務正常', example: true }),
  message: z.string().openapi({ description: '狀態訊息', example: 'DaoDao API is running' }),
  timestamp: z.string().openapi({
    description: 'ISO 8601 時間戳',
    example: '2026-07-19T00:00:00.000Z'
  }),
  version: z.string().openapi({ description: 'API 版本', example: '1.0.0' })
}).openapi('HealthResponse');

registry.registerPath({
  method: 'get',
  path: '/api/v1/health',
  tags: ['System'],
  summary: 'API 健康檢查',
  description: '回傳 API 運行狀態，供監控與前端連線檢查使用。',
  responses: {
    200: {
      description: 'API 運行中',
      content: {
        'application/json': {
          schema: healthResponseSchema
        }
      }
    }
  }
});

/**
 * GET /api/v1/health
 */
const healthCheck: RequestHandler = (_req, res) => {
  res.json({
    success: true,
    message: 'DaoDao API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};

router.get('/', healthCheck);

export default router;
