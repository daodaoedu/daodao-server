/**
 * 共同挑戰管理路由（admin）
 *
 * 主題／期／模板／參與者（openspec: challenge-authoring）。掛載於 /api/v1/admin/challenges。
 * 卡組指派走 /api/v1/admin/inspiration-decks/{deckId}/assign。
 */

import { Router, type RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { registry } from '../config/openapi-registry';
import { adminChallengeController } from '../controllers/admin-challenge.controller';
import { authenticateAny } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';
import { validate } from '../middleware/validation.middleware';
import { apiSuccessResponseSchema } from '../validators/api-response.validators';
import {
  adminCohortListResponseSchema,
  adminCohortParamsSchema,
  adminCohortResponseSchema,
  adminCreateCohortSchema,
  adminCreateProgramSchema,
  adminCreateTemplateSchema,
  adminParticipantListResponseSchema,
  adminProgramListQuerySchema,
  adminProgramListResponseSchema,
  adminProgramParamsSchema,
  adminProgramResponseSchema,
  adminSetCohortStatusSchema,
  adminTemplateListQuerySchema,
  adminTemplateListResponseSchema,
  adminTemplateParamsSchema,
  adminTemplateResponseSchema,
  adminUpdateCohortSchema,
  adminUpdateProgramSchema,
  adminUpdateTemplateSchema
} from '../validators/admin-challenge.validator';

const router = Router();
router.use(authenticateAny as RequestHandler, requireAdmin as RequestHandler);

const TAG = ['Admin Challenge'];
const auth = [{ bearerAuth: [] }];
const errors = { 401: { $ref: '#/components/responses/UnauthorizedError' }, 403: { $ref: '#/components/responses/ForbiddenError' } } as const;
const json = (schema: Parameters<typeof apiSuccessResponseSchema>[0]) => ({ 'application/json': { schema: apiSuccessResponseSchema(schema) } });
const body = (schema: ZodTypeAny) => ({ content: { 'application/json': { schema } } });

const P = '/api/v1/admin/challenges';
registry.registerPath({ method: 'get', path: `${P}/programs`, tags: TAG, summary: '挑戰主題列表', security: auth, request: { query: adminProgramListQuerySchema }, responses: { 200: { description: '主題列表', content: json(adminProgramListResponseSchema) }, ...errors } });
registry.registerPath({ method: 'post', path: `${P}/programs`, tags: TAG, summary: '建立挑戰主題', security: auth, request: { body: body(adminCreateProgramSchema) }, responses: { 201: { description: '已建立', content: json(adminProgramResponseSchema) }, ...errors } });
registry.registerPath({ method: 'patch', path: `${P}/programs/{programId}`, tags: TAG, summary: '更新挑戰主題', security: auth, request: { params: adminProgramParamsSchema, body: body(adminUpdateProgramSchema) }, responses: { 200: { description: '已更新', content: json(adminProgramResponseSchema) }, ...errors } });
registry.registerPath({ method: 'delete', path: `${P}/programs/{programId}`, tags: TAG, summary: '封存挑戰主題（底下需無未封存的挑戰）', security: auth, request: { params: adminProgramParamsSchema }, responses: { 204: { description: '已封存' }, 409: { $ref: '#/components/responses/ConflictError' }, ...errors } });
registry.registerPath({ method: 'post', path: `${P}/programs/{programId}/duplicate`, tags: TAG, summary: '複製挑戰主題', security: auth, request: { params: adminProgramParamsSchema }, responses: { 201: { description: '已複製', content: json(adminProgramResponseSchema) }, ...errors } });

registry.registerPath({ method: 'get', path: `${P}/programs/{programId}/cohorts`, tags: TAG, summary: '主題底下的挑戰（期）列表', security: auth, request: { params: adminProgramParamsSchema }, responses: { 200: { description: '挑戰列表', content: json(adminCohortListResponseSchema) }, ...errors } });
registry.registerPath({ method: 'post', path: `${P}/programs/{programId}/cohorts`, tags: TAG, summary: '建立挑戰（草稿；可同時指定模板與開始日）', security: auth, request: { params: adminProgramParamsSchema, body: body(adminCreateCohortSchema) }, responses: { 201: { description: '已建立', content: json(adminCohortResponseSchema) }, ...errors } });
registry.registerPath({ method: 'patch', path: `${P}/programs/{programId}/cohorts/{cohortId}`, tags: TAG, summary: '更新挑戰（已有人加入後期間與模板鎖定）', security: auth, request: { params: adminCohortParamsSchema, body: body(adminUpdateCohortSchema) }, responses: { 200: { description: '已更新', content: json(adminCohortResponseSchema) }, 409: { $ref: '#/components/responses/ConflictError' }, ...errors } });
registry.registerPath({ method: 'post', path: `${P}/programs/{programId}/cohorts/{cohortId}/status`, tags: TAG, summary: '發佈／下架挑戰（發佈前需綁定模板）', security: auth, request: { params: adminCohortParamsSchema, body: body(adminSetCohortStatusSchema) }, responses: { 200: { description: '已更新', content: json(adminCohortResponseSchema) }, 409: { $ref: '#/components/responses/ConflictError' }, ...errors } });
registry.registerPath({ method: 'delete', path: `${P}/programs/{programId}/cohorts/{cohortId}`, tags: TAG, summary: '封存挑戰', security: auth, request: { params: adminCohortParamsSchema }, responses: { 204: { description: '已封存' }, ...errors } });
registry.registerPath({ method: 'post', path: `${P}/programs/{programId}/cohorts/{cohortId}/duplicate`, tags: TAG, summary: '複製挑戰為草稿', security: auth, request: { params: adminCohortParamsSchema }, responses: { 201: { description: '已複製', content: json(adminCohortResponseSchema) }, ...errors } });
registry.registerPath({ method: 'get', path: `${P}/programs/{programId}/cohorts/{cohortId}/participants`, tags: TAG, summary: '參與者列表（依加入時間排序）', security: auth, request: { params: adminCohortParamsSchema }, responses: { 200: { description: '參與者', content: json(adminParticipantListResponseSchema) }, ...errors } });

registry.registerPath({ method: 'get', path: `${P}/templates`, tags: TAG, summary: '組織模板列表', security: auth, request: { query: adminTemplateListQuerySchema }, responses: { 200: { description: '模板列表', content: json(adminTemplateListResponseSchema) }, ...errors } });
registry.registerPath({ method: 'post', path: `${P}/templates`, tags: TAG, summary: '建立組織模板', security: auth, request: { body: body(adminCreateTemplateSchema) }, responses: { 201: { description: '已建立', content: json(adminTemplateResponseSchema) }, ...errors } });
registry.registerPath({ method: 'patch', path: `${P}/templates/{templateId}`, tags: TAG, summary: '更新組織模板', security: auth, request: { params: adminTemplateParamsSchema, body: body(adminUpdateTemplateSchema) }, responses: { 200: { description: '已更新', content: json(adminTemplateResponseSchema) }, ...errors } });
registry.registerPath({ method: 'delete', path: `${P}/templates/{templateId}`, tags: TAG, summary: '刪除未綁定過的模板', security: auth, request: { params: adminTemplateParamsSchema }, responses: { 204: { description: '已刪除' }, 409: { $ref: '#/components/responses/ConflictError' }, ...errors } });

router.get('/programs', validate(adminProgramListQuerySchema, 'query'), adminChallengeController.listPrograms as RequestHandler);
router.post('/programs', validate(adminCreateProgramSchema), adminChallengeController.createProgram as RequestHandler);
router.patch('/programs/:programId', validate(adminProgramParamsSchema, 'params'), validate(adminUpdateProgramSchema), adminChallengeController.updateProgram as RequestHandler);
router.delete('/programs/:programId', validate(adminProgramParamsSchema, 'params'), adminChallengeController.archiveProgram as RequestHandler);
router.post('/programs/:programId/duplicate', validate(adminProgramParamsSchema, 'params'), adminChallengeController.duplicateProgram as RequestHandler);

router.get('/programs/:programId/cohorts', validate(adminProgramParamsSchema, 'params'), adminChallengeController.listCohorts as RequestHandler);
router.post('/programs/:programId/cohorts', validate(adminProgramParamsSchema, 'params'), validate(adminCreateCohortSchema), adminChallengeController.createCohort as RequestHandler);
router.patch('/programs/:programId/cohorts/:cohortId', validate(adminCohortParamsSchema, 'params'), validate(adminUpdateCohortSchema), adminChallengeController.updateCohort as RequestHandler);
router.post('/programs/:programId/cohorts/:cohortId/status', validate(adminCohortParamsSchema, 'params'), validate(adminSetCohortStatusSchema), adminChallengeController.setCohortStatus as RequestHandler);
router.delete('/programs/:programId/cohorts/:cohortId', validate(adminCohortParamsSchema, 'params'), adminChallengeController.archiveCohort as RequestHandler);
router.post('/programs/:programId/cohorts/:cohortId/duplicate', validate(adminCohortParamsSchema, 'params'), adminChallengeController.duplicateCohort as RequestHandler);
router.get('/programs/:programId/cohorts/:cohortId/participants', validate(adminCohortParamsSchema, 'params'), adminChallengeController.listParticipants as RequestHandler);

router.get('/templates', validate(adminTemplateListQuerySchema, 'query'), adminChallengeController.listTemplates as RequestHandler);
router.post('/templates', validate(adminCreateTemplateSchema), adminChallengeController.createTemplate as RequestHandler);
router.patch('/templates/:templateId', validate(adminTemplateParamsSchema, 'params'), validate(adminUpdateTemplateSchema), adminChallengeController.updateTemplate as RequestHandler);
router.delete('/templates/:templateId', validate(adminTemplateParamsSchema, 'params'), adminChallengeController.deleteTemplate as RequestHandler);

export default router;
