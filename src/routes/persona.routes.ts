import { z } from 'zod';
import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import {
  getQuestions,
  submitAnswer,
  submitSkip,
  getCarouselState,
  dismissCarousel,
  getProfileMe,
  getProfileUser,
  getQuestionAnswers,
} from '../controllers/persona.controller';
import { optionalAuth } from '../middleware/auth';
import {
  submitAnswerBodySchema,
  submitSkipBodySchema,
  carouselStateQuerySchema,
  profileUserParamSchema,
  profileUserQuerySchema,
  personaQuestionsApiResponseSchema,
  personaAnswerApiResponseSchema,
  carouselStateApiResponseSchema,
  carouselDismissApiResponseSchema,
  profileMeApiResponseSchema,
  profileUserApiResponseSchema,
  questionAnswersParamSchema,
  questionAnswersQuerySchema,
  questionAnswersApiResponseSchema,
} from '../validators/persona.validators';

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/persona/questions',
  tags: ['Persona'],
  summary: '取得人物誌問題列表（可選登入）',
  description: '回傳所有學習人物誌問題。已登入時，每題附帶當前使用者的答題狀態（已作答、跳過次數、是否已壓制）；未登入時一律回傳未作答狀態。',
  request: {
    query: z.object({ locale: z.string().optional().openapi({ description: '語系代碼（預設 zh-TW）', example: 'zh-TW' }) }),
  },
  responses: {
    200: {
      description: '成功',
      content: { 'application/json': { schema: personaQuestionsApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/persona/answers',
  tags: ['Persona'],
  summary: '新增或更新人物誌答案',
  description: '提交對指定問題的答案。若該使用者已作答過此題則覆蓋（回傳 200），否則新增（回傳 201）。selectedValue 與 textAnswer 至少填一項。',
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
  description: '記錄使用者跳過指定問題一次。同一題累計跳過 3 次後 suppressed 變為 true，問題不再出現於輪播與問題列表中。',
  request: { body: { content: { 'application/json': { schema: submitSkipBodySchema } } } },
  responses: {
    200: { description: '成功，回傳最新 skipCount 與 suppressed 狀態' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/persona/profile/me',
  tags: ['Persona'],
  summary: '取得自己的學習人物誌（含未答虛線格）',
  description: '回傳當前使用者的完整人物誌，包含已作答題目（有答案內容）與尚未作答題目（isPlaceholder: true，作為虛線卡片顯示）。',
  request: {
    query: z.object({ locale: z.string().optional().openapi({ description: '語系代碼（預設 zh-TW）', example: 'zh-TW' }) }),
  },
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
  description: 'userId 為目標使用者的 external_id（UUID）。若請求方已登入且自身答題數不足 5 題，回傳 viewerIsLocked: true 及所需答題數。未登入時不回傳鎖定資訊。',
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
  path: '/api/v1/persona/questions/{questionId}/answers',
  tags: ['Persona'],
  summary: '取得單一題目的所有用戶回應',
  description: '回傳指定題目的所有用戶答案，支援 cursor 分頁。可選登入：登入者會附帶自己對各答案的反應、連結狀態、護照鎖定判斷；不公開個人資料的用戶，userId / name / photoURL 將遮罩為 null。',
  request: {
    params: questionAnswersParamSchema,
    query: questionAnswersQuerySchema,
  },
  responses: {
    200: {
      description: '成功',
      content: { 'application/json': { schema: questionAnswersApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/persona/carousel-state',
  tags: ['Persona'],
  summary: '取得輪播狀態（是否應顯示 + 本次問題清單）',
  description: '決定是否顯示人物誌輪播（shouldShow）及本次要展示的最多 5 題。新使用者（註冊未滿 5 天）每次都顯示；老使用者每隔 2 個 session 顯示一次；當天已 dismiss 則不再顯示。可傳 replace 參數替換特定題目。',
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
  description: '使用者關閉輪播後呼叫此 API，記錄 dismiss 時間並重置 session 計數器。同一天（UTC）內再次呼叫 carousel-state 時 shouldShow 將為 false。',
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
  optionalAuth,
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

router.get('/questions/:questionId/answers',
  optionalAuth,
  validate(questionAnswersParamSchema, 'params'),
  validate(questionAnswersQuerySchema, 'query'),
  getQuestionAnswers
);

router.get('/profile/:userId',
  optionalAuth,
  validate(profileUserParamSchema, 'params'),
  validate(profileUserQuerySchema, 'query'),
  getProfileUser
);

export default router;
