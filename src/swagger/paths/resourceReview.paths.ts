/**
 * @swagger
 * /resources/{resourceId}/reviews:
 *   get:
 *     summary: 獲取資源的評論列表
 *     tags: [Resource Reviews]
 *     parameters:
 *       - $ref: '#/components/parameters/resourceIdParam'
 *       - $ref: '#/components/parameters/cursorParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/sortFieldParam'
 *       - $ref: '#/components/parameters/sortDirectionParam'
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
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /resources/{resourceId}/reviews/{reviewId}:
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
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /reviews:
 *   get:
 *     summary: 獲取所有評論列表
 *     tags: [Resource Reviews]
 *     parameters:
 *       - $ref: '#/components/parameters/cursorParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/sortFieldParam'
 *       - $ref: '#/components/parameters/sortDirectionParam'
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ReviewStatus'
 *         description: 評論狀態篩選
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 資源 ID 篩選
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 用戶 ID 篩選
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
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   post:
 *     summary: 創建新評論
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateResourceReviewDto'
 *               - type: object
 *                 required:
 *                   - resourceId
 *                 properties:
 *                   resourceId:
 *                     type: integer
 *                     minimum: 1
 *                     description: 資源 ID
 *                     example: 1
 *     responses:
 *       201:
 *         description: 評論創建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceReviewResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /reviews/{id}:
 *   get:
 *     summary: 獲取單個評論詳情
 *     tags: [Resource Reviews]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: 成功獲取評論詳情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceReviewResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   patch:
 *     summary: 更新評論資訊
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
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
 *     summary: 刪除評論
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: 評論刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /reviews/{id}/status:
 *   patch:
 *     summary: 更新評論狀態
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
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
 * /reviews/{id}/like:
 *   post:
 *     summary: 對評論點讚
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: 點讚成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   delete:
 *     summary: 取消對評論的點讚
 *     tags: [Resource Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: 取消點讚成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */