/**
 * 標籤控制器
 * 處理標籤相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { Model } from 'sequelize';
import { asyncWrapper, BadRequestError } from '@/utils/error-handler';
import tagService from '@/services/tag-service';
import { TagAttributes } from '@/models/tag';

/**
 * 獲取熱門標籤
 * GET /tags/popular
 */
export const getPopularTags = asyncWrapper(async (req: Request, res: Response) => {
  const { entityType, limit } = req.query;
  
  // 獲取熱門標籤
  const tags = await tagService.getPopularTags(
    entityType as string | undefined,
    limit ? parseInt(limit as string, 10) : undefined
  );

  // 返回結果
  res.json({
    success: true,
    data: tags.map((tag: Model<TagAttributes>) => {
      const tagInstance = tag as unknown as TagAttributes & { get: (key: string) => unknown };
      return {
        id: tagInstance.id,
        name: tagInstance.name,
        count: tag.get('count')
      };
    })
  });
});

/**
 * 搜索標籤
 * GET /tags/search
 */
export const searchTags = asyncWrapper(async (req: Request, res: Response) => {
  const { query, limit } = req.query;
  
  if (!query) {
    throw new BadRequestError('必須提供搜索關鍵詞');
  }

  // 搜索標籤
  const tags = await tagService.searchTags(
    query as string,
    limit ? parseInt(limit as string, 10) : undefined
  );

  // 返回結果
  res.json({
    success: true,
    data: tags.map((tag: Model<TagAttributes>) => {
      const tagInstance = tag as unknown as TagAttributes;
      return {
        id: tagInstance.id,
        name: tagInstance.name
      };
    })
  });
});

/**
 * 獲取標籤統計
 * GET /tags/stats
 */
export const getTagStats = asyncWrapper(async (req: Request, res: Response) => {
  // 獲取標籤統計
  const stats = await tagService.getTagStatsByEntityType();

  // 返回結果
  res.json({
    success: true,
    data: stats.map((stat: Model<Record<string, unknown>>) => ({
      entityType: stat.get('entity_type'),
      count: stat.get('count'),
      uniqueTags: stat.get('uniqueTags')
    }))
  });
});

/**
 * 為特定實體添加標籤
 * POST /tags/entities
 */
export const addEntityTag = asyncWrapper(async (req: Request, res: Response) => {
  const { entityId, entityType, tagName } = req.body;
  
  // 驗證請求數據
  if (!entityId || !entityType || !tagName) {
    throw new BadRequestError('必須提供實體ID、實體類型和標籤名稱');
  }

  // 添加實體標籤
  const tag = await tagService.addEntityTag(
    parseInt(entityId as string, 10),
    entityType as string,
    tagName as string
  );

  // 返回結果
  const tagInstance = tag as unknown as TagAttributes;
  res.status(201).json({
    success: true,
    data: {
      id: tagInstance.id,
      name: tagInstance.name
    }
  });
});

/**
 * 為特定實體移除標籤
 * DELETE /tags/entities
 */
export const removeEntityTag = asyncWrapper(async (req: Request, res: Response) => {
  const { entityId, entityType, tagName } = req.body;
  
  // 驗證請求數據
  if (!entityId || !entityType || !tagName) {
    throw new BadRequestError('必須提供實體ID、實體類型和標籤名稱');
  }

  // 移除實體標籤
  await tagService.removeEntityTag(
    parseInt(entityId as string, 10),
    entityType as string,
    tagName as string
  );

  // 返回結果
  res.json({
    success: true,
    message: '標籤已成功移除'
  });
});

/**
 * 獲取特定實體的標籤
 * GET /tags/entities
 */
export const getEntityTags = asyncWrapper(async (req: Request, res: Response) => {
  const { entityId, entityType } = req.query;
  
  // 驗證請求數據
  if (!entityId || !entityType) {
    throw new BadRequestError('必須提供實體ID和實體類型');
  }

  // 獲取實體標籤
  const tags = await tagService.getEntityTags(
    parseInt(entityId as string, 10),
    entityType as string
  );

  // 返回結果
  res.json({
    success: true,
    data: tags.map((tag: Model<TagAttributes>) => {
      const tagInstance = tag as unknown as TagAttributes;
      return {
        id: tagInstance.id,
        name: tagInstance.name
      };
    })
  });
});

// 導出所有控制器函數
export default {
  getPopularTags,
  searchTags,
  getTagStats,
  addEntityTag,
  removeEntityTag,
  getEntityTags
};
