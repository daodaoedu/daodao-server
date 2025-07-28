/**
 * 資源路由
 * 處理資源相關的路由定義
 */

import { Router } from 'express';
import * as resourceController from '@/controllers/resource.controller';
import { validate } from '@/validators/validation.middleware';
import { authenticate, optionalAuth, requireRole } from '@/middleware/auth';
import { 
  createResourceSchema, 
  updateResourceSchema, 
  updateResourceStatusSchema 
} from '@/validators/resource.validator';
import { 
  paginationSchema, 
  resourceFilterSchema 
} from '@/validators/request-params.validator';

const router = Router();

/**
 * GET /resources
 * 獲取資源列表
 * 查詢參數：cursor, limit, type, cost, level, majorCategory, subCategory, tags, query, sort, order
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/', 
  optionalAuth,
  validate(paginationSchema, 'query'),
  validate(resourceFilterSchema, 'query'),
  resourceController.default.getResources);

/**
 * GET /resources/:resourceId
 * 獲取資源詳情
 * 路徑參數：resourceId - 資源 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:resourceId', 
  optionalAuth,
  resourceController.default.getResourceById);

/**
 * POST /resources
 * 創建新資源
 * 請求體：CreateResourceDto (包含可選的嵌套評論)
 * 需要身份驗證
 */
router.post('/', 
  authenticate,
  validate(createResourceSchema, 'body'),
  resourceController.default.createResource
);

/**
 * PATCH /resources/:resourceId
 * 更新資源
 * 路徑參數：resourceId - 資源 ID
 * 請求體：UpdateResourceDto
 * 需要身份驗證和權限檢查（資源所有者或管理員）
 */
router.patch('/:resourceId',
  authenticate,
  validate(updateResourceSchema, 'body'),
  resourceController.default.updateResource
);

/**
 * PATCH /resources/:resourceId/status
 * 更新資源狀態
 * 路徑參數：resourceId - 資源 ID
 * 請求體：{ status: string }
 * 需要身份驗證和權限檢查（管理員或資源所有者）
 */
router.patch('/:resourceId/status',
  authenticate,
  requireRole(['admin']), // 只有管理員可以更改狀態
  validate(updateResourceStatusSchema, 'body'),
  resourceController.default.updateResourceStatus
);

/**
 * DELETE /resources/:resourceId
 * 刪除資源（軟刪除）
 * 路徑參數：resourceId - 資源 ID
 * 需要身份驗證和權限檢查（資源所有者或管理員）
 */
router.delete('/:resourceId',
  authenticate,
  resourceController.default.deleteResource
);

/**
 * GET /resources/:resourceId/tags
 * 獲取資源標籤
 * 路徑參數：resourceId - 資源 ID
 */
router.get('/:resourceId/tags', resourceController.default.getResourceTags);

export default router;