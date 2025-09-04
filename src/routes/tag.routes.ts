/**
 * 標籤路由
 * 處理標籤相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import tagController from '@/controllers/tag.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticateAny } from '@/middleware/auth';
import {
  tagSearchQuerySchema,
  popularTagsQuerySchema,
  addEntityTagSchema,
  removeEntityTagSchema,
  entityTagsQuerySchema
} from '@/validators/tag.validators';

const router = Router();

/**
 * GET /tags/popular
 * 獲取熱門標籤
 * 查詢參數：limit
 */
router.get('/popular',
  validate(popularTagsQuerySchema, 'query'),
  tagController.getPopularTags);

/**
 * GET /tags/search
 * 搜索標籤
 * 查詢參數：query, limit
 */
router.get('/search',
  validate(tagSearchQuerySchema, 'query'),
  tagController.searchTags as RequestHandler
);

/**
 * GET /tags/stats
 * 獲取標籤統計
 */
router.get('/stats',
  tagController.getTagStats as RequestHandler
);

/**
 * POST /tags/entities
 * 為實體添加標籤
 * 請求體：{ entityId: number, entityType: string, tagName: string }
 * 需要身份驗證
 */
router.post('/entities',
  authenticateAny,
  validate(addEntityTagSchema, 'body'),
  tagController.addEntityTag as RequestHandler
);

/**
 * DELETE /tags/entities
 * 移除實體標籤
 * 請求體：{ entityId: number, entityType: string, tagName: string }
 * 需要身份驗證和權限檢查
 */
router.delete('/entities',
  authenticateAny,
  validate(removeEntityTagSchema, 'body'),
  tagController.removeEntityTag as RequestHandler
);

/**
 * GET /tags/entities
 * 獲取實體標籤列表
 * 查詢參數：entityId, entityType
 */
router.get('/entities',
  validate(entityTagsQuerySchema, 'query'),
  tagController.getEntityTags as RequestHandler
);

export default router;