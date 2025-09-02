/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: 獲取用戶列表
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每頁數量
 *       - in: query
 *         name: educationStage
 *         schema:
 *           type: string
 *           enum: [university, high, other]
 *         description: 教育階段過濾 (多個用逗號分隔)
 *       - in: query
 *         name: roleList
 *         schema:
 *           type: string
 *         description: 角色列表過濾 (多個用逗號分隔)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: 地區過濾 (多個用逗號分隔)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索關鍵字
 *     responses:
 *       200:
 *         description: 成功獲取用戶列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FormattedUser'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   post:
 *     summary: 創建新用戶
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: 用戶創建成功
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
 *                     user:
 *                       $ref: '#/components/schemas/FormattedUser'
 *                     token:
 *                       type: string
 *                       description: 新的 JWT token
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: 獲取當前用戶資訊
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取當前用戶資訊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FormattedUser'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   delete:
 *     summary: 刪除當前用戶
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用戶刪除成功
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
 *                     message:
 *                       type: string
 *                       example: "用戶已成功刪除"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/v1/users/me/preferences:
 *   get:
 *     summary: 獲取當前用戶的偏好設定
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取用戶偏好設定
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserPreferences'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   put:
 *     summary: 更新當前用戶的偏好設定
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferencesRequest'
 *     responses:
 *       200:
 *         description: 偏好設定更新成功
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
 *                     message:
 *                       type: string
 *                       example: "偏好設定已成功更新"
 *                     preferences:
 *                       $ref: '#/components/schemas/UserPreferences'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/v1/users/preferences/available:
 *   get:
 *     summary: 獲取所有可用的偏好選項
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 成功獲取可用偏好選項
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AvailablePreferences'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/v1/users/me/custom-id:
 *   post:
 *     summary: 設置當前用戶的自訂 ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomIdRequest'
 *     responses:
 *       200:
 *         description: 自訂 ID 設置成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CustomIdSetResponse'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   delete:
 *     summary: 移除當前用戶的自訂 ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 自訂 ID 移除成功
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
 *                     message:
 *                       type: string
 *                       example: "自訂 ID 已成功移除"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/v1/users/custom-id/check/{customId}:
 *   get:
 *     summary: 檢查自訂 ID 可用性
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: customId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9_-]{3,50}$'
 *         description: 要檢查的自訂 ID
 *     responses:
 *       200:
 *         description: 成功檢查自訂 ID 可用性
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CustomIdAvailabilityResponse'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/v1/users/custom-id/{customId}:
 *   get:
 *     summary: 透過自訂 ID 獲取用戶資訊
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: customId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶自訂 ID
 *     responses:
 *       200:
 *         description: 成功獲取用戶資訊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FormattedUser'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: 獲取指定用戶資訊
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 用戶 external_id
 *     responses:
 *       200:
 *         description: 成功獲取用戶資訊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FormattedUser'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   put:
 *     summary: 更新用戶資訊
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 用戶 external_id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: 用戶更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/FormattedUser'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   delete:
 *     summary: 刪除指定用戶（管理員功能）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用戶 ID
 *     responses:
 *       200:
 *         description: 用戶刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */