/**
 * Collection Routes
 * 學習資源收集功能的 API 路由
 *
 * @swagger
 * tags:
 *   name: Collection
 *   description: 學習資源收集管理 API
 */

import { Router } from 'express';
import { collectionController } from '@/controllers/collection.controller';

const router = Router();

// ============================================
// 收集來源管理
// ============================================

/**
 * @swagger
 * /api/v1/collection/sources:
 *   post:
 *     summary: 建立收集來源
 *     tags: [Collection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - sourceType
 *               - sourceValue
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [youtube, github, threads]
 *               sourceType:
 *                 type: string
 *                 enum: [channel, playlist, user, hashtag, keyword, topic, repository]
 *               sourceValue:
 *                 type: string
 *               sourceName:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               fetchInterval:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 成功建立收集來源
 */
router.post('/sources', collectionController.createSource);

/**
 * @swagger
 * /api/v1/collection/sources:
 *   get:
 *     summary: 取得收集來源列表
 *     tags: [Collection]
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *       - in: query
 *         name: sourceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功取得收集來源列表
 */
router.get('/sources', collectionController.getSources);

/**
 * @swagger
 * /api/v1/collection/sources/{sourceId}:
 *   get:
 *     summary: 取得單一收集來源
 *     tags: [Collection]
 *     parameters:
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 成功取得收集來源
 *       404:
 *         description: 收集來源不存在
 */
router.get('/sources/:sourceId', collectionController.getSourceById);

/**
 * @swagger
 * /api/v1/collection/sources/{sourceId}:
 *   patch:
 *     summary: 更新收集來源
 *     tags: [Collection]
 *     parameters:
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceName:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               fetchInterval:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 成功更新收集來源
 *       404:
 *         description: 收集來源不存在
 */
router.patch('/sources/:sourceId', collectionController.updateSource);

/**
 * @swagger
 * /api/v1/collection/sources/{sourceId}:
 *   delete:
 *     summary: 刪除收集來源
 *     tags: [Collection]
 *     parameters:
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 成功刪除收集來源
 *       404:
 *         description: 收集來源不存在
 */
router.delete('/sources/:sourceId', collectionController.deleteSource);

/**
 * @swagger
 * /api/v1/collection/sources/{sourceId}/fetch:
 *   post:
 *     summary: 從指定來源抓取內容
 *     tags: [Collection]
 *     parameters:
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 成功抓取內容
 */
router.post('/sources/:sourceId/fetch', collectionController.fetchFromSource);

// ============================================
// 批次抓取
// ============================================

/**
 * @swagger
 * /api/v1/collection/fetch-all:
 *   post:
 *     summary: 從所有啟用的來源抓取內容
 *     tags: [Collection]
 *     responses:
 *       200:
 *         description: 成功抓取內容
 */
router.post('/fetch-all', collectionController.fetchAllSources);

// ============================================
// 收集內容管理
// ============================================

/**
 * @swagger
 * /api/v1/collection/contents:
 *   get:
 *     summary: 取得收集內容列表
 *     tags: [Collection]
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, classified, approved, rejected, converted]
 *       - in: query
 *         name: isLearningContent
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sourceId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: minConfidence
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, publishedAt, engagementCount, confidenceScore]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: 成功取得收集內容列表
 */
router.get('/contents', collectionController.getContents);

/**
 * @swagger
 * /api/v1/collection/contents/bulk-review:
 *   post:
 *     summary: 批次審核內容
 *     tags: [Collection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentIds
 *               - action
 *             properties:
 *               contentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reviewNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: 批次審核完成
 */
router.post('/contents/bulk-review', collectionController.bulkReviewContents);

/**
 * @swagger
 * /api/v1/collection/contents/{contentId}:
 *   get:
 *     summary: 取得單一收集內容
 *     tags: [Collection]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 成功取得收集內容
 *       404:
 *         description: 收集內容不存在
 */
router.get('/contents/:contentId', collectionController.getContentById);

/**
 * @swagger
 * /api/v1/collection/contents/{contentId}/review:
 *   post:
 *     summary: 審核內容
 *     tags: [Collection]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reviewNote:
 *                 type: string
 *               overrideName:
 *                 type: string
 *               overrideDescription:
 *                 type: string
 *               overrideType:
 *                 type: string
 *               overrideLevel:
 *                 type: string
 *               overrideTags:
 *                 type: array
 *                 items:
 *                   type: string
 *               overrideCategoryId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 成功審核內容
 *       404:
 *         description: 收集內容不存在
 */
router.post('/contents/:contentId/review', collectionController.reviewContent);

/**
 * @swagger
 * /api/v1/collection/contents/{contentId}/classify:
 *   post:
 *     summary: 使用 AI 分類單一內容
 *     tags: [Collection]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 成功分類內容
 *       404:
 *         description: 收集內容不存在
 */
router.post('/contents/:contentId/classify', collectionController.classifyContent);

// ============================================
// 分類
// ============================================

/**
 * @swagger
 * /api/v1/collection/classify-pending:
 *   post:
 *     summary: 批次分類待處理內容
 *     description: |
 *       支援兩種分類模式：
 *       - keyword: 關鍵字規則分類 (快速、免費)
 *       - ai: AI 智能分類 (精確、需要 API key)
 *       - auto: 自動選擇 (優先使用 AI，無 API key 時使用關鍵字)
 *     tags: [Collection]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 最大處理數量
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [youtube, github, threads]
 *         description: 只處理特定平台
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [keyword, ai, auto]
 *           default: auto
 *         description: |
 *           分類模式：
 *           - keyword: 關鍵字規則分類
 *           - ai: AI 智能分類
 *           - auto: 自動選擇
 *     responses:
 *       200:
 *         description: 批次分類完成
 */
router.post('/classify-pending', collectionController.classifyPendingContents);

// ============================================
// 統計
// ============================================

/**
 * @swagger
 * /api/v1/collection/stats:
 *   get:
 *     summary: 取得收集統計資訊
 *     tags: [Collection]
 *     responses:
 *       200:
 *         description: 成功取得統計資訊
 */
router.get('/stats', collectionController.getStats);

export default router;
