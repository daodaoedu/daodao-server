/**
 * @swagger
 * /api/v1/resources/{resourceId}/reviews:
 *   get:
 *     summary: 獲取資源的評論列表
 *     tags: [Resource Reviews]
 *     parameters:
 *       - $ref: '#/components/parameters/resourceIdParam'
 *       - $ref: '#/components/parameters/cursorParam'
 *       - $ref: '#/components/parameters/reviewLimitParam'
 *       - $ref: '#/components/parameters/sortParam'
 *       - $ref: '#/components/parameters/orderParam'
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ReviewStatus'
 *         description: 評論狀態篩選
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *         description: 最小整體評分篩選
 *       - in: query
 *         name: maxScore
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *         description: 最大整體評分篩選
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 標籤篩選 (多個標籤用逗號分隔)
 *         example: "實用,清晰易懂"
 *     responses:
 *       200:
 *         description: 成功獲取評論列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceReviewListResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   post:
 *     summary: 為資源創建新評論
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/resourceIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateResourceReviewDto'
 *     responses:
 *       201:
 *         description: 評論創建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceReviewResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/resources/{resourceId}/reviews/{reviewId}:
 *   get:
 *     summary: 獲取特定資源的特定心得評價詳情
 *     tags: [Resource Reviews]
 *     parameters:
 *       - $ref: '#/components/parameters/resourceIdParam'
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 心得評價的唯一識別碼
 *     responses:
 *       200:
 *         description: 成功獲取心得評價詳情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceReviewResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *  
 *   patch:
 *     summary: 更新資源的特定評論資訊
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/resourceIdParam'
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 心得評價的唯一識別碼
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateResourceReviewDto'
 *     responses:
 *       200:
 *         description: 評論更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceReviewResponse'
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
 *   
 *   delete:
 *     summary: 刪除資源的特定評論
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/resourceIdParam'
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 心得評價的唯一識別碼
 *     responses:
 *       200:
 *         description: 評論刪除成功
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
 * 
 * /api/v1/resources/{resourceId}/reviews/{reviewId}/status:
 *   patch:
 *     summary: 更新資源評論的狀態
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/resourceIdParam'
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 心得評價的唯一識別碼
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReviewStatusDto'
 *     responses:
 *       200:
 *         description: 評論狀態更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceReviewResponse'
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
 * 
 * /api/v1/resources/{resourceId}/reviews/{reviewId}/like:
 *   post:
 *     summary: 對資源評論點讚
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/resourceIdParam'
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 心得評價的唯一識別碼
 *     responses:
 *       200:
 *         description: 點讚成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   delete:
 *     summary: 取消對資源評論的點讚
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/resourceIdParam'
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 心得評價的唯一識別碼
 *     responses:
 *       200:
 *         description: 取消點讚成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */