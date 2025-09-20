/**
 * 想法控制器
 * 處理想法相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import ideaService from '@/services/idea.service';
import type { IdeaQueryParams, IdeaParams, CreateIdeaData, UpdateIdeaData } from '@/validators/idea.validators';
import {
  ideaSuccessResponseSchema,
  ideasListResponseSchema,
  createIdeaResponseSchema,
  updateIdeaResponseSchema,
  deleteIdeaResponseSchema
} from '@/validators/idea.validators';

/**
 * 獲取用戶 ID，開發環境下提供測試用戶
 */
const getUserIdOrTestUser = (user?: Request['user']): number | undefined => {
  const userId = user?.id;
  
  if (!userId) {
    // 為 Swagger UI 測試提供預設用戶 ID（僅在開發環境）
    if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === undefined) {
      console.log('⚠️  Using test user ID for dev/testing');
      return 1; // 測試用戶 ID
    }
    return undefined;
  }
  
  return userId;
};

/**
 * 獲取想法列表
 */
export const getIdeas = asyncHandler(async (req: Request, res: Response) => {
  // 查詢參數已經在 routes 層級驗證過
  const queryParams = req.query as unknown as IdeaQueryParams;
  
  // 解析標籤
  const tags = queryParams.tags ? queryParams.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined;
  
  // 構建篩選器
  const filters = {
    query: queryParams.query,
    tags,
    userId: queryParams.userId,
    status: queryParams.status,
    sort: queryParams.sort,
    order: queryParams.order
  };
  
  // 構建分頁參數
  const pagination = {
    page: queryParams.page,
    limit: queryParams.limit,
    sort: queryParams.sort,
    order: queryParams.order
  };
  
  // 獲取當前使用者 ID（如果已登入）
  const userId = getUserIdOrTestUser(req.user);
  
  // 查詢想法列表
  const result = await ideaService.getIdeas(filters, pagination, userId);

  // 驗證響應格式
  const validatedResponse = ideasListResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 根據 ID 獲取想法詳情
 */
export const getIdeaById = asyncHandler(async (req: Request, res: Response) => {
  // 路徑參數已經在 routes 層級驗證過
  const { id } = req.params as IdeaParams;
  
  // 獲取當前使用者 ID（如果已登入）
  const userId = getUserIdOrTestUser(req.user);
  
  // 查詢想法詳情
  const result = await ideaService.getIdeaById(id, userId);

  // 驗證響應格式
  const validatedResponse = ideaSuccessResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 創建想法
 */
export const createIdea = asyncHandler(async (req: Request, res: Response) => {
  // 請求資料已經在 routes 層級驗證過
  const data = req.body as CreateIdeaData;
  
  // 獲取當前使用者 ID
  const userId = getUserIdOrTestUser(req.user);
  if (!userId) {
    throw new Error('需要登入才能創建想法');
  }
  
  // 創建想法
  const result = await ideaService.createIdea(data, userId);

  // 驗證響應格式
  const validatedResponse = createIdeaResponseSchema.parse(result);

  res.status(201).json(validatedResponse);
});

/**
 * 更新想法
 */
export const updateIdea = asyncHandler(async (req: Request, res: Response) => {
  // 參數和資料已經在 routes 層級驗證過
  const { id } = req.params as IdeaParams;
  const data = req.body as UpdateIdeaData;
  
  // 獲取當前使用者 ID
  const userId = getUserIdOrTestUser(req.user);
  if (!userId) {
    throw new Error('需要登入才能更新想法');
  }
  
  // 更新想法
  const result = await ideaService.updateIdea(id, data, userId);
  
  res.json(result);
});

/**
 * 刪除想法
 */
export const deleteIdea = asyncHandler(async (req: Request, res: Response) => {
  // 路徑參數已經在 routes 層級驗證過
  const { id } = req.params as IdeaParams;
  
  // 獲取當前使用者 ID
  const userId = getUserIdOrTestUser(req.user);
  if (!userId) {
    throw new Error('需要登入才能刪除想法');
  }
  
  // 刪除想法
  const result = await ideaService.deleteIdea(id, userId);
  
  res.json(result);
});

/**
 * 獲取我的想法
 */
export const getMyIdeas = asyncHandler(async (req: Request, res: Response) => {
  // 查詢參數已經在 routes 層級驗證過
  const queryParams = req.query as unknown as IdeaQueryParams;
  
  // 獲取當前使用者 ID
  const userId = getUserIdOrTestUser(req.user);
  if (!userId) {
    throw new Error('需要登入才能查看我的想法');
  }
  
  // 解析標籤
  const tags = queryParams.tags ? queryParams.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined;
  
  // 構建篩選器，強制設定 userId
  const filters = {
    query: queryParams.query,
    tags,
    userId: userId.toString(), // 強制使用當前使用者 ID
    status: queryParams.status,
    sort: queryParams.sort,
    order: queryParams.order
  };
  
  // 構建分頁參數
  const pagination = {
    page: queryParams.page,
    limit: queryParams.limit,
    sort: queryParams.sort,
    order: queryParams.order
  };
  
  // 查詢我的想法列表
  const result = await ideaService.getIdeas(filters, pagination, userId);
  
  res.json(result);
});

export default {
  getIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  deleteIdea,
  getMyIdeas
};