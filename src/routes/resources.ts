/**
 * 資源路由測試端點
 */

import express from 'express';
const router = express.Router();

/**
 * @swagger
 * /resources:
 *   get:
 *     summary: 獲取資源
 *     tags: [Resources]
 *     description: 獲取所有資源，支持分頁和篩選。
 *     x-order: 1
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每頁返回的記錄數
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: 游標，用於游標分頁
 *     responses:
 *       200:
 *         description: 成功獲取資源
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
 *                     resources:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "JavaScript 完整教程"
 *                           type:
 *                             type: string
 *                             example: "video_content"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         next_cursor:
 *                           type: string
 *                           nullable: true
 *                         has_more:
 *                           type: boolean
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      resources: [
        {
          id: 1,
          name: 'JavaScript 完整教程',
          type: 'video_content',
          description: '從零開始學習 JavaScript 的完整教程',
          cost: 'free',
          level: 'beginner'
        },
        {
          id: 2,
          name: 'React 實戰指南',
          type: 'books_articles',
          description: '詳細講解 React 開發的實用指南',
          cost: 'paid',
          level: 'intermediate'
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
 * /resources/{id}:
 *   get:
 *     summary: 獲取資源詳情
 *     tags: [Resources]
 *     description: 獲取特定資源的詳細信息。
 *     x-order: 2
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 資源ID
 *     responses:
 *       200:
 *         description: 成功獲取資源詳情
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
 *                     name:
 *                       type: string
 *                       example: "JavaScript 完整教程"
 *                     description:
 *                       type: string
 *                       example: "從零開始學習 JavaScript 的完整教程"
 */
router.get('/:id', (req, res) => {
  const resourceId = parseInt(req.params.id);
  
  // 這裡簡單模擬返回資源詳情
  const resource = {
    id: resourceId,
    name: 'JavaScript 完整教程',
    description: '從零開始學習 JavaScript 的完整教程',
    type: 'video_content',
    cost: 'free',
    level: 'beginner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: resource
  });
});

export default router;
