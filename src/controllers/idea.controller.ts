/**
 * 想法控制器
 * 處理想法相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncWrapper } from '@/utils/error-handler';
import { 
  createIdeaSchema, 
  updateIdeaSchema, 
  ideaQuerySchema,
  ideaParamsSchema
} from '@/validators/idea.validators';
import ideaService from '@/services/idea.service';
import { ApiErrorResponse } from '@/types/idea.types';

/**
 * 獲取用戶 ID，開發環境下提供測試用戶
 */
const getUserIdOrTestUser = (user?: Request['user']): number | undefined => {
  const userId = user?.id;
  
  if (!userId) {
    // 為 Swagger UI 測試提供預設用戶 ID（僅在開發環境）
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('⚠️  Using test user ID for development/testing');
      return 1; // 測試用戶 ID
    }
    return undefined;
  }
  
  return userId;
};

/**
 * 獲取想法列表
 */
export const getIdeas = asyncWrapper(async (req: Request, res: Response) => {
  // 驗證和解析查詢參數
  const queryParams = ideaQuerySchema.parse(req.query);
  
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
  
  res.json({
    success: true,
    data: result.ideas,
    pagination: result.pagination
  });
});

/**
 * 根據 ID 獲取想法詳情
 */
export const getIdeaById = asyncWrapper(async (req: Request, res: Response) => {
  // 驗證路徑參數
  const { id } = ideaParamsSchema.parse(req.params);
  
  // 獲取當前使用者 ID（如果已登入）
  const userId = getUserIdOrTestUser(req.user);
  
  // 查詢想法詳情
  const idea = await ideaService.getIdeaById(id, userId);
  
  res.json({
    success: true,
    data: idea
  });
});

/**
 * 創建想法
 */
export const createIdea = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  // 驗證請求資料
  const data = createIdeaSchema.parse(req.body);
  
  // 獲取當前使用者 ID
  const userId = getUserIdOrTestUser(req.user);
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        message: '需要登入才能創建想法',
        code: 'AUTHENTICATION_REQUIRED'
      }
    } as ApiErrorResponse);
    return;
  }
  
  // 創建想法
  const result = await ideaService.createIdea(data, userId);
  
  res.status(201).json({
    success: true,
    data: result,
    message: '想法已成功建立'
  });
});

/**
 * 更新想法
 */
export const updateIdea = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  // 驗證路徑參數和請求資料
  const { id } = ideaParamsSchema.parse(req.params);
  const data = updateIdeaSchema.parse(req.body);
  
  // 獲取當前使用者 ID
  const userId = getUserIdOrTestUser(req.user);
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        message: '需要登入才能更新想法',
        code: 'AUTHENTICATION_REQUIRED'
      }
    } as ApiErrorResponse);
    return;
  }
  
  // 更新想法
  const idea = await ideaService.updateIdea(id, data, userId);
  
  res.json({
    success: true,
    data: idea,
    message: '想法已更新'
  });
});

/**
 * 刪除想法
 */
export const deleteIdea = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  // 驗證路徑參數
  const { id } = ideaParamsSchema.parse(req.params);
  
  // 獲取當前使用者 ID
  const userId = getUserIdOrTestUser(req.user);
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        message: '需要登入才能刪除想法',
        code: 'AUTHENTICATION_REQUIRED'
      }
    } as ApiErrorResponse);
    return;
  }
  
  // 刪除想法
  await ideaService.deleteIdea(id, userId);
  
  res.json({
    success: true,
    message: '想法已刪除'
  });
});

/**
 * 獲取我的想法
 */
export const getMyIdeas = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  // 驗證和解析查詢參數
  const queryParams = ideaQuerySchema.parse(req.query);
  
  // 獲取當前使用者 ID
  const userId = getUserIdOrTestUser(req.user);
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        message: '需要登入才能查看我的想法',
        code: 'AUTHENTICATION_REQUIRED'
      }
    } as ApiErrorResponse);
    return;
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
  
  res.json({
    success: true,
    data: result.ideas,
    pagination: result.pagination
  });
});

export default {
  getIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  deleteIdea,
  getMyIdeas
};