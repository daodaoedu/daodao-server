/**
 * 資源評價相關路由
 */

import express from 'express';
const router = express.Router();

/**
 * @swagger
 * /resources/{resourceId}/reviews:
 *   get:
 *     summary: 獲取資源評價
 *     tags: [Resources]
 *     description: 獲取特定資源的所有評價。
 *     x-order: 3
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 資源ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每頁返回的記錄數
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: 游標，用於游標分頁
 *     responses:
 *       200:
 *         description: 成功獲取評價
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           content:
 *                             type: string
 *                             example: "這個教程非常詳細，對初學者很友好"
 *                           rating:
 *                             type: number
 *                             example: 4.5
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         next_cursor:
 *                           type: string
 *                           nullable: true
 *                         has_more:
 *                           type: boolean
 */
router.get('/:resourceId/reviews', (req, res) => {
  const resourceId = parseInt(req.params.resourceId);
  
  res.json({
    success: true,
    data: {
      reviews: [
        {
          id: 1,
          content: "這個教程非常詳細，對初學者很友好",
          rating: 4.5,
          created_at: new Date().toISOString(),
          user: {
            id: 101,
            name: "張三"
          }
        },
        {
          id: 2,
          content: "內容豐富，但部分概念解釋不夠清晰",
          rating: 3.5,
          created_at: new Date().toISOString(),
          user: {
            id: 102,
            name: "李四"
          }
        }
      ],
      pagination: {
        next_cursor: null,
        has_more: false
      }
    }
  });
});

/**
 * @swagger
 * /resources/{resourceId}/reviews/{reviewId}:
 *   get:
 *     summary: 獲取資源評價詳情
 *     tags: [Resources]
 *     description: 獲取特定資源評價的詳細信息。
 *     x-order: 4
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 資源ID
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 評價ID
 *     responses:
 *       200:
 *         description: 成功獲取評價詳情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     content:
 *                       type: string
 *                       example: "這個教程非常詳細，對初學者很友好"
 *                     rating:
 *                       type: number
 *                       example: 4.5
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 101
 *                         name:
 *                           type: string
 *                           example: "張三"
 */
router.get('/:resourceId/reviews/:reviewId', (req, res) => {
  const resourceId = parseInt(req.params.resourceId);
  const reviewId = parseInt(req.params.reviewId);
  
  res.json({
    success: true,
    data: {
      id: reviewId,
      content: "這個教程非常詳細，對初學者很友好",
      rating: 4.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: 101,
        name: "張三"
      }
    }
  });
});

/**
 * @swagger
 * /resources/{resourceId}/reviews:
 *   post:
 *     summary: 創建資源評價
 *     tags: [Resources]
 *     description: 為特定資源創建新的評價。
 *     x-order: 5
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 資源ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - rating
 *             properties:
 *               content:
 *                 type: string
 *                 example: "這個教程非常詳細，對初學者很友好"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4.5
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["初學者友好", "詳細"]
 *     responses:
 *       201:
 *         description: 評價創建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 3
 *                     content:
 *                       type: string
 *                       example: "這個教程非常詳細，對初學者很友好"
 *                     rating:
 *                       type: number
 *                       example: 4.5
 */
router.post('/:resourceId/reviews', (req, res) => {
  const resourceId = parseInt(req.params.resourceId);
  const { content, rating, tags } = req.body;
  
  res.status(201).json({
    success: true,
    data: {
      id: 3,
      content,
      rating,
      created_at: new Date().toISOString(),
      user: {
        id: 103,
        name: "王五"
      }
    }
  });
});

export default router;
