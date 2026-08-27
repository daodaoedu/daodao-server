import { Router, type RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { challengeController } from '../controllers/challenge.controller';
import { authenticateAny, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { apiSuccessResponseSchema } from '../validators/api-response.validators';
import { challengeDetailResponseSchema, challengeJoinResultSchema, challengeListResponseSchema, challengeParamsSchema } from '../validators/challenge.validator';

const router = Router();

registry.registerPath({ method: 'get', path: '/api/v1/challenges', tags: ['Challenge'], summary: '探索共同挑戰列表（公開，列出已發佈且未結束的挑戰）', responses: { 200: { description: '挑戰列表', content: { 'application/json': { schema: apiSuccessResponseSchema(challengeListResponseSchema) } } } } });
registry.registerPath({ method: 'get', path: '/api/v1/challenges/{challengeId}', tags: ['Challenge'], summary: '挑戰詳情（公開，含已結束的歷史足跡）', request: { params: challengeParamsSchema }, responses: { 200: { description: '挑戰詳情', content: { 'application/json': { schema: apiSuccessResponseSchema(challengeDetailResponseSchema) } } }, 404: { $ref: '#/components/responses/NotFoundError' } } });
registry.registerPath({ method: 'post', path: '/api/v1/challenges/{challengeId}/join', tags: ['Challenge'], summary: '加入共同挑戰（自動複製綁定模板為個人實踐）', security: [{ bearerAuth: [] }], request: { params: challengeParamsSchema }, responses: { 201: { description: '已加入', content: { 'application/json': { schema: apiSuccessResponseSchema(challengeJoinResultSchema) } } }, 401: { $ref: '#/components/responses/UnauthorizedError' }, 404: { $ref: '#/components/responses/NotFoundError' }, 409: { $ref: '#/components/responses/ConflictError' } } });

router.get('/', optionalAuth, challengeController.list as RequestHandler);
router.get('/:challengeId', optionalAuth, validate(challengeParamsSchema, 'params'), challengeController.detail as RequestHandler);
router.post('/:challengeId/join', authenticateAny as RequestHandler, validate(challengeParamsSchema, 'params'), challengeController.join as RequestHandler);

export default router;
