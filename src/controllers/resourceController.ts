/**
 * 資源控制器
 * 處理資源相關的 HTTP 請求
 */

/// <reference path="../types/declarations/express.d.ts" />
import { Request, Response, NextFunction } from 'express';

/**
 * 獲取用戶 ID，開發環境下提供測試用戶
 */
const getUserIdOrTestUser = (req: Request): number => {
  const userId = req.user?.id;
  
  if (!userId) {
    // 為 Swagger UI 測試提供預設用戶 ID（僅在開發環境）
    if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === undefined) {
      console.log('⚠️  Using test user ID for development/testing');
      const testUserId = 1;
      req.user = { 
        id: testUserId,
        username: 'test_user_for_swagger',
        roles: ['user']
      };
      return testUserId;
    } else {
      throw new BadRequestError('必須登入才能執行此操作');
    }
  }
  
  return userId;
};
import { asyncWrapper, BadRequestError } from '@/utils/errorHandler';
import resourceService from '@/services/resourceService';
import tagService from '@/services/tagService';
import { TagAttributes } from '@/models/tag';
import { 
  validateCreateResource, 
  validateUpdateResource, 
  validateUpdateResourceStatus 
} from '@/validators/resource.validator';

/**
 * 獲取資源列表
 * GET /resources
 */
export const getResources = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const { 
    cursor, 
    limit, 
    type, 
    cost, 
    level, 
    majorCategoryId, 
    subCategoryId, 
    tags, 
    query,
    sortField,
    sortDirection
  } = req.query;

  // 處理過濾條件
  const filters: any = {};
  if (type) filters.type = type as string;
  if (cost) filters.cost = cost as string;
  if (level) filters.level = level as string;
  if (majorCategoryId) filters.majorCategoryId = parseInt(majorCategoryId as string, 10);
  if (subCategoryId) filters.subCategoryId = parseInt(subCategoryId as string, 10);
  if (query) filters.query = query as string;
  
  // 處理標籤過濾
  if (tags) {
    filters.tags = (tags as string).split(',').map(tag => tag.trim());
  }

  // 處理分頁和排序
  const pagination: any = {};
  if (cursor) pagination.cursor = cursor as string;
  if (limit) pagination.limit = parseInt(limit as string, 10);
  if (sortField) pagination.sortField = sortField as string;
  if (sortDirection) pagination.sortDirection = sortDirection as string;

  // 查詢資源列表
  const result = await resourceService.getResources(filters, pagination);

  // 返回結果
  res.json({
    success: true,
    data: result
  });
});

/**
 * 獲取單個資源
 * GET /resources/:id
 */
export const getResourceById = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // 查詢資源
  const resource = await resourceService.getResourceById(parseInt(id, 10));

  // 記錄查看次數（非阻塞）
  resourceService.incrementViewCount(parseInt(id, 10)).catch(err => {
    console.error('Failed to increment view count:', err);
  });

  // 返回結果
  res.json({
    success: true,
    data: resource
  });
});

/**
 * 創建資源
 * POST /resources
 */
export const createResource = asyncWrapper(async (req: Request, res: Response) => {
  // 獲取用戶 ID（開發環境下使用測試用戶）
  const userId = getUserIdOrTestUser(req);

  // 驗證請求數據
  const validatedData = validateCreateResource(req.body);

  // 創建資源
  const resource = await resourceService.createResource(validatedData, userId);

  // 返回結果
  res.status(201).json({
    success: true,
    data: resource
  });
});

/**
 * 更新資源
 * PATCH /resources/:id
 */
export const updateResource = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  // 獲取用戶 ID（開發環境下使用測試用戶）
  const userId = getUserIdOrTestUser(req);

  // 驗證請求數據
  const validatedData = validateUpdateResource(req.body);

  // 更新資源
  const resource = await resourceService.updateResource(
    parseInt(id, 10),
    validatedData,
    userId
  );

  // 返回結果
  res.json({
    success: true,
    data: resource
  });
});

/**
 * 更新資源狀態
 * PATCH /resources/:id/status
 */
export const updateResourceStatus = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  // 獲取用戶 ID（開發環境下使用測試用戶）
  const userId = getUserIdOrTestUser(req);

  // 驗證請求數據
  const { status } = validateUpdateResourceStatus(req.body);

  // 更新資源狀態
  const resource = await resourceService.updateResourceStatus(
    parseInt(id, 10),
    status,
    userId
  );

  // 返回結果
  res.json({
    success: true,
    data: resource
  });
});

/**
 * 刪除資源
 * DELETE /resources/:id
 */
export const deleteResource = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  // 獲取用戶 ID（開發環境下使用測試用戶）
  const userId = getUserIdOrTestUser(req);

  // 刪除資源
  await resourceService.deleteResource(parseInt(id, 10), userId);

  // 返回結果
  res.json({
    success: true,
    message: '資源已成功刪除'
  });
});

/**
 * 獲取資源標籤
 * GET /resources/:id/tags
 */
export const getResourceTags = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // 獲取資源標籤
  const tags = await tagService.getEntityTags(parseInt(id, 10), 'resource');

  // 返回結果
  res.json({
    success: true,
    data: tags.map(tag => {
      const tagInstance = tag as unknown as TagAttributes;
      return tagInstance.name;
    })
  });
});

// 導出所有控制器函數
export default {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
  getResourceTags
};
