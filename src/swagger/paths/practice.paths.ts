/**
 * Practice API Swagger Paths
 * 
 * Defines all API endpoints for practice-related operations including:
 * - CRUD operations for practices
 * - Check-in management
 * - User statistics and analytics
 * - Interaction tracking (likes, favorites, shares, views)
 */

/**
 * @swagger
 * /api/v1/practices:
 *   get:
 *     summary: 取得實踐列表
 *     description: 取得實踐列表，支援搜尋、篩選、分頁和排序功能
 *     tags: [Practice]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字（搜尋標題和實踐行動）
 *       - in: query
 *         name: contentType
 *         schema:
 *           $ref: '#/components/schemas/ContentType'
 *         description: 內容類型篩選
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/PracticeStatus'
 *         description: 狀態篩選
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: 使用者 ID 篩選
 *       - in: query
 *         name: sortBy
 *         schema:
 *           $ref: '#/components/schemas/SortField'
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           $ref: '#/components/schemas/SortOrder'
 *         description: 排序順序
 *     responses:
 *       '200':
 *         description: 成功取得實踐列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticeListResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   post:
 *     summary: 創建新實踐
 *     description: 創建新的實踐項目
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePracticeRequest'
 *     responses:
 *       '201':
 *         description: 成功創建實踐
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticeDetailResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/me:
 *   get:
 *     summary: 取得我的實踐列表
 *     description: 取得目前使用者的實踐列表
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
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
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: contentType
 *         schema:
 *           $ref: '#/components/schemas/ContentType'
 *         description: 內容類型篩選
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/PracticeStatus'
 *         description: 狀態篩選
 *       - in: query
 *         name: sortBy
 *         schema:
 *           $ref: '#/components/schemas/SortField'
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           $ref: '#/components/schemas/SortOrder'
 *         description: 排序順序
 *     responses:
 *       '200':
 *         description: 成功取得我的實踐列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticeListResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/stats:
 *   get:
 *     summary: 取得實踐統計
 *     description: 取得使用者的實踐統計資料
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: 使用者 ID（預設為目前使用者）
 *     responses:
 *       '200':
 *         description: 成功取得統計資料
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticeStatsResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/{id}:
 *   get:
 *     summary: 取得實踐詳情
 *     description: 取得特定實踐的詳細資訊
 *     tags: [Practice]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     responses:
 *       '200':
 *         description: 成功取得實踐詳情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticeDetailResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   put:
 *     summary: 更新實踐
 *     description: 更新實踐資訊（僅實踐擁有者可操作）
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePracticeRequest'
 *     responses:
 *       '200':
 *         description: 成功更新實踐
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticeDetailResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   delete:
 *     summary: 刪除實踐
 *     description: 軟刪除實踐（狀態改為 archived）
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     responses:
 *       '200':
 *         description: 成功刪除實踐
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                           example: true
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/{id}/checkins:
 *   post:
 *     summary: 創建簽到記錄
 *     description: 為特定實踐創建新的簽到記錄
 *     tags: [Practice Check-ins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCheckInRequest'
 *     responses:
 *       '201':
 *         description: 成功創建簽到記錄
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CheckInEntity'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '409':
 *         description: 今日已簽到
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   get:
 *     summary: 取得簽到記錄列表
 *     description: 取得特定實踐的簽到記錄列表
 *     tags: [Practice Check-ins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 結束日期
 *       - in: query
 *         name: mood
 *         schema:
 *           $ref: '#/components/schemas/CheckInMood'
 *         description: 心情篩選
 *     responses:
 *       '200':
 *         description: 成功取得簽到記錄列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckInListResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/{id}/checkins/stats:
 *   get:
 *     summary: 取得簽到統計
 *     description: 取得特定實踐的簽到統計資料
 *     tags: [Practice Check-ins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     responses:
 *       '200':
 *         description: 成功取得簽到統計
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalCheckIns:
 *                           type: integer
 *                           example: 30
 *                         currentStreak:
 *                           type: integer
 *                           example: 7
 *                         maxStreak:
 *                           type: integer
 *                           example: 15
 *                         averageProgress:
 *                           type: number
 *                           example: 8.5
 *                         totalProgress:
 *                           type: integer
 *                           example: 255
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/{id}/checkins/calendar/{year}/{month}:
 *   get:
 *     summary: 取得月度簽到日曆
 *     description: 取得特定實踐在指定年月的簽到日曆資料
 *     tags: [Practice Check-ins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *         description: 年份
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: 月份
 *     responses:
 *       '200':
 *         description: 成功取得月度簽到日曆
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         year:
 *                           type: integer
 *                           example: 2024
 *                         month:
 *                           type: integer
 *                           example: 1
 *                         calendar:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date
 *                                 example: '2024-01-15'
 *                               hasCheckIn:
 *                                 type: boolean
 *                                 example: true
 *                               progress:
 *                                 type: integer
 *                                 example: 10
 *                               mood:
 *                                 $ref: '#/components/schemas/CheckInMood'
 *                               streakDay:
 *                                 type: integer
 *                                 example: 7
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/{id}/like:
 *   post:
 *     summary: 點讚/取消點讚
 *     description: 切換實踐的點讚狀態
 *     tags: [Practice Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     responses:
 *       '200':
 *         description: 成功切換點讚狀態
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isLiked:
 *                           type: boolean
 *                           example: true
 *                         likeCount:
 *                           type: integer
 *                           example: 26
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/{id}/favorite:
 *   post:
 *     summary: 收藏/取消收藏
 *     description: 切換實踐的收藏狀態
 *     tags: [Practice Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     responses:
 *       '200':
 *         description: 成功切換收藏狀態
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isFavorited:
 *                           type: boolean
 *                           example: true
 *                         favoriteCount:
 *                           type: integer
 *                           example: 9
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/{id}/share:
 *   post:
 *     summary: 記錄分享事件
 *     description: 記錄實踐分享事件，用於統計分享數據
 *     tags: [Practice Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShareEventRequest'
 *     responses:
 *       '200':
 *         description: 成功記錄分享事件
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                           example: true
 *                         shareCount:
 *                           type: integer
 *                           example: 6
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/{id}/view:
 *   post:
 *     summary: 記錄瀏覽事件
 *     description: 記錄實踐瀏覽事件，用於統計瀏覽數據
 *     tags: [Practice Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ViewEventRequest'
 *     responses:
 *       '200':
 *         description: 成功記錄瀏覽事件
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                           example: true
 *                         viewCount:
 *                           type: integer
 *                           example: 151
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/{id}/stats:
 *   get:
 *     summary: 取得互動統計
 *     description: 取得特定實踐的互動統計資料（點讚、收藏、分享、瀏覽）
 *     tags: [Practice Interactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     responses:
 *       '200':
 *         description: 成功取得互動統計
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/InteractionStatsResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/practices/{id}/user-status:
 *   get:
 *     summary: 取得使用者互動狀態
 *     description: 取得目前使用者對特定實踐的互動狀態（是否已點讚、收藏、瀏覽等）
 *     tags: [Practice Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 實踐 ID
 *     responses:
 *       '200':
 *         description: 成功取得使用者互動狀態
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/InteractionStatusResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */