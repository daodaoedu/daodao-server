/**
 * 資源控制器
 * 處理資源相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, UnauthorizedError } from '../middleware/error.middleware';
import * as resourceService from '../services/resource.service';
import * as tagService from '../services/tag.service';
import type { tags } from '../../generated/prisma';
import { recordView as trackView } from '../services/view-tracking.service';
import { prisma } from '../services/database/prisma.service';

import {
  validateCreateResource,
  validateUpdateResource,
  validateUpdateResourceStatus,
  validateGetResourceByIdResponse,
  validateGetResourcesListResponse,
  validateCreateResourceResponse,
  validateUpdateResourceResponse,
  validateGetResourceStatsResponse,
  validateGetResourceTagsResponse,
  validateDeleteResourceResponse,
  validateRecordResourceViewResponse
} from '../validators/resource.validator';

/**
 * 獲取資源列表
 * GET /resources
 */
export const getResources = asyncHandler(async (req: Request, res: Response) => {
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

  // 驗證並回傳回應
  const validatedResult = validateGetResourcesListResponse(result);
  res.json(validatedResult);
});

/**
 * 獲取單個資源
 * GET /resources/:resourceId
 */
export const getResourceById = asyncHandler(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  
  // 查詢資源
  const resource = await resourceService.getResourceById(resourceId); // 直接傳遞字串 ID

  // 記錄查看次數（非阻塞） - 暫時註解，可在需要時實作
  // resourceService.incrementViewCount(parseInt(id)).catch(err => {
  //   console.error('Failed to increment view count:', err);
  // });

  // 驗證並回傳回應
  const validatedResource = validateGetResourceByIdResponse(resource);
  res.json(validatedResource);
});

/**
 * 創建資源
 * POST /resources
 */
export const createResource = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError('必須登入才能執行此操作');
  console.log(`創建資源: userId=${userId}, req.user=${JSON.stringify(req.user)}`);

  // 驗證請求數據
  const validatedData = validateCreateResource(req.body);

  // 創建資源
  const resource = await resourceService.createResource(validatedData, userId);

  // 驗證並回傳回應
  const validatedResource = validateCreateResourceResponse(resource);
  res.status(201).json(validatedResource);
});

/**
 * 更新資源
 * PATCH /resources/:resourceId
 */
export const updateResource = asyncHandler(async (req: Request, res: Response) => {
  console.log('🚀 updateResource called');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  
  const { resourceId } = req.params;  // 使用路由中定義的參數名稱
  console.log('Resource ID:', resourceId);

  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError('必須登入才能執行此操作');
  console.log('User ID:', userId);

  // 驗證請求數據
  console.log('Validating request data...');
  const validatedData = validateUpdateResource(req.body);
  console.log('Validated data:', validatedData);

  // 更新資源
  console.log('Calling resource service...');
  const resource = await resourceService.updateResource(
    resourceId, // 使用正確的參數名稱
    validatedData,
    userId
  );
  console.log('Resource service completed');

  // 驗證並回傳回應
  const validatedResource = validateUpdateResourceResponse(resource);
  res.json(validatedResource);
});

/**
 * 更新資源狀態
 * PATCH /resources/:resourceId/status
 */
export const updateResourceStatus = asyncHandler(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError('必須登入才能執行此操作');

  // 驗證請求數據
  const { status } = validateUpdateResourceStatus(req.body);

  // 更新資源狀態
  const resource = await resourceService.updateResource(
    resourceId, // 直接傳遞 UUID 字串
    { status },
    userId
  );

  // 驗證並回傳回應
  const validatedResource = validateUpdateResourceResponse(resource);
  res.json(validatedResource);
});

/**
 * 刪除資源
 * DELETE /resources/:resourceId
 */
export const deleteResource = asyncHandler(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError('必須登入才能執行此操作');

  // 刪除資源
  const result = await resourceService.deleteResource(resourceId, userId); // 直接傳遞 UUID 字串

  // 驗證並回傳回應
  const validatedResult = validateDeleteResourceResponse(result);
  res.json(validatedResult);
});

/**
 * 獲取資源統計資訊
 * GET /resources/stats
 * @swagger
 * /api/resources/stats:
 *   get:
 *     tags: [Resources]
 *     summary: 獲取資源統計資訊
 *     description: 獲取系統中資源的基礎統計資訊，包括總數、啟用數和類型分布
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 統計資訊獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ResourceStatsResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export const getResourceStats = asyncHandler(async (req: Request, res: Response) => {
  // 可選的用戶過濾（如果已登入）
  const userId = req.user?.id;
  
  // 獲取資源統計
  const stats = await resourceService.getResourceStats(userId);

  // 驗證並回傳回應
  const validatedStats = validateGetResourceStatsResponse(stats);
  res.json(validatedStats);
});

/**
 * 獲取資源標籤
 * GET /resources/:resourceId/tags
 */
export const getResourceTags = asyncHandler(async (req: Request, res: Response) => {
  const { resourceId } = req.params; // UUID
  
  // 直接查詢資源的數字 ID
  const { prisma } = await import('../services/database/prisma.service');
  const resource = await prisma.resources.findFirst({
    where: { 
      external_id: resourceId,
      deleted_at: null 
    },
    select: {
      id: true
    }
  });
  
  if (!resource) {
    throw new NotFoundError('資源不存在');
  }
  
  // 使用資源的數字 ID 獲取標籤
  const tags = await tagService.getEntityTags('resource', resource.id);

  // 構建回應資料
  const response = {
    success: true,
    data: tags.map((tag: tags) => tag.name),
    timestamp: new Date().toISOString()
  };

  // 驗證並回傳回應
  const validatedResponse = validateGetResourceTagsResponse(response);
  res.json(validatedResponse);
});

/**
 * 記錄資源瀏覽
 * POST /resources/:resourceId/view
 */
export const recordResourceView = asyncHandler(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError('必須登入才能執行此操作');

  // 以 external_id (UUID) 查詢內部數字 ID
  const resource = await prisma.resources.findFirst({
    where: { external_id: resourceId, deleted_at: null },
    select: { id: true }
  });

  if (!resource) {
    throw new NotFoundError('資源不存在');
  }

  const viewCount = await trackView('resource', resource.id, userId);

  const validatedResponse = validateRecordResourceViewResponse({ success: true, data: { viewCount }, timestamp: new Date().toISOString() });
  res.json(validatedResponse);
});

// 導出所有控制器函數
export default {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
  getResourceStats,
  getResourceTags,
  recordResourceView
};
