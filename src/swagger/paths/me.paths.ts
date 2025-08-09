/**
 * @swagger
 * /api/v1/me/ideas:
 *   get:
 *     tags: [Me]
 *     summary: 獲取我的想法列表
 *     description: 獲取當前登入用戶的想法列表，支援分頁、篩選和排序
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 每頁數量
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 標籤篩選（逗號分隔）
 *         example: "javascript,react"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, draft, archived, all]
 *         description: 狀態篩選
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, likeCount]
 *           default: createdAt
 *         description: 排序欄位
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 成功獲取我的想法列表
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Idea'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         totalPages:
 *                           type: integer
 *                           example: 2
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalIdeas:
 *                           type: integer
 *                           example: 25
 *                         activeIdeas:
 *                           type: integer
 *                           example: 20
 *                         draftIdeas:
 *                           type: integer
 *                           example: 3
 *                         archivedIdeas:
 *                           type: integer
 *                           example: 2
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */