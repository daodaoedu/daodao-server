/**
 * @swagger
 * /api/v1/outcomes/public:
 *   get:
 *     summary: 獲取公開成果列表
 *     description: 取得所有公開的成果，支援分頁和篩選
 *     tags: [Outcomes]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/pageSizeParam'
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *         description: 篩選特定週數的成果
 *         example: 1
 *     responses:
 *       200:
 *         description: 公開成果列表獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedOutcomesResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/outcomes/my:
 *   get:
 *     summary: 獲取用戶的成果列表
 *     description: 取得當前登入用戶的所有成果
 *     tags: [Outcomes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用戶成果列表獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OutcomeResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/outcomes/projects/{projectId}:
 *   post:
 *     summary: 創建成果
 *     description: 在指定專案中創建新的成果
 *     tags: [Outcomes]
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
 *             $ref: '#/components/schemas/OutcomeCreateRequest'
 *     responses:
 *       201:
 *         description: 成果創建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/OutcomeResponse'
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
 *     summary: 獲取專案的成果列表
 *     description: 取得指定專案的所有成果
 *     tags: [Outcomes]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 專案 ID
 *         example: 1
 *       - in: query
 *         name: visibility
 *         schema:
 *           $ref: '#/components/schemas/Visibility'
 *         description: 篩選可見性
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *         description: 篩選特定週數
 *         example: 1
 *     responses:
 *       200:
 *         description: 專案成果列表獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OutcomeResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/outcomes/projects/{projectId}/{outcomeId}:
 *   get:
 *     summary: 獲取成果詳情
 *     description: 取得指定成果的詳細資訊
 *     tags: [Outcomes]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 專案 ID
 *         example: 1
 *       - in: path
 *         name: outcomeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 成果 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 成果詳情獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/OutcomeResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     summary: 更新成果
 *     description: 修改指定成果的內容
 *     tags: [Outcomes]
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
 *         name: outcomeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 成果 ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OutcomeUpdateRequest'
 *     responses:
 *       200:
 *         description: 成果更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/OutcomeResponse'
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
 *     summary: 刪除成果
 *     description: 刪除指定的成果
 *     tags: [Outcomes]
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
 *         name: outcomeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 成果 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 成果刪除成功
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