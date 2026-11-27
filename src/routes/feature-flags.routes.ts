import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { getPublicFlags, getAdminFlags, postAdminFlag, patchAdminFlag } from '../controllers/feature-flags.controller';
import { authenticateAny, optionalAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';
import { validate } from '../middleware/validation.middleware';
import { apiSuccessResponseSchema } from '../validators/api-response.validators';
import { adminFeatureFlagSchema, createFeatureFlagSchema, featureFlagParamsSchema, updateFeatureFlagSchema, publicFeatureFlagsSchema, publicFeatureFlagsQuerySchema } from '../validators/feature-flags.validator';

export const publicFeatureFlagsRouter = Router();
export const adminFeatureFlagsRouter = Router();
// Apply identity-safe response policy before auth, validation and error branches.
publicFeatureFlagsRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  res.vary('Cookie');
  res.vary('Authorization');
  next();
});
publicFeatureFlagsRouter.get('/', optionalAuth, validate(publicFeatureFlagsQuerySchema, 'query'), getPublicFlags);
adminFeatureFlagsRouter.use(authenticateAny, requireAdmin);
adminFeatureFlagsRouter.get('/', getAdminFlags);
adminFeatureFlagsRouter.post('/', validate(createFeatureFlagSchema), postAdminFlag);
adminFeatureFlagsRouter.patch('/:key', validate(featureFlagParamsSchema, 'params'), validate(updateFeatureFlagSchema), patchAdminFlag);

const errors = { 401: { $ref: '#/components/responses/UnauthorizedError' }, 403: { $ref: '#/components/responses/ForbiddenError' } };
registry.registerPath({
  method: 'get', path: '/api/v1/feature-flags', tags: ['Feature flags'],
  summary: '讀取目前身分與組織可用功能，不公開發布名單', security: [{}, { bearerAuth: [] }],
  request: { query: publicFeatureFlagsQuerySchema },
  responses: { 200: { description: '所有已註冊功能的生效布林值', headers: { 'Cache-Control': { schema: { type: 'string', enum: ['private, no-store'] } }, Vary: { schema: { type: 'string', example: 'Cookie, Authorization' } } }, content: { 'application/json': { schema: apiSuccessResponseSchema(publicFeatureFlagsSchema) } } }, 400: { description: '目前組織ID無效' } }
});
registry.registerPath({
  method: 'get', path: '/api/v1/admin/feature-flags', tags: ['Admin Feature flags'],
  summary: '讀取功能發布管理列表', security: [{ bearerAuth: [] }],
  responses: { 200: { description: '功能列表', content: { 'application/json': { schema: apiSuccessResponseSchema(adminFeatureFlagSchema.array()) } } }, ...errors }
});
registry.registerPath({
  method: 'post', path: '/api/v1/admin/feature-flags', tags: ['Admin Feature flags'],
  summary: '註冊預設關閉的功能', security: [{ bearerAuth: [] }],
  request: { body: { required: true, content: { 'application/json': { schema: createFeatureFlagSchema } } } },
  responses: { 201: { description: '已註冊', content: { 'application/json': { schema: apiSuccessResponseSchema(adminFeatureFlagSchema) } } }, 400: { description: '功能格式無效' }, 409: { description: '功能key已存在' }, ...errors }
});
registry.registerPath({
  method: 'patch', path: '/api/v1/admin/feature-flags/{key}', tags: ['Admin Feature flags'],
  summary: '更新完整功能設定與Alpha名單並稽核', security: [{ bearerAuth: [] }],
  request: { params: featureFlagParamsSchema, body: { required: true, content: { 'application/json': { schema: updateFeatureFlagSchema } } } },
  responses: { 200: { description: '已更新', content: { 'application/json': { schema: apiSuccessResponseSchema(adminFeatureFlagSchema) } } }, 400: { description: '設定或組織無效' }, 404: { description: '功能未註冊' }, ...errors }
});
