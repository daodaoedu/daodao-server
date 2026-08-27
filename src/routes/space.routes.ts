import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { authenticate } from '../middleware/auth';
import { requireOnboardingComplete } from '../middleware/onboarding-gate.middleware';
import { validate } from '../middleware/validation.middleware';
import * as controller from '../controllers/space.controller';
import {
  blockResponseSchema,
  createBlockSchema,
  createHomePageSchema,
  homePageResponseSchema,
  moveBlockSchema,
  publishBlockSchema,
  spaceBlockParamSchema,
  spaceDetailResponseSchema,
  spaceIdParamSchema,
  spaceListResponseSchema,
  spaceMembersResponseSchema,
  spacePracticesResponseSchema,
  spacePublicTokenParamSchema,
  updateBlockSchema,
} from '../validators/space.validators';

const router = Router();
const errors = {
  400: { $ref: '#/components/responses/BadRequestError' },
  401: { $ref: '#/components/responses/UnauthorizedError' },
  403: { $ref: '#/components/responses/ForbiddenError' },
  404: { $ref: '#/components/responses/NotFoundError' },
  500: { $ref: '#/components/responses/InternalServerError' },
} as const;

registry.registerPath({
  method: 'get', path: '/api/v1/spaces', tags: ['Spaces'], summary: '你的空間清單（個人實踐/共同挑戰/活動課程聚合）',
  responses: { 200: { description: '空間清單', content: { 'application/json': { schema: spaceListResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'get', path: '/api/v1/spaces/public/{token}', tags: ['Spaces'], summary: '公開連結的訪客視角空間頁',
  request: { params: spacePublicTokenParamSchema },
  responses: { 200: { description: '空間公開內容（成員視角過濾）' }, ...errors },
});
registry.registerPath({
  method: 'get', path: '/api/v1/spaces/{id}', tags: ['Spaces'], summary: '活動課程空間標頭資訊',
  request: { params: spaceIdParamSchema },
  responses: { 200: { description: '空間標頭', content: { 'application/json': { schema: spaceDetailResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'get', path: '/api/v1/spaces/{id}/members', tags: ['Spaces'], summary: '空間成員名單',
  request: { params: spaceIdParamSchema },
  responses: { 200: { description: '成員名單', content: { 'application/json': { schema: spaceMembersResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'get', path: '/api/v1/spaces/{id}/practices', tags: ['Spaces'], summary: '空間內主題實踐清單',
  request: { params: spaceIdParamSchema },
  responses: { 200: { description: '實踐卡片清單', content: { 'application/json': { schema: spacePracticesResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'get', path: '/api/v1/spaces/{id}/home-page', tags: ['Spaces'], summary: '空間首頁（依檢視者過濾區塊）',
  request: { params: spaceIdParamSchema },
  responses: { 200: { description: '空間首頁；不存在或對檢視者隱藏時回 null', content: { 'application/json': { schema: homePageResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'post', path: '/api/v1/spaces/{id}/home-page', tags: ['Spaces'], summary: '建立空間首頁（範例/空白，發起人限定）',
  request: { params: spaceIdParamSchema, body: { content: { 'application/json': { schema: createHomePageSchema } } } },
  responses: { 201: { description: '首頁已建立（草稿）', content: { 'application/json': { schema: homePageResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'post', path: '/api/v1/spaces/{id}/home-page/publish', tags: ['Spaces'], summary: '發佈空間首頁（發起人限定）',
  request: { params: spaceIdParamSchema },
  responses: { 200: { description: '頁面已發佈', content: { 'application/json': { schema: homePageResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'post', path: '/api/v1/spaces/{id}/blocks', tags: ['Spaces'], summary: '新增區塊（發起人限定）',
  request: { params: spaceIdParamSchema, body: { content: { 'application/json': { schema: createBlockSchema } } } },
  responses: { 201: { description: '區塊已建立（草稿、附加於最後）', content: { 'application/json': { schema: blockResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'patch', path: '/api/v1/spaces/{id}/blocks/{blockId}', tags: ['Spaces'], summary: '更新區塊內容（blur 儲存，發起人限定）',
  request: { params: spaceBlockParamSchema, body: { content: { 'application/json': { schema: updateBlockSchema } } } },
  responses: { 200: { description: '區塊已更新', content: { 'application/json': { schema: blockResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'post', path: '/api/v1/spaces/{id}/blocks/{blockId}/move', tags: ['Spaces'], summary: '上移/下移區塊（發起人限定）',
  request: { params: spaceBlockParamSchema, body: { content: { 'application/json': { schema: moveBlockSchema } } } },
  responses: { 200: { description: '區塊已移動', content: { 'application/json': { schema: blockResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'post', path: '/api/v1/spaces/{id}/blocks/{blockId}/publish', tags: ['Spaces'], summary: '發佈或排程區塊（發起人限定）',
  request: { params: spaceBlockParamSchema, body: { content: { 'application/json': { schema: publishBlockSchema } } } },
  responses: { 200: { description: '區塊已發佈或排程', content: { 'application/json': { schema: blockResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'post', path: '/api/v1/spaces/{id}/blocks/{blockId}/draft', tags: ['Spaces'], summary: '將區塊存成草稿（已發佈不可退回，發起人限定）',
  request: { params: spaceBlockParamSchema },
  responses: { 200: { description: '區塊已存成草稿', content: { 'application/json': { schema: blockResponseSchema } } }, ...errors },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: 'delete', path: '/api/v1/spaces/{id}/blocks/{blockId}', tags: ['Spaces'], summary: '刪除區塊（發起人限定）',
  request: { params: spaceBlockParamSchema },
  responses: { 200: { description: '區塊已刪除' }, ...errors },
  security: [{ bearerAuth: [] }],
});

// The public guest view is intentionally unauthenticated and must be
// registered before the auth gate and the '/:id' matcher.
router.get('/public/:token', validate(spacePublicTokenParamSchema, 'params'), controller.getPublicSpace);

router.use(authenticate, requireOnboardingComplete);
router.get('/', controller.listMySpaces);
router.get('/:id', validate(spaceIdParamSchema, 'params'), controller.getSpaceDetail);
router.get('/:id/members', validate(spaceIdParamSchema, 'params'), controller.listMembers);
router.get('/:id/practices', validate(spaceIdParamSchema, 'params'), controller.listSpacePractices);
router.get('/:id/home-page', validate(spaceIdParamSchema, 'params'), controller.getHomePage);
router.post('/:id/home-page', validate(spaceIdParamSchema, 'params'), validate(createHomePageSchema), controller.createHomePage);
router.post('/:id/home-page/publish', validate(spaceIdParamSchema, 'params'), controller.publishHomePage);
router.post('/:id/blocks', validate(spaceIdParamSchema, 'params'), validate(createBlockSchema), controller.createBlock);
router.patch('/:id/blocks/:blockId', validate(spaceBlockParamSchema, 'params'), validate(updateBlockSchema), controller.updateBlock);
router.post('/:id/blocks/:blockId/move', validate(spaceBlockParamSchema, 'params'), validate(moveBlockSchema), controller.moveBlock);
router.post('/:id/blocks/:blockId/publish', validate(spaceBlockParamSchema, 'params'), validate(publishBlockSchema), controller.publishBlock);
router.post('/:id/blocks/:blockId/draft', validate(spaceBlockParamSchema, 'params'), controller.draftBlock);
router.delete('/:id/blocks/:blockId', validate(spaceBlockParamSchema, 'params'), controller.deleteBlock);

export default router;
