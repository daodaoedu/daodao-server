import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { registry } from '@/config/openapi-registry';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validation.middleware';
import { createLimiter } from '@/middleware/rate-limit.middleware';
import {
  createSurveyBodySchema,
  updateSurveyStatusBodySchema,
  submitResponseBodySchema,
  updateSurveyBodySchema,
  trackPartialBodySchema,
  surveyResponseSchema,
} from '@/validators/survey.validators';
import { apiSuccessResponseSchema } from '@/validators/api-response.validators';
import { surveyController } from '@/controllers/survey.controller';

const router = Router();

// OpenAPI registrations
registry.registerPath({
  method: 'post', path: '/api/v1/surveys', tags: ['Survey'],
  summary: '建立問卷', security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: createSurveyBodySchema } }, required: true } },
  responses: { 201: { description: '建立成功' }, 401: { $ref: '#/components/responses/UnauthorizedError' } },
});

registry.registerPath({
  method: 'get', path: '/api/v1/surveys', tags: ['Survey'],
  summary: '取得我的問卷列表', security: [{ bearerAuth: [] }],
  responses: { 200: { description: '問卷列表' }, 401: { $ref: '#/components/responses/UnauthorizedError' } },
});

registry.registerPath({
  method: 'get', path: '/api/v1/surveys/{id}', tags: ['Survey'],
  summary: '取得問卷詳情', security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: '問卷詳情' }, 404: { $ref: '#/components/responses/NotFoundError' } },
});

registry.registerPath({
  method: 'patch', path: '/api/v1/surveys/{id}/status', tags: ['Survey'],
  summary: '更新問卷狀態', security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: updateSurveyStatusBodySchema } }, required: true } },
  responses: { 200: { description: '更新成功' }, 404: { $ref: '#/components/responses/NotFoundError' } },
});

registry.registerPath({
  method: 'get', path: '/api/v1/surveys/public/{externalId}', tags: ['Survey'],
  summary: '取得公開問卷（填寫用）',
  request: { params: z.object({ externalId: z.string().openapi({ description: '問卷公開識別碼' }) }) },
  responses: { 200: { description: '問卷資料及新期末問卷填答資格', content: { 'application/json': { schema: apiSuccessResponseSchema(surveyResponseSchema) } } }, 404: { $ref: '#/components/responses/NotFoundError' } },
});

registry.registerPath({
  method: 'post', path: '/api/v1/surveys/public/{externalId}/responses', tags: ['Survey'],
  summary: '提交問卷回應',
  request: { params: z.object({ externalId: z.string().openapi({ description: '問卷公開識別碼' }) }), body: { content: { 'application/json': { schema: submitResponseBodySchema } }, required: true } },
  responses: { 201: { description: '提交成功', content: { 'application/json': { schema: apiSuccessResponseSchema(z.union([z.object({ response_id: z.number() }), z.object({ completed: z.literal(true) })])) } } }, 401: { $ref: '#/components/responses/UnauthorizedError' }, 403: { $ref: '#/components/responses/ForbiddenError' }, 409: { $ref: '#/components/responses/ConflictError' }, 404: { $ref: '#/components/responses/NotFoundError' } },
});

registry.registerPath({
  method: 'get', path: '/api/v1/surveys/{id}/analytics', tags: ['Survey'],
  summary: '取得問卷分析', security: [{ bearerAuth: [] }],
  responses: { 200: { description: '分析資料' }, 404: { $ref: '#/components/responses/NotFoundError' } },
});

// Public routes (no auth required)
router.get('/public/:externalId', optionalAuth, surveyController.getPublic as RequestHandler);
router.post('/public/:externalId/responses', optionalAuth,
  validate(submitResponseBodySchema, 'body'),
  surveyController.submitResponse as RequestHandler
);
router.post('/public/:externalId/views', createLimiter, surveyController.trackView as RequestHandler);
router.post('/public/:externalId/partial', createLimiter, validate(trackPartialBodySchema, 'body'), surveyController.trackPartial as RequestHandler);

// Protected routes
router.use(authenticate);

router.post('/', validate(createSurveyBodySchema, 'body'), surveyController.create as RequestHandler);
router.get('/', surveyController.listMine as RequestHandler);
router.get('/:id', surveyController.getById as RequestHandler);
router.patch('/:id/status', validate(updateSurveyStatusBodySchema, 'body'), surveyController.updateStatus as RequestHandler);
router.get('/:id/analytics', surveyController.getAnalytics as RequestHandler);
router.patch('/:id', validate(updateSurveyBodySchema, 'body'), surveyController.update as RequestHandler);
router.delete('/:id', surveyController.delete as RequestHandler);
router.get('/:id/responses', surveyController.listResponses as RequestHandler);
router.get('/:id/responses/:responseId', surveyController.getResponse as RequestHandler);
router.delete('/:id/responses/:responseId', surveyController.deleteResponse as RequestHandler);
router.post('/:id/analytics/generate', surveyController.generateAnalytics as RequestHandler);

export default router;
