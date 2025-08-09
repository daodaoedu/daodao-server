/**
 * @swagger
 * /api/v1/ideas:
 *   get:
 *     tags: [Ideas]
 *     summary: 獲取想法列表
 *     description: 獲取想法列表，支援分頁、篩選和排序
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
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用戶ID篩選
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
 *         description: 成功獲取想法列表
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
 *                           example: 100
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     tags: [Ideas]
 *     summary: 創建新想法
 *     description: 創建一個新的想法，可選擇關聯資源
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 description: 想法內容
 *                 example: 這是一個關於學習React的想法...
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   minLength: 1
 *                   maxLength: 50
 *                 maxItems: 10
 *                 description: 標籤列表
 *                 example: ["react", "javascript", "frontend"]
 *               resources:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - url
 *                   properties:
 *                     name:
 *                       type: string
 *                       minLength: 1
 *                       maxLength: 255
 *                       description: 資源名稱
 *                       example: React 官方文檔
 *                     url:
 *                       type: string
 *                       format: uri
 *                       pattern: ^https://
 *                       description: 資源連結（必須為HTTPS）
 *                       example: https://react.dev
 *                     description:
 *                       type: string
 *                       description: 資源描述
 *                       example: React官方文檔和教程
 *                 maxItems: 5
 *                 description: 相關資源列表
 *     responses:
 *       201:
 *         description: 想法創建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Idea'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/ideas/{id}:
 *   get:
 *     tags: [Ideas]
 *     summary: 獲取想法詳情
 *     description: 根據ID獲取特定想法的詳細資訊
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 想法ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: 成功獲取想法詳情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Idea'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   patch:
 *     tags: [Ideas]
 *     summary: 更新想法
 *     description: 更新指定的想法（僅作者可更新）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 想法ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 description: 想法內容
 *                 example: 更新後的想法內容...
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   minLength: 1
 *                   maxLength: 50
 *                 maxItems: 10
 *                 description: 標籤列表
 *                 example: ["react", "typescript"]
 *               resources:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - url
 *                   properties:
 *                     name:
 *                       type: string
 *                       minLength: 1
 *                       maxLength: 255
 *                       description: 資源名稱
 *                     url:
 *                       type: string
 *                       format: uri
 *                       pattern: ^https://
 *                       description: 資源連結（必須為HTTPS）
 *                     description:
 *                       type: string
 *                       description: 資源描述
 *                 maxItems: 5
 *                 description: 相關資源列表
 *               status:
 *                 type: string
 *                 enum: [active, draft, archived]
 *                 description: 想法狀態
 *                 example: active
 *     responses:
 *       200:
 *         description: 想法更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Idea'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     tags: [Ideas]
 *     summary: 刪除想法
 *     description: 軟刪除指定的想法（僅作者可刪除）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 想法ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: 想法刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 想法已成功刪除
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */