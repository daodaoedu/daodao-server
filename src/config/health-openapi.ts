/** Share the health contract between runtime registration and generated clients. */
import { z } from 'zod';
import { registry } from './openapi-registry';
  // 註冊健康檢查端點到 OpenAPI
  registry.registerPath({
    method: 'get',
    path: '/api/v1/health',
    tags: ['System'],
    summary: '健康檢查',
    description: '檢查 API 服務是否正常運行',
    responses: {
      200: {
        description: '服務正常運行',
        content: {
          'application/json': {
            schema: z.object({
              status: z.string(),
              uptime: z.number(),
              timestamp: z.string()
            }).openapi({
              description: '健康檢查響應'
            })
          }
        }
      }
    }
  });
