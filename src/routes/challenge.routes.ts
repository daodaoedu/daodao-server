import { Router, type RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { challengeController } from '../controllers/challenge.controller';
import { authenticateAny, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { apiSuccessResponseSchema } from '../validators/api-response.validators';
import { challengeDetailResponseSchema, challengeJoinResultSchema, challengeListResponseSchema, challengeParamsSchema } from '../validators/challenge.validator';
import { inspirationDeckController } from '../controllers/inspiration-deck.controller';
import { drawParamsSchema, drawResultResponseSchema, selectDrawParamsSchema, selectDrawResponseSchema, todayDrawsResponseSchema } from '../validators/inspiration-deck.validator';

const router = Router();

registry.registerPath({ method: 'get', path: '/api/v1/challenges', tags: ['Challenge'], summary: '探索共同挑戰列表（公開，列出已發佈且未結束的挑戰）', responses: { 200: { description: '挑戰列表', content: { 'application/json': { schema: apiSuccessResponseSchema(challengeListResponseSchema) } } } } });
registry.registerPath({ method: 'get', path: '/api/v1/challenges/{challengeId}', tags: ['Challenge'], summary: '挑戰詳情（公開，含已結束的歷史足跡）', request: { params: challengeParamsSchema }, responses: { 200: { description: '挑戰詳情', content: { 'application/json': { schema: apiSuccessResponseSchema(challengeDetailResponseSchema) } } }, 404: { $ref: '#/components/responses/NotFoundError' } } });
registry.registerPath({ method: 'post', path: '/api/v1/challenges/{challengeId}/join', tags: ['Challenge'], summary: '加入共同挑戰（自動複製綁定模板為個人實踐）', security: [{ bearerAuth: [] }], request: { params: challengeParamsSchema }, responses: { 201: { description: '已加入', content: { 'application/json': { schema: apiSuccessResponseSchema(challengeJoinResultSchema) } } }, 401: { $ref: '#/components/responses/UnauthorizedError' }, 404: { $ref: '#/components/responses/NotFoundError' }, 409: { $ref: '#/components/responses/ConflictError' } } });

registry.registerPath({ method: 'get', path: '/api/v1/challenges/{challengeId}/draws/today', tags: ['Challenge'], summary: '今日抽卡現況（僅參與者）', security: [{ bearerAuth: [] }], request: { params: drawParamsSchema }, responses: { 200: { description: '今日抽卡現況', content: { 'application/json': { schema: apiSuccessResponseSchema(todayDrawsResponseSchema) } } }, 401: { $ref: '#/components/responses/UnauthorizedError' }, 403: { $ref: '#/components/responses/ForbiddenError' } } });
registry.registerPath({ method: 'post', path: '/api/v1/challenges/{challengeId}/draws', tags: ['Challenge'], summary: '抽一張靈感卡（每日上限 3 次，排除本日已抽與曾選定）', security: [{ bearerAuth: [] }], request: { params: drawParamsSchema }, responses: { 201: { description: '抽卡結果', content: { 'application/json': { schema: apiSuccessResponseSchema(drawResultResponseSchema) } } }, 401: { $ref: '#/components/responses/UnauthorizedError' }, 403: { $ref: '#/components/responses/ForbiddenError' }, 429: { description: '今日抽卡次數已用完' } } });
registry.registerPath({ method: 'post', path: '/api/v1/challenges/{challengeId}/draws/{drawId}/select', tags: ['Challenge'], summary: '選定今日使用的卡片（同日僅一張，可重選）', security: [{ bearerAuth: [] }], request: { params: selectDrawParamsSchema }, responses: { 200: { description: '已選定', content: { 'application/json': { schema: apiSuccessResponseSchema(selectDrawResponseSchema) } } }, 404: { $ref: '#/components/responses/NotFoundError' } } });

router.get('/', optionalAuth, challengeController.list as RequestHandler);
router.get('/:challengeId/draws/today', authenticateAny as RequestHandler, validate(drawParamsSchema, 'params'), inspirationDeckController.todayDraws as RequestHandler);
router.post('/:challengeId/draws', authenticateAny as RequestHandler, validate(drawParamsSchema, 'params'), inspirationDeckController.draw as RequestHandler);
router.post('/:challengeId/draws/:drawId/select', authenticateAny as RequestHandler, validate(selectDrawParamsSchema, 'params'), inspirationDeckController.selectDraw as RequestHandler);
router.get('/:challengeId', optionalAuth, validate(challengeParamsSchema, 'params'), challengeController.detail as RequestHandler);
router.post('/:challengeId/join', authenticateAny as RequestHandler, validate(challengeParamsSchema, 'params'), challengeController.join as RequestHandler);

export default router;
