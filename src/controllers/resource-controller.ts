/**
 * 資源控制器
 * 處理資源相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { Model } from 'sequelize';

// 擴展 Request 介面以包含 user 屬性
interface AuthRequest extends Request {
  user?: {
    id: number;
    username?: string;
    email?: string;
    isTemp?: boolean;
    roles?: string[];
    [key: string]: unknown;
  };
}

/**
 * 獲取用戶 ID，開發環境下提供測試用戶
 */
const getUserIdOrTestUser = (req: AuthRequest): number => {
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
import { asyncWrapper, BadRequestError, NotFoundError } from '@/utils/error-handler';
import resourceService from '@/services/resource-service';
import tagService from '@/services/tag-service';
import { Resource } from '@/models/index';
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
export const getResources = asyncWrapper(async (req: AuthRequest, res: Response) => {
  const { 
    cursor, 
    limit, 
    type, 
    cost, 
    level, 
    majorCategory, 
    subCategory, 
    tags, 
    query,
    sort,
    order
  } = req.query;

  // 處理過濾條件
  const filters: Record<string, string | string[]> = {};
  if (type) filters.type = type as string;
  if (cost) filters.cost = cost as string;
  if (level) filters.level = level as string;
  if (majorCategory) filters.majorCategory = majorCategory as string;
  if (subCategory) filters.subCategory = subCategory as string;
  if (query) filters.query = query as string;
  
  // 處理標籤過濾
  if (tags) {
    filters.tags = (tags as string).split(',').map(tag => tag.trim());
  }

  // 處理分頁和排序
  const pagination: Record<string, string | number> = {};
  if (cursor) pagination.cursor = cursor as string;
  if (limit) pagination.limit = parseInt(limit as string, 10);
  if (sort) pagination.sort = sort as string;
  if (order) pagination.order = order as string;

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
export const getResourceById = asyncWrapper(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  // 查詢資源
  const resource = await resourceService.getResourceById(id); // 直接傳遞字串 ID

  // 記錄查看次數（非阻塞）
  // TODO: incrementViewCount 需要更新來支援 UUID
  // resourceService.incrementViewCount(id).catch(err => {
  //   console.error('Failed to increment view count:', err);
  // });

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
export const createResource = asyncWrapper(async (req: AuthRequest, res: Response) => {
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
export const updateResource = asyncWrapper(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  // 獲取用戶 ID（開發環境下使用測試用戶）
  const userId = getUserIdOrTestUser(req);

  // 驗證請求數據
  const validatedData = validateUpdateResource(req.body);

  // 更新資源
  const resource = await resourceService.updateResource(
    id, // 直接傳遞 UUID 字串
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
export const updateResourceStatus = asyncWrapper(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  // 獲取用戶 ID（開發環境下使用測試用戶）
  const userId = getUserIdOrTestUser(req);

  // 驗證請求數據
  const { status } = validateUpdateResourceStatus(req.body);

  // 更新資源狀態
  const resource = await resourceService.updateResourceStatus(
    id, // 直接傳遞 UUID 字串
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
export const deleteResource = asyncWrapper(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  // 獲取用戶 ID（開發環境下使用測試用戶）
  const userId = getUserIdOrTestUser(req);

  // 刪除資源
  await resourceService.deleteResource(id, userId); // 直接傳遞 UUID 字串

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
export const getResourceTags = asyncWrapper(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  // 獲取資源標籤
  // 先查找資源獲取內部 ID
  const resource = await Resource.findOne({ where: { external_id: id }, attributes: ['id'] });
  if (!resource) {
    throw new NotFoundError(`找不到 external_id 為 ${id} 的資源`);
  }
  const tags = await tagService.getEntityTags(resource.get('id') as number, 'resource');

  // 返回結果
  res.json({
    success: true,
    data: tags.map((tag: Model<TagAttributes>) => {
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
