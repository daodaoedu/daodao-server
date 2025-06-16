/**
 * @swagger
 * /resources:
 *   get:
 *     summary: 獲取資源列表
 *     tags: [Resources]
 *     parameters:
 *       - $ref: '#/components/parameters/cursorParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/sortFieldParam'
 *       - $ref: '#/components/parameters/sortDirectionParam'
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
 *         name: majorCategoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 主分類 ID 篩選
 *       - in: query
 *         name: subCategoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 子分類 ID 篩選
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 標籤篩選 (多個標籤用逗號分隔)
 *         example: "JavaScript,前端開發"
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
 *         $ref: '#/components/responses/BadRequest'
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
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /resources/{id}:
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
 *         $ref: '#/components/responses/BadRequest'
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
 * /resources/{id}/status:
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
 * /resources/{id}/tags:
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
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */