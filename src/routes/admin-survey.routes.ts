/**
 * Admin Survey Routes（掛載於 /api/v1/admin）
 *
 * GET    /api/v1/admin/surveys                       — 所有問卷列表
 * GET    /api/v1/admin/surveys/:id                   — 問卷詳情
 * PATCH  /api/v1/admin/surveys/:id/status            — 更新狀態
 * DELETE /api/v1/admin/surveys/:id                   — 刪除問卷
 * GET    /api/v1/admin/surveys/:id/responses         — 回應列表
 * DELETE /api/v1/admin/surveys/:id/responses/:responseId — 刪除回應
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { adminSurveyController } from '../controllers/admin-survey.controller';
import { authenticateAny } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';

const router = Router();

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/surveys',
  tags: ['Admin Survey'],
  summary: '所有問卷列表（Admin）',
  responses: {
    200: { description: '問卷列表' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/surveys/{id}',
  tags: ['Admin Survey'],
  summary: '取得任意問卷詳情（Admin）',
  responses: {
    200: { description: '問卷詳情' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/surveys/{id}/status',
  tags: ['Admin Survey'],
  summary: '更新問卷狀態（Admin）',
  responses: {
    200: { description: '更新成功' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/surveys/{id}',
  tags: ['Admin Survey'],
  summary: '刪除問卷（Admin）',
  responses: {
    204: { description: '已刪除' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/surveys/{id}/responses',
  tags: ['Admin Survey'],
  summary: '取得問卷回應列表（Admin）',
  responses: {
    200: { description: '回應列表' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/surveys/{id}/responses/{responseId}',
  tags: ['Admin Survey'],
  summary: '刪除問卷回應（Admin）',
  responses: {
    204: { description: '已刪除' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/surveys',
  tags: ['Admin Survey'],
  summary: '建立問卷（Admin）',
  responses: {
    201: { description: '建立成功' },
    400: { $ref: '#/components/responses/BadRequestError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/admin/surveys/{id}',
  tags: ['Admin Survey'],
  summary: '更新問卷（Admin）',
  responses: {
    200: { description: '更新成功' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/surveys/{id}/responses/{responseId}',
  tags: ['Admin Survey'],
  summary: '取得回應詳情（Admin）',
  responses: {
    200: { description: '回應詳情' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

router.use(authenticateAny as RequestHandler, requireAdmin as RequestHandler);

router.get('/surveys', adminSurveyController.listAll as RequestHandler);
router.get('/surveys/:id', adminSurveyController.getById as RequestHandler);
router.patch('/surveys/:id/status', adminSurveyController.updateStatus as RequestHandler);
router.delete('/surveys/:id', adminSurveyController.deleteSurvey as RequestHandler);
router.get('/surveys/:id/responses', adminSurveyController.listResponses as RequestHandler);
router.delete('/surveys/:id/responses/:responseId', adminSurveyController.deleteResponse as RequestHandler);
router.post('/surveys', adminSurveyController.createSurvey as RequestHandler);
router.put('/surveys/:id', adminSurveyController.updateSurvey as RequestHandler);
router.get('/surveys/:id/responses/:responseId', adminSurveyController.getResponseDetail as RequestHandler);

export default router;
