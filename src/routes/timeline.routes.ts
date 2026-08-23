import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { getTimeline } from '../controllers/timeline.controller';
import { timelineApiResponseSchema, timelineQuerySchema } from '../validators/timeline.validators';

const router = Router();

registry.registerPath({
  method: 'get',
  path: '/api/v1/me/timeline',
  tags: ['Timeline'],
  summary: '取得我的學習時間軸',
  request: { query: timelineQuerySchema },
  responses: {
    200: { description: '混合學習事件流', content: { 'application/json': { schema: timelineApiResponseSchema } } },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
  security: [{ bearerAuth: [] }],
});

router.get('/', authenticate, validate(timelineQuerySchema, 'query'), getTimeline);

export default router;
