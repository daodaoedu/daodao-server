import { Router, type RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { activityController } from '../controllers/activity.controller';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { apiSuccessResponseSchema } from '../validators/api-response.validators';
import { activityDetailResponseSchema, activityListResponseSchema, activityParamsSchema } from '../validators/activity.validator';

const router = Router();

registry.registerPath({ method: 'get', path: '/api/v1/activities', tags: ['Activity'], summary: '探索活動列表（公開，列出組織公開、已發佈且未結束的燈塔期）', responses: { 200: { description: '活動列表', content: { 'application/json': { schema: apiSuccessResponseSchema(activityListResponseSchema) } } } } });
registry.registerPath({ method: 'get', path: '/api/v1/activities/{cohortId}', tags: ['Activity'], summary: '活動詳情（公開；已結束仍可查看）', request: { params: activityParamsSchema }, responses: { 200: { description: '活動詳情', content: { 'application/json': { schema: apiSuccessResponseSchema(activityDetailResponseSchema) } } }, 404: { $ref: '#/components/responses/NotFoundError' } } });

router.get('/', optionalAuth, activityController.list as RequestHandler);
router.get('/:cohortId', optionalAuth, validate(activityParamsSchema, 'params'), activityController.detail as RequestHandler);

export default router;
