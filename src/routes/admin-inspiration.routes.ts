/**
 * 靈感卡管理路由（admin）
 *
 * 卡組 CRUD／複製、卡片管理、Excel 匯入、指派給共同挑戰（openspec: challenge-inspiration-deck）。
 * 掛載於 /api/v1/admin/inspiration-decks。
 */

import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { registry } from '../config/openapi-registry';
import { inspirationDeckController } from '../controllers/inspiration-deck.controller';
import { authenticateAny } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';
import { validate } from '../middleware/validation.middleware';
import { apiSuccessResponseSchema } from '../validators/api-response.validators';
import {
  assignDeckSchema,
  assignResultResponseSchema,
  cardBodySchema,
  createDeckSchema,
  deckCardParamsSchema,
  deckDetailResponseSchema,
  deckListResponseSchema,
  deckParamsSchema,
  importCardsResponseSchema,
  updateDeckSchema
} from '../validators/inspiration-deck.validator';

/** xlsx 專用上傳（記憶體、2MB 上限） */
const uploadXlsx = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('僅支援 .xlsx 檔案'));
  }
});

const router = Router();
router.use(authenticateAny as RequestHandler, requireAdmin as RequestHandler);

registry.registerPath({ method: 'get', path: '/api/v1/admin/inspiration-decks', tags: ['Admin Inspiration'], summary: '卡組列表', security: [{ bearerAuth: [] }], responses: { 200: { description: '卡組列表', content: { 'application/json': { schema: apiSuccessResponseSchema(deckListResponseSchema) } } } } });
registry.registerPath({ method: 'post', path: '/api/v1/admin/inspiration-decks', tags: ['Admin Inspiration'], summary: '建立卡組（可含初始卡片）', security: [{ bearerAuth: [] }], request: { body: { content: { 'application/json': { schema: createDeckSchema } } } }, responses: { 201: { description: '已建立', content: { 'application/json': { schema: apiSuccessResponseSchema(deckDetailResponseSchema) } } } } });
registry.registerPath({ method: 'get', path: '/api/v1/admin/inspiration-decks/{deckId}', tags: ['Admin Inspiration'], summary: '卡組詳情（含卡片）', security: [{ bearerAuth: [] }], request: { params: deckParamsSchema }, responses: { 200: { description: '卡組詳情', content: { 'application/json': { schema: apiSuccessResponseSchema(deckDetailResponseSchema) } } }, 404: { $ref: '#/components/responses/NotFoundError' } } });
registry.registerPath({ method: 'put', path: '/api/v1/admin/inspiration-decks/{deckId}', tags: ['Admin Inspiration'], summary: '更新卡組名稱', security: [{ bearerAuth: [] }], request: { params: deckParamsSchema, body: { content: { 'application/json': { schema: updateDeckSchema } } } }, responses: { 200: { description: '已更新', content: { 'application/json': { schema: apiSuccessResponseSchema(deckDetailResponseSchema) } } } } });
registry.registerPath({ method: 'delete', path: '/api/v1/admin/inspiration-decks/{deckId}', tags: ['Admin Inspiration'], summary: '刪除卡組（軟刪除）', security: [{ bearerAuth: [] }], request: { params: deckParamsSchema }, responses: { 200: { description: '已刪除' } } });
registry.registerPath({ method: 'post', path: '/api/v1/admin/inspiration-decks/{deckId}/duplicate', tags: ['Admin Inspiration'], summary: '複製卡組', security: [{ bearerAuth: [] }], request: { params: deckParamsSchema }, responses: { 201: { description: '已複製', content: { 'application/json': { schema: apiSuccessResponseSchema(deckDetailResponseSchema) } } } } });
registry.registerPath({ method: 'post', path: '/api/v1/admin/inspiration-decks/{deckId}/cards', tags: ['Admin Inspiration'], summary: '新增卡片', security: [{ bearerAuth: [] }], request: { params: deckParamsSchema, body: { content: { 'application/json': { schema: cardBodySchema } } } }, responses: { 201: { description: '已新增' } } });
registry.registerPath({ method: 'put', path: '/api/v1/admin/inspiration-decks/{deckId}/cards/{cardId}', tags: ['Admin Inspiration'], summary: '更新卡片內容', security: [{ bearerAuth: [] }], request: { params: deckCardParamsSchema, body: { content: { 'application/json': { schema: cardBodySchema } } } }, responses: { 200: { description: '已更新' } } });
registry.registerPath({ method: 'delete', path: '/api/v1/admin/inspiration-decks/{deckId}/cards/{cardId}', tags: ['Admin Inspiration'], summary: '刪除卡片（軟刪除）', security: [{ bearerAuth: [] }], request: { params: deckCardParamsSchema }, responses: { 200: { description: '已刪除' } } });
registry.registerPath({ method: 'post', path: '/api/v1/admin/inspiration-decks/{deckId}/import', tags: ['Admin Inspiration'], summary: 'Excel 匯入卡片（.xlsx，取第一工作表第一欄）', security: [{ bearerAuth: [] }], request: { params: deckParamsSchema }, responses: { 200: { description: '匯入結果', content: { 'application/json': { schema: apiSuccessResponseSchema(importCardsResponseSchema) } } } } });
registry.registerPath({ method: 'post', path: '/api/v1/admin/inspiration-decks/{deckId}/assign', tags: ['Admin Inspiration'], summary: '指派卡組給共同挑戰', security: [{ bearerAuth: [] }], request: { params: deckParamsSchema, body: { content: { 'application/json': { schema: assignDeckSchema } } } }, responses: { 200: { description: '已指派', content: { 'application/json': { schema: apiSuccessResponseSchema(assignResultResponseSchema) } } } } });
registry.registerPath({ method: 'post', path: '/api/v1/admin/inspiration-decks/{deckId}/unassign', tags: ['Admin Inspiration'], summary: '解除卡組指派', security: [{ bearerAuth: [] }], request: { params: deckParamsSchema, body: { content: { 'application/json': { schema: assignDeckSchema } } } }, responses: { 200: { description: '已解除' } } });

router.get('/', inspirationDeckController.listDecks as RequestHandler);
router.post('/', validate(createDeckSchema), inspirationDeckController.createDeck as RequestHandler);
router.get('/:deckId', validate(deckParamsSchema, 'params'), inspirationDeckController.getDeck as RequestHandler);
router.put('/:deckId', validate(deckParamsSchema, 'params'), validate(updateDeckSchema), inspirationDeckController.updateDeck as RequestHandler);
router.delete('/:deckId', validate(deckParamsSchema, 'params'), inspirationDeckController.deleteDeck as RequestHandler);
router.post('/:deckId/duplicate', validate(deckParamsSchema, 'params'), inspirationDeckController.duplicateDeck as RequestHandler);
router.post('/:deckId/cards', validate(deckParamsSchema, 'params'), validate(cardBodySchema), inspirationDeckController.addCard as RequestHandler);
router.put('/:deckId/cards/:cardId', validate(deckCardParamsSchema, 'params'), validate(cardBodySchema), inspirationDeckController.updateCard as RequestHandler);
router.delete('/:deckId/cards/:cardId', validate(deckCardParamsSchema, 'params'), inspirationDeckController.deleteCard as RequestHandler);
router.post('/:deckId/import', validate(deckParamsSchema, 'params'), uploadXlsx.single('file'), inspirationDeckController.importCards as RequestHandler);
router.post('/:deckId/assign', validate(deckParamsSchema, 'params'), validate(assignDeckSchema), inspirationDeckController.assignDeck as RequestHandler);
router.post('/:deckId/unassign', validate(deckParamsSchema, 'params'), validate(assignDeckSchema), inspirationDeckController.unassignDeck as RequestHandler);

export default router;
