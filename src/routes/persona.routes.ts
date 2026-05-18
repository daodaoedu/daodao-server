import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  getQuestions,
  submitAnswer,
  submitSkip,
  addResonance,
  removeResonance,
  getCarouselState,
  dismissCarousel,
  getProfileMe,
  getProfileUser,
} from '../controllers/persona.controller';
import { optionalAuth } from '../middleware/auth';
import {
  submitAnswerBodySchema,
  submitSkipBodySchema,
  addResonanceBodySchema,
  resonanceAnswerIdParamSchema,
  carouselStateQuerySchema,
  profileUserParamSchema,
  profileUserQuerySchema,
  personaQuestionsApiResponseSchema,
  personaAnswerApiResponseSchema,
  personaResonanceApiResponseSchema,
  carouselStateApiResponseSchema,
  carouselDismissApiResponseSchema,
  profileMeApiResponseSchema,
  profileUserApiResponseSchema,
} from '../validators/persona.validators';

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/persona/questions',
  tags: ['Persona'],
  summary: '取得人物誌問題列表（含當前使用者答題狀態）',
  responses: {
    200: {
      description: '成功',
      content: { 'application/json': { schema: personaQuestionsApiResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/persona/answers',
  tags: ['Persona'],
  summary: '新增或更新人物誌答案',
  request: { body: { content: { 'application/json': { schema: submitAnswerBodySchema } } } },
  responses: {
    201: {
      description: '新增成功',
      content: { 'application/json': { schema: personaAnswerApiResponseSchema } },
    },
    200: {
      description: '更新成功',
      content: { 'application/json': { schema: personaAnswerApiResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/persona/skips',
  tags: ['Persona'],
  summary: '跳過人物誌問題（累計 3 次後壓制）',
  request: { body: { content: { 'application/json': { schema: submitSkipBodySchema } } } },
  responses: {
    200: { description: '成功' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/persona/resonances',
  tags: ['Persona'],
  summary: '對人物誌答案表達共鳴',
  request: { body: { content: { 'application/json': { schema: addResonanceBodySchema } } } },
  responses: {
    201: {
      description: '共鳴成功',
      content: { 'application/json': { schema: personaResonanceApiResponseSchema } },
    },
    409: { description: '已對此答案表達過共鳴' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/persona/resonances/{answerId}',
  tags: ['Persona'],
  summary: '取消對人物誌答案的共鳴',
  request: { params: resonanceAnswerIdParamSchema },
  responses: {
    200: {
      description: '取消成功',
      content: { 'application/json': { schema: personaResonanceApiResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/persona/profile/me',
  tags: ['Persona'],
  summary: '取得自己的學習人物誌（含未答虛線格）',
  responses: {
    200: {
      description: '成功',
      content: { 'application/json': { schema: profileMeApiResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/persona/profile/{userId}',
  tags: ['Persona'],
  summary: '取得指定使用者的學習人物誌（含鎖定判斷）',
  request: {
    params: profileUserParamSchema,
    query: profileUserQuerySchema,
  },
  responses: {
    200: {
      description: '成功',
      content: { 'application/json': { schema: profileUserApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/persona/carousel-state',
  tags: ['Persona'],
  summary: '取得輪播狀態（是否應顯示 + 本次問題清單）',
  request: { query: carouselStateQuerySchema },
  responses: {
    200: {
      description: '成功',
      content: { 'application/json': { schema: carouselStateApiResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/persona/carousel-dismiss',
  tags: ['Persona'],
  summary: 'Dismiss 輪播（當天不再顯示）',
  responses: {
    200: {
      description: '成功',
      content: { 'application/json': { schema: carouselDismissApiResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Express Routes
// ============================================================================

const router = Router();

router.get('/questions',
  authenticate,
  getQuestions
);

router.post('/answers',
  authenticate,
  validate(submitAnswerBodySchema, 'body'),
  submitAnswer
);

router.post('/skips',
  authenticate,
  validate(submitSkipBodySchema, 'body'),
  submitSkip
);

router.post('/resonances',
  authenticate,
  validate(addResonanceBodySchema, 'body'),
  addResonance
);

router.delete('/resonances/:answerId',
  authenticate,
  validate(resonanceAnswerIdParamSchema, 'params'),
  removeResonance
);

router.get('/carousel-state',
  authenticate,
  validate(carouselStateQuerySchema, 'query'),
  getCarouselState
);

router.post('/carousel-dismiss',
  authenticate,
  dismissCarousel
);

router.get('/profile/me',
  authenticate,
  getProfileMe
);

router.get('/profile/:userId',
  optionalAuth,
  validate(profileUserParamSchema, 'params'),
  validate(profileUserQuerySchema, 'query'),
  getProfileUser
);

export default router;
