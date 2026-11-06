import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { registry } from './openapi-registry';

/** Register the same liveness contract in runtime and offline OpenAPI generation. */
export const registerHealthOpenApi = (target: OpenAPIRegistry = registry): void => {
  target.registerPath({
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
};
