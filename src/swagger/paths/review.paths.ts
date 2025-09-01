/**
 * @swagger
 * /api/v1/reviews/stats:
 *   get:
 *     summary: 獲取用戶覆盤統計
 *     description: 取得當前用戶的覆盤統計資料，包含平均值和分佈情況
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 覆盤統計資料獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ReviewStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/reviews/projects/{projectId}:
 *   post:
 *     summary: 創建覆盤
 *     description: 在指定專案中創建新的學習覆盤記錄
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 專案 ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewCreateRequest'
 *     responses:
 *       201:
 *         description: 覆盤創建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     summary: 獲取專案的覆盤列表
 *     description: 取得指定專案的所有覆盤記錄
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 專案 ID
 *         example: 1
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *         description: 篩選特定週數
 *         example: 1
 *       - in: query
 *         name: mood
 *         schema:
 *           $ref: '#/components/schemas/MoodType'
 *         description: 篩選特定心情
 *       - in: query
 *         name: stressLevel
 *         schema:
 *           $ref: '#/components/schemas/StressLevel'
 *         description: 篩選特定壓力等級
 *     responses:
 *       200:
 *         description: 專案覆盤列表獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReviewResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/reviews/projects/{projectId}/{reviewId}:
 *   get:
 *     summary: 獲取覆盤詳情
 *     description: 取得指定覆盤的詳細資訊
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 專案 ID
 *         example: 1
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 覆盤 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 覆盤詳情獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ReviewResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     summary: 更新覆盤
 *     description: 修改指定覆盤的內容
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 專案 ID
 *         example: 1
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 覆盤 ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewUpdateRequest'
 *     responses:
 *       200:
 *         description: 覆盤更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     summary: 刪除覆盤
 *     description: 刪除指定的覆盤記錄
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 專案 ID
 *         example: 1
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 覆盤 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 覆盤刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export {};