/**
 * 資源路由
 * 處理資源相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import resourceController from '@/controllers/resourceController';
import { validate } from '@/validators/validation.middleware';
import { 
  createResourceSchema, 
  updateResourceSchema, 
  updateResourceStatusSchema 
} from '@/validators/resource.validator';
import { 
  paginationSchema, 
  resourceFilterSchema 
} from '@/validators/requestParams.validator';

const router = Router();

/**
 * GET /resources
 * 獲取資源列表
 * 查詢參數：cursor, limit, type, cost, level, majorCategoryId, subCategoryId, tags, query, sortField, sortDirection
 */
router.get('/', 
  validate(paginationSchema, 'query'),
  validate(resourceFilterSchema, 'query'),
  resourceController.getResources);

/**
 * GET /resources/:id
 * 獲取資源詳情
 * 路徑參數：id - 資源 ID
 */
router.get('/:id', resourceController.getResourceById as RequestHandler);

/**
 * POST /resources
 * 創建新資源
 * 請求體：CreateResourceDto (包含可選的嵌套評論)
 * 需要身份驗證
 */
router.post('/', 
  // TODO: 添加身份驗證中間件
  // authenticate,
  validate(createResourceSchema, 'body'),
  resourceController.createResource as RequestHandler
);

/**
 * PATCH /resources/:id
 * 更新資源
 * 路徑參數：id - 資源 ID
 * 請求體：UpdateResourceDto
 * 需要身份驗證和權限檢查
 */
router.patch('/:id',
  // TODO: 添加身份驗證中間件
  // authenticate,
  validate(updateResourceSchema, 'body'),
  resourceController.updateResource as RequestHandler
);

/**
 * PATCH /resources/:id/status
 * 更新資源狀態
 * 路徑參數：id - 資源 ID
 * 請求體：{ status: string }
 * 需要身份驗證和權限檢查
 */
router.patch('/:id/status',
  // TODO: 添加身份驗證中間件
  // authenticate,
  validate(updateResourceStatusSchema, 'body'),
  resourceController.updateResourceStatus as RequestHandler
);

/**
 * DELETE /resources/:id
 * 刪除資源（軟刪除）
 * 路徑參數：id - 資源 ID
 * 需要身份驗證和權限檢查
 */
router.delete('/:id',
  // TODO: 添加身份驗證中間件
  // authenticate,
  resourceController.deleteResource as RequestHandler
);

/**
 * GET /resources/:id/tags
 * 獲取資源標籤
 * 路徑參數：id - 資源 ID
 */
router.get('/:id/tags', resourceController.getResourceTags as RequestHandler);

export default router;