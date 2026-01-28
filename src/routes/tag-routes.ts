/**
 * 標籤路由
 * 處理標籤相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import tagController from '@/controllers/tag-controller';
import { validate } from '@/validators/validation.middleware';
import { 
  tagQuerySchema, 
  tagEntitySchema 
} from '@/validators/request-params.validator';

const router = Router();

/**
 * GET /tags/popular
 * 獲取熱門標籤
 * 查詢參數：entityType, limit
 */
router.get('/popular', 
  validate(tagQuerySchema, 'query'),
  tagController.getPopularTags);

/**
 * GET /tags/search
 * 搜索標籤
 * 查詢參數：query, limit
 */
router.get('/search', 
  validate(tagQuerySchema, 'query'),
  tagController.searchTags as RequestHandler
);

/**
 * GET /tags/stats
 * 獲取標籤統計
 * 查詢參數：entityType
 */
router.get('/stats', 
  validate(tagQuerySchema, 'query'),
  tagController.getTagStats as RequestHandler
);

/**
 * POST /tags/entities
 * 為實體添加標籤
 * 請求體：{ entityId: number, entityType: string, tagName: string }
 * 需要身份驗證
 */
router.post('/entities', 
  // TODO: 添加身份驗證中間件
  // authenticate,
  validate(tagEntitySchema, 'body'),
  tagController.addEntityTag as RequestHandler
);

/**
 * DELETE /tags/entities
 * 移除實體標籤
 * 請求體：{ entityId: number, entityType: string, tagName: string }
 * 需要身份驗證和權限檢查
 */
router.delete('/entities', 
  // TODO: 添加身份驗證中間件
  // authenticate,
  validate(tagEntitySchema, 'body'),
  tagController.removeEntityTag as RequestHandler
);

/**
 * GET /tags/entities
 * 獲取實體標籤列表
 * 查詢參數：entityId, entityType
 */
router.get('/entities', 
  tagController.getEntityTags as RequestHandler
);

export default router;