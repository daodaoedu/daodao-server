import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticate } from '../middleware/auth';
import { requireOnboardingComplete } from '../middleware/onboarding-gate.middleware';
import { validate } from '../middleware/validation.middleware';
import * as controller from '../controllers/future-letter.controller';
import {
  createFutureLetterSchema,
  futureLetterApiResponseSchema,
  futureLetterIdParamSchema,
  futureLetterListApiResponseSchema,
  futureLetterListQuerySchema,
  sendFutureLetterSchema,
  updateFutureLetterSchema,
} from '../validators/future-letter.validators';

const router = Router();
const errors = {
  400: { $ref: '#/components/responses/BadRequestError' },
  401: { $ref: '#/components/responses/UnauthorizedError' },
  404: { $ref: '#/components/responses/NotFoundError' },
  500: { $ref: '#/components/responses/InternalServerError' },
} as const;

registry.registerPath({
  method: 'post', path: '/api/v1/me/future-letters', tags: ['Future Letters'], summary: '建立未來信草稿',
  request: { body: { content: { 'application/json': { schema: createFutureLetterSchema } } } },
  responses: { 201: { description: '草稿已建立', content: { 'application/json': { schema: futureLetterApiResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'get', path: '/api/v1/me/future-letters', tags: ['Future Letters'], summary: '列出我的未來信',
  request: { query: futureLetterListQuerySchema },
  responses: { 200: { description: '信件列表', content: { 'application/json': { schema: futureLetterListApiResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'get', path: '/api/v1/me/future-letters/{id}', tags: ['Future Letters'], summary: '取得單封未來信',
  request: { params: futureLetterIdParamSchema },
  responses: { 200: { description: '信件內容', content: { 'application/json': { schema: futureLetterApiResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'patch', path: '/api/v1/me/future-letters/{id}', tags: ['Future Letters'], summary: '更新未來信草稿',
  request: { params: futureLetterIdParamSchema, body: { content: { 'application/json': { schema: updateFutureLetterSchema } } } },
  responses: { 200: { description: '草稿已更新', content: { 'application/json': { schema: futureLetterApiResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'delete', path: '/api/v1/me/future-letters/{id}', tags: ['Future Letters'], summary: '刪除未來信',
  request: { params: futureLetterIdParamSchema },
  responses: { 200: { description: '信件已刪除' }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'post', path: '/api/v1/me/future-letters/{id}/send', tags: ['Future Letters'], summary: '寄出並排程未來信',
  request: { params: futureLetterIdParamSchema, body: { content: { 'application/json': { schema: sendFutureLetterSchema } } } },
  responses: { 200: { description: '信件已排程', content: { 'application/json': { schema: futureLetterApiResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'post', path: '/api/v1/me/future-letters/{id}/open', tags: ['Future Letters'], summary: '開啟已送達的未來信',
  request: { params: futureLetterIdParamSchema },
  responses: { 200: { description: '信件已開啟並回傳 owner-only 內容', content: { 'application/json': { schema: futureLetterApiResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});

router.use(authenticate, requireOnboardingComplete);
router.post('/', validate(createFutureLetterSchema), controller.createLetter);
router.get('/', validate(futureLetterListQuerySchema, 'query'), controller.getLetters);
router.get('/:id', validate(futureLetterIdParamSchema, 'params'), controller.getLetter);
router.patch('/:id', validate(futureLetterIdParamSchema, 'params'), validate(updateFutureLetterSchema), controller.updateLetter);
router.delete('/:id', validate(futureLetterIdParamSchema, 'params'), controller.deleteLetter);
router.post('/:id/send', validate(futureLetterIdParamSchema, 'params'), validate(sendFutureLetterSchema), controller.sendLetter);
router.post('/:id/open', validate(futureLetterIdParamSchema, 'params'), controller.openLetter);

export default router;
