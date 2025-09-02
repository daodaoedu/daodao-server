/**
 * @swagger
 * /api/v1/resources:
 *   get:
 *     summary: 獲取資源列表
 *     tags: [Resources]
 *     parameters:
 *       - $ref: '#/components/parameters/cursorParam'
 *       - $ref: '#/components/parameters/resourceLimitParam'
 *       - $ref: '#/components/parameters/sortParam'
 *       - $ref: '#/components/parameters/orderParam'
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/ResourceType'
 *         description: 資源類型篩選
 *       - in: query
 *         name: level
 *         schema:
 *           $ref: '#/components/schemas/LevelType'
 *         description: 難度等級篩選
 *       - in: query
 *         name: cost
 *         schema:
 *           $ref: '#/components/schemas/CostType'
 *         description: 費用類型篩選
 *       - in: query
 *         name: majorCategory
 *         schema:
 *           type: string
 *         description: 主分類篩選
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *         description: 子分類篩選
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 標籤篩選 (多個標籤用逗號分隔)
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: 搜索關鍵詞
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *         description: 最小評分篩選
 *       - in: query
 *         name: maxScore
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *         description: 最大評分篩選
 *     responses:
 *       200:
 *         description: 成功獲取資源列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceListResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   post:
 *     summary: 創建新資源
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateResourceDto'
 *     responses:
 *       201:
 *         description: 資源創建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/resources/stats:
 *   get:
 *     summary: 獲取資源統計資訊
 *     description: 獲取資源的整體統計資訊，包括總數、分類統計等
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: 成功獲取資源統計
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
 *                     totalResources:
 *                       type: integer
 *                       description: 資源總數
 *                     resourcesByType:
 *                       type: object
 *                       description: 按類型分類的資源數量
 *                     resourcesByLevel:
 *                       type: object
 *                       description: 按難度分類的資源數量
 *                     resourcesByCost:
 *                       type: object
 *                       description: 按費用分類的資源數量
 *                     recentResources:
 *                       type: integer
 *                       description: 最近新增的資源數量
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/resources/{id}:
 *   get:
 *     summary: 獲取單個資源詳情
 *     tags: [Resources]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: 成功獲取資源詳情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   patch:
 *     summary: 更新資源資訊
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateResourceDto'
 *     responses:
 *       200:
 *         description: 資源更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   delete:
 *     summary: 刪除資源
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: 資源刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/resources/{id}/status:
 *   patch:
 *     summary: 更新資源狀態
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateResourceStatusDto'
 *     responses:
 *       200:
 *         description: 資源狀態更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/resources/{id}/tags:
 *   get:
 *     summary: 獲取資源的標籤列表
 *     tags: [Resources]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: 成功獲取資源標籤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EntityTagsResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */