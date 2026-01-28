/**
 * 標籤控制器
 * 處理標籤相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import {
  getPopularTagsApi,
  searchTagsApi,
  suggestTagsApi,
  getAllTagsApi,
  getEntityTagsApi,
  addEntityTag as addEntityTagService,
  removeEntityTag as removeEntityTagInternal,
  getTagByName,
  type TimeRange
} from '../services/tag.service';
import {
  getTagPromptsByTags,
  type TagPromptUsageType,
  type TagPromptLocale
} from '../services/tag-prompt.service';
import { createSuccessResponse } from '../utils/response-helper';
import type { tags } from '../../generated/prisma';
import {
  getPopularTagsApiResponseSchema,
  searchTagsApiResponseSchema,
  suggestTagsApiResponseSchema,
  getTagStatsApiResponseSchema,
  addEntityTagApiResponseSchema,
  removeEntityTagApiResponseSchema,
  getEntityTagsApiResponseSchema,
  tagPromptsApiResponseSchema
} from '../validators/tag.validators';

/**
 * 獲取熱門標籤
 * GET /tags/popular
 */
export const getPopularTags = asyncHandler(async (req: Request, res: Response) => {
  const { limit, entityType, timeRange } = req.query;

  const result = await getPopularTagsApi(
    limit ? parseInt(limit as string, 10) : 20,
    entityType as string | undefined,
    (timeRange as TimeRange) || 'all'
  );

  // 格式化回應資料
  const formattedResult = {
    ...result,
    data: result.data.map((tag: { tag: tags; usageCount: number }) => ({
      id: tag.tag.id,
      name: tag.tag.name,
      count: tag.usageCount
    }))
  };

  const validatedResponse = getPopularTagsApiResponseSchema.parse(formattedResult);
  res.json(validatedResponse);
});

/**
 * 搜索標籤
 * GET /tags/search
 */
export const searchTags = asyncHandler(async (req: Request, res: Response) => {
  const { query, limit } = req.query;

  if (!query) {
    throw new BadRequestError('必須提供搜索關鍵詞');
  }

  const result = await searchTagsApi(
    query as string,
    limit ? parseInt(limit as string, 10) : 10
  );

  // 格式化回應資料
  const formattedResult = {
    ...result,
    data: result.data.map((tag: tags) => ({
      id: tag.id,
      name: tag.name
    }))
  };

  const validatedResponse = searchTagsApiResponseSchema.parse(formattedResult);
  res.json(validatedResponse);
});

/**
 * 標籤建議（自動補全）
 * GET /tags/suggest
 */
export const suggestTags = asyncHandler(async (req: Request, res: Response) => {
  const { q, limit } = req.query;

  if (!q) {
    throw new BadRequestError('必須提供搜索關鍵詞');
  }

  const result = await suggestTagsApi(
    q as string,
    limit ? parseInt(limit as string, 10) : 10
  );

  const validatedResponse = suggestTagsApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 獲取標籤統計
 * GET /tags/stats
 */
export const getTagStats = asyncHandler(async (req: Request, res: Response) => {
  // 獲取標籤統計
  const [allTagsResult, popularTagsResult] = await Promise.all([
    getAllTagsApi(),
    getPopularTagsApi(10)
  ]);

  const result = createSuccessResponse({
    totalTags: allTagsResult.data.length,
    popularTags: popularTagsResult.data.map(item => ({
      id: item.tag.id,
      name: item.tag.name,
      count: item.usageCount
    }))
  }, {
    aggregateData: {
      totalTagsCount: allTagsResult.data.length,
      topTagsCount: popularTagsResult.data.length
    }
  });

  const validatedResponse = getTagStatsApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 為特定實體添加標籤
 * POST /tags/entities
 */
export const addEntityTag = asyncHandler(async (req: Request, res: Response) => {
  const { entityId, entityType, tagName } = req.body;

  // 驗證請求數據
  if (!entityId || !entityType || !tagName) {
    throw new BadRequestError('必須提供實體ID、實體類型和標籤名稱');
  }

  // 獲取用戶ID
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('需要用戶認證');
  }

  // 添加實體標籤（追加模式，不會刪除現有標籤）
  const added = await addEntityTagService(
    entityType as string,
    parseInt(entityId as string, 10),
    tagName as string,
    userId
  );

  const result = createSuccessResponse({
    entityId: parseInt(entityId as string, 10),
    entityType,
    tagName
  }, {
    message: added ? '標籤已成功添加到實體' : '標籤已存在於該實體'
  });

  const validatedResponse = addEntityTagApiResponseSchema.parse(result);
  res.status(added ? 201 : 200).json(validatedResponse);
});

/**
 * 為特定實體移除標籤
 * DELETE /tags/entities
 */
export const removeEntityTag = asyncHandler(async (req: Request, res: Response) => {
  const { entityId, entityType, tagName } = req.body;

  // 驗證請求數據
  if (!entityId || !entityType || !tagName) {
    throw new BadRequestError('必須提供實體ID、實體類型和標籤名稱');
  }

  // 移除實體標籤 - 先根據名稱查找標籤ID
  const tag = await getTagByName(tagName as string);
  if (!tag) {
    throw new BadRequestError('標籤不存在');
  }

  await removeEntityTagInternal(
    entityType as string,
    parseInt(entityId as string),
    tag.id
  );

  const result = createSuccessResponse(undefined, {
    message: '標籤已成功移除'
  });

  const validatedResponse = removeEntityTagApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 獲取特定實體的標籤
 * GET /tags/entities
 */
export const getEntityTags = asyncHandler(async (req: Request, res: Response) => {
  const { entityId, entityType } = req.query;

  // 驗證請求數據
  if (!entityId || !entityType) {
    throw new BadRequestError('必須提供實體ID和實體類型');
  }

  const result = await getEntityTagsApi(
    entityType as string,
    parseInt(entityId as string)
  );

  // 格式化回應資料
  const formattedResult = {
    ...result,
    data: result.data.map((tag: tags) => ({
      id: tag.id,
      name: tag.name
    }))
  };

  const validatedResponse = getEntityTagsApiResponseSchema.parse(formattedResult);
  res.json(validatedResponse);
});

/**
 * 取得標籤引導句
 * GET /tags/prompts
 */
export const getTagPrompts = asyncHandler(async (req: Request, res: Response) => {
  const { tags: tagsParam, usageType, locale } = req.query;

  if (!tagsParam) {
    throw new BadRequestError('必須提供標籤名稱');
  }

  // 解析標籤名稱（逗號分隔）
  const tagNames = (tagsParam as string).split(',').map(t => t.trim()).filter(Boolean);

  if (tagNames.length === 0) {
    throw new BadRequestError('必須提供至少一個有效的標籤名稱');
  }

  const result = await getTagPromptsByTags(
    tagNames,
    (usageType as TagPromptUsageType) || 'practice_checkin',
    (locale as TagPromptLocale) || 'zh-TW'
  );

  const validatedResponse = tagPromptsApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

// 導出所有控制器函數
export default {
  getPopularTags,
  searchTags,
  suggestTags,
  getTagStats,
  addEntityTag,
  removeEntityTag,
  getEntityTags,
  getTagPrompts
};
