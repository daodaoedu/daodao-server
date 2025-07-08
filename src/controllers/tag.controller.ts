/**
 * 標籤控制器
 * 處理標籤相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncWrapper, BadRequestError } from '@/utils/error-handler';
import tagService from '@/services/tag.service';
import type { tags } from '../../generated/prisma';

/**
 * 獲取熱門標籤
 * GET /tags/popular
 */
export const getPopularTags = asyncWrapper(async (req: Request, res: Response) => {
  const { entityType, limit } = req.query;
  
  // 獲取熱門標籤
  const tags = await tagService.getPopularTags(
    limit ? parseInt(limit as string, 10) : 20
  );

  // 返回結果
  res.json({
    success: true,
    data: tags.map((tag: { tag: tags; usageCount: number }) => ({
      id: tag.tag.id,
      name: tag.tag.name,
      count: tag.usageCount
    }))
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
    data: tags.map((tag: tags) => ({
      id: tag.id,
      name: tag.name
    }))
  });
});

/**
 * 獲取標籤統計
 * GET /tags/stats
 */
export const getTagStats = asyncWrapper(async (req: Request, res: Response) => {
  // 獲取標籤統計 - 暫時使用簡單的統計
  const allTags = await tagService.getAllTags();
  const popularTags = await tagService.getPopularTags(10);

  // 返回結果
  res.json({
    success: true,
    data: {
      totalTags: allTags.length,
      popularTags: popularTags.map(item => ({
        id: item.tag.id,
        name: item.tag.name,
        usageCount: item.usageCount
      }))
    }
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
  await tagService.setEntityTags(
    entityType as string,
    entityId as string,
    [tagName as string],
    1 // 暫時使用默認用戶ID，實際應從認證中獲取
  );

  // 返回結果
  res.status(201).json({
    success: true,
    data: {
      entityId: entityId,
      entityType,
      tagName
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

  // 移除實體標籤 - 先根據名稱查找標籤ID
  const tag = await tagService.getTagByName(tagName as string);
  if (!tag) {
    throw new BadRequestError('標籤不存在');
  }
  
  await tagService.removeEntityTag(
    entityType as string,
    entityId as string,
    tag.id
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
    entityType as string,
    entityId as string
  );

  // 返回結果
  res.json({
    success: true,
    data: tags.map((tag: tags) => ({
      id: tag.id,
      name: tag.name
    }))
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
