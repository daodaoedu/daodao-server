/**
 * @swagger
 * /api/v1/notes/public:
 *   get:
 *     summary: 獲取公開便利貼列表
 *     description: 取得所有公開的便利貼，支援分頁和篩選
 *     tags: [Notes]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/pageSizeParam'
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *         description: 篩選特定週數的便利貼
 *         example: 1
 *     responses:
 *       200:
 *         description: 公開便利貼列表獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedNotesResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/notes/my:
 *   get:
 *     summary: 獲取用戶的便利貼列表
 *     description: 取得當前登入用戶的所有便利貼
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用戶便利貼列表獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NoteResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/notes/projects/{projectId}:
 *   post:
 *     summary: 創建便利貼
 *     description: 在指定專案中創建新的便利貼
 *     tags: [Notes]
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
 *             $ref: '#/components/schemas/NoteCreateRequest'
 *     responses:
 *       201:
 *         description: 便利貼創建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/NoteResponse'
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
 *     summary: 獲取專案的便利貼列表
 *     description: 取得指定專案的所有便利貼
 *     tags: [Notes]
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
 *         description: 專案便利貼列表獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NoteResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/notes/projects/{projectId}/{noteId}:
 *   get:
 *     summary: 獲取便利貼詳情
 *     description: 取得指定便利貼的詳細資訊
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 專案 ID
 *         example: 1
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 便利貼 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 便利貼詳情獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/NoteResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     summary: 更新便利貼
 *     description: 修改指定便利貼的內容
 *     tags: [Notes]
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
 *         name: noteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 便利貼 ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoteUpdateRequest'
 *     responses:
 *       200:
 *         description: 便利貼更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/NoteResponse'
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
 *     summary: 刪除便利貼
 *     description: 刪除指定的便利貼
 *     tags: [Notes]
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
 *         name: noteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 便利貼 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 便利貼刪除成功
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