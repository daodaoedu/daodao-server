/**
 * @swagger
 * /api/v1/tags/popular:
 *   get:
 *     summary: 獲取熱門標籤
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           $ref: '#/components/schemas/EntityType'
 *         description: 實體類型篩選
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 返回的標籤數量限制
 *     responses:
 *       200:
 *         description: 成功獲取熱門標籤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PopularTagsResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/tags/search:
 *   get:
 *     summary: 搜索標籤
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: 搜索關鍵詞
 *         example: "JavaScript"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 返回的標籤數量限制
 *     responses:
 *       200:
 *         description: 成功搜索標籤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TagSearchResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/tags/stats:
 *   get:
 *     summary: 獲取標籤統計
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: 成功獲取標籤統計
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TagStatsResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/tags/entities:
 *   get:
 *     summary: 獲取特定實體的標籤
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: entityId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 實體 ID
 *         example: 1
 *       - in: query
 *         name: entityType
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/EntityType'
 *         description: 實體類型
 *     responses:
 *       200:
 *         description: 成功獲取實體標籤
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
 *   
 *   post:
 *     summary: 為特定實體添加標籤
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEntityTagDto'
 *     responses:
 *       201:
 *         description: 標籤添加成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TagResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   delete:
 *     summary: 為特定實體移除標籤
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveEntityTagDto'
 *     responses:
 *       200:
 *         description: 標籤移除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */