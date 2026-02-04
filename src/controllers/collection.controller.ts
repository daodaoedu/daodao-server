/**
 * Collection Controller
 * 學習資源收集功能的 API 控制器
 */

import { Request, Response } from 'express';
import { collectionService } from '@/services/collection';
import { CollectionPlatform } from '@/types/collection.types';
import { ClassificationMode, CLASSIFICATION_MODES } from '@/types/classifier.types';
import {
  createCollectionSourceSchema,
  updateCollectionSourceSchema,
  collectionSourceQuerySchema,
  collectedContentQuerySchema,
  reviewContentSchema,
  bulkReviewSchema,
} from '@/validators/collection.validator';
import { createSuccessResponse, createErrorResponse } from '@/utils/response-helper';

// ============================================
// 收集來源管理
// ============================================

/**
 * 建立收集來源
 * POST /api/v1/collection/sources
 */
export const createSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createCollectionSourceSchema.parse(req.body);
    const userId = req.user?.id || 1; // 開發模式使用 userId=1

    const source = await collectionService.createSource(validatedData, userId);

    res.status(201).json(
      createSuccessResponse(source, 'Collection source created successfully')
    );
  } catch (error) {
    console.error('[CollectionController] createSource error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid request data', error)
      );
      return;
    }

    res.status(500).json(
      createErrorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to create collection source'
      )
    );
  }
};

/**
 * 取得收集來源列表
 * GET /api/v1/collection/sources
 */
export const getSources = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedParams = collectionSourceQuerySchema.parse(req.query);
    const result = await collectionService.getSources(validatedParams);

    res.json(
      createSuccessResponse(result.data, undefined, {
        pagination: {
          page: validatedParams.page || 1,
          limit: validatedParams.limit || 20,
          total: result.total,
          totalPages: Math.ceil(result.total / (validatedParams.limit || 20)),
        },
      })
    );
  } catch (error) {
    console.error('[CollectionController] getSources error:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to get collection sources')
    );
  }
};

/**
 * 取得單一收集來源
 * GET /api/v1/collection/sources/:sourceId
 */
export const getSourceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceId } = req.params;
    const source = await collectionService.getSourceById(sourceId);

    if (!source) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Collection source not found'));
      return;
    }

    res.json(createSuccessResponse(source));
  } catch (error) {
    console.error('[CollectionController] getSourceById error:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to get collection source')
    );
  }
};

/**
 * 更新收集來源
 * PATCH /api/v1/collection/sources/:sourceId
 */
export const updateSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceId } = req.params;
    const validatedData = updateCollectionSourceSchema.parse(req.body);

    const source = await collectionService.updateSource(sourceId, validatedData);

    if (!source) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Collection source not found'));
      return;
    }

    res.json(createSuccessResponse(source, 'Collection source updated successfully'));
  } catch (error) {
    console.error('[CollectionController] updateSource error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid request data', error)
      );
      return;
    }

    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to update collection source')
    );
  }
};

/**
 * 刪除收集來源
 * DELETE /api/v1/collection/sources/:sourceId
 */
export const deleteSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceId } = req.params;
    const success = await collectionService.deleteSource(sourceId);

    if (!success) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Collection source not found'));
      return;
    }

    res.json(createSuccessResponse({ deleted: true }, 'Collection source deleted successfully'));
  } catch (error) {
    console.error('[CollectionController] deleteSource error:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to delete collection source')
    );
  }
};

// ============================================
// 內容抓取
// ============================================

/**
 * 從指定來源抓取內容
 * POST /api/v1/collection/sources/:sourceId/fetch
 */
export const fetchFromSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceId } = req.params;
    const result = await collectionService.fetchFromSource(sourceId);

    res.json(
      createSuccessResponse(result, `Fetched ${result.fetched} items`)
    );
  } catch (error) {
    console.error('[CollectionController] fetchFromSource error:', error);
    res.status(500).json(
      createErrorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch from source'
      )
    );
  }
};

/**
 * 從所有啟用的來源抓取內容
 * POST /api/v1/collection/fetch-all
 */
export const fetchAllSources = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await collectionService.fetchAllActiveSources();

    res.json(
      createSuccessResponse(result, `Fetched ${result.totalFetched} items from active sources`)
    );
  } catch (error) {
    console.error('[CollectionController] fetchAllSources error:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to fetch from all sources')
    );
  }
};

// ============================================
// 收集內容管理
// ============================================

/**
 * 取得收集內容列表
 * GET /api/v1/collection/contents
 */
export const getContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedParams = collectedContentQuerySchema.parse(req.query);
    const result = await collectionService.getContents(validatedParams);

    res.json(
      createSuccessResponse(result.data, undefined, {
        pagination: {
          page: validatedParams.page || 1,
          limit: validatedParams.limit || 20,
          total: result.total,
          totalPages: Math.ceil(result.total / (validatedParams.limit || 20)),
        },
      })
    );
  } catch (error) {
    console.error('[CollectionController] getContents error:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to get collected contents')
    );
  }
};

/**
 * 取得單一收集內容
 * GET /api/v1/collection/contents/:contentId
 */
export const getContentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const content = await collectionService.getContentById(contentId);

    if (!content) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Collected content not found'));
      return;
    }

    res.json(createSuccessResponse(content));
  } catch (error) {
    console.error('[CollectionController] getContentById error:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to get collected content')
    );
  }
};

/**
 * 審核內容
 * POST /api/v1/collection/contents/:contentId/review
 */
export const reviewContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const validatedData = reviewContentSchema.parse(req.body);
    const reviewerId = req.user?.id || 1; // 開發模式使用 userId=1

    const content = await collectionService.reviewContent(contentId, validatedData, reviewerId);

    if (!content) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Collected content not found'));
      return;
    }

    const actionText = validatedData.action === 'approve' ? 'approved' : 'rejected';
    res.json(createSuccessResponse(content, `Content ${actionText} successfully`));
  } catch (error) {
    console.error('[CollectionController] reviewContent error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid request data', error)
      );
      return;
    }

    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to review content')
    );
  }
};

/**
 * 批次審核內容
 * POST /api/v1/collection/contents/bulk-review
 */
export const bulkReviewContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = bulkReviewSchema.parse(req.body);
    const reviewerId = req.user?.id || 1; // 開發模式使用 userId=1

    const result = await collectionService.bulkReviewContents(validatedData, reviewerId);

    res.json(
      createSuccessResponse(
        result,
        `Bulk review completed: ${result.success} success, ${result.failed} failed`
      )
    );
  } catch (error) {
    console.error('[CollectionController] bulkReviewContents error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid request data', error)
      );
      return;
    }

    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to bulk review contents')
    );
  }
};

// ============================================
// 統計
// ============================================

/**
 * 取得收集統計資訊
 * GET /api/v1/collection/stats
 */
export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await collectionService.getStats();
    res.json(createSuccessResponse(stats));
  } catch (error) {
    console.error('[CollectionController] getStats error:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to get collection stats')
    );
  }
};

// ============================================
// AI 分類
// ============================================

/**
 * 分類單一內容
 * POST /api/v1/collection/contents/:contentId/classify
 */
export const classifyContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const content = await collectionService.classifyContent(contentId);

    if (!content) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Collected content not found'));
      return;
    }

    res.json(createSuccessResponse(content, 'Content classified successfully'));
  } catch (error) {
    console.error('[CollectionController] classifyContent error:', error);
    res.status(500).json(
      createErrorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to classify content'
      )
    );
  }
};

/**
 * 批次分類待處理內容
 * POST /api/v1/collection/classify-pending
 *
 * Query 參數:
 * - limit: 最大處理數量 (預設: 10)
 * - platform: 只處理特定平台 (youtube, github, threads)
 * - mode: 分類模式 (keyword: 關鍵字, ai: AI, auto: 自動選擇)
 */
export const classifyPendingContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const platform = req.query.platform as string | undefined;
    const modeParam = req.query.mode as string | undefined;

    // 驗證分類模式
    const validModes = Object.values(CLASSIFICATION_MODES);
    const mode: ClassificationMode = validModes.includes(modeParam as ClassificationMode)
      ? (modeParam as ClassificationMode)
      : CLASSIFICATION_MODES.AUTO;

    const result = await collectionService.classifyPendingContents({
      limit,
      platform: platform as CollectionPlatform | undefined,
      mode,
    });

    res.json(
      createSuccessResponse(
        result,
        `Classification completed: ${result.success} success, ${result.failed} failed (mode: ${result.mode})`
      )
    );
  } catch (error) {
    console.error('[CollectionController] classifyPendingContents error:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to classify pending contents')
    );
  }
};

// 匯出控制器物件
export const collectionController = {
  // 來源管理
  createSource,
  getSources,
  getSourceById,
  updateSource,
  deleteSource,

  // 內容抓取
  fetchFromSource,
  fetchAllSources,

  // 內容管理
  getContents,
  getContentById,
  reviewContent,
  bulkReviewContents,

  // AI 分類
  classifyContent,
  classifyPendingContents,

  // 統計
  getStats,
};
