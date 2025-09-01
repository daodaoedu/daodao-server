/**
 * @swagger
 * /api/v1/me/auth:
 *   get:
 *     tags: [Me]
 *     summary: 獲取當前用戶身份認證資訊
 *     description: 獲取當前登入用戶的身份認證資訊，包含基本資料、角色和權限
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取身份認證資訊
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
 *                     id:
 *                       type: integer
 *                       example: 123
 *                     _id:
 *                       type: string
 *                       example: "uuid-external-id"
 *                     name:
 *                       type: string
 *                       example: "張三"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     photoURL:
 *                       type: string
 *                       example: "https://example.com/photo.jpg"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     isTemporary:
 *                       type: boolean
 *                       example: false
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["read", "write"]
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                       example: [{"name": "user"}]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/me/users:
 *   get:
 *     tags: [Me]
 *     summary: 獲取當前用戶完整個人資料
 *     description: 獲取當前登入用戶的完整個人資料，包含聯絡方式、偏好設定等詳細資訊
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取用戶個人資料
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
 *                     id:
 *                       type: integer
 *                       example: 123
 *                     _id:
 *                       type: string
 *                       example: "uuid-external-id"
 *                     name:
 *                       type: string
 *                       example: "張三"
 *                     gender:
 *                       type: string
 *                       example: "male"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     photoURL:
 *                       type: string
 *                       example: "https://example.com/photo.jpg"
 *                     birthDay:
 *                       type: string
 *                       format: date
 *                       example: "1990-01-01"
 *                     isOpenLocation:
 *                       type: boolean
 *                       example: true
 *                     isOpenProfile:
 *                       type: boolean
 *                       example: true
 *                     role:
 *                       type: integer
 *                       example: 1
 *                     location:
 *                       type: string
 *                       example: "台北市"
 *                     tagList:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["程式設計", "學習"]
 *                     educationStage:
 *                       type: string
 *                       example: "university"
 *                     selfIntroduction:
 *                       type: string
 *                       example: "我是一名軟體工程師..."
 *                     contactList:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                         instagram:
 *                           type: string
 *                         discord:
 *                           type: string
 *                         line:
 *                           type: string
 *                         facebook:
 *                           type: string
 *                     createdDate:
 *                       type: string
 *                       format: date-time
 *                     updatedDate:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/me/practices:
 *   get:
 *     tags: [Me]
 *     summary: 獲取我的實踐記錄
 *     description: 獲取當前登入用戶的實踐記錄列表，支援分頁、篩選和排序
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, completed, archived]
 *         description: 實踐狀態篩選
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [book, video, articles, podcast, course, custom]
 *         description: 內容類型篩選
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, progress]
 *           default: createdAt
 *         description: 排序欄位
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: 開始日期篩選 (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: 結束日期篩選 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 成功獲取我的實踐記錄列表
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
 *                     $ref: '#/components/schemas/MyPracticeItem'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/me/practice-stats:
 *   get:
 *     tags: [Me]
 *     summary: 獲取我的實踐統計
 *     description: 獲取當前登入用戶的實踐統計資料，包含總數、進度、成就等
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: 統計時間範圍
 *       - in: query
 *         name: includeArchived
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含已封存的實踐
 *     responses:
 *       200:
 *         description: 成功獲取我的實踐統計
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PracticeStatsData'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/me/resources:
 *   get:
 *     tags: [Me]
 *     summary: 獲取我的個人資源草稿
 *     description: 獲取當前登入用戶的個人資源草稿，支援分頁、篩選和排序
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
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: 分類篩選
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [link, file, note, draft]
 *         description: 資源類型篩選
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *           default: draft
 *         description: 資源狀態篩選
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name]
 *           default: updatedAt
 *         description: 排序欄位
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 標籤篩選（逗號分隔）
 *     responses:
 *       200:
 *         description: 成功獲取我的個人資源列表
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
 *                     $ref: '#/components/schemas/MyResourceItem'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalResources:
 *                       type: integer
 *                       example: 45
 *                     draftCount:
 *                       type: integer
 *                       example: 32
 *                     publishedCount:
 *                       type: integer
 *                       example: 13
 *                     byCategory:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/me/preferences:
 *   get:
 *     tags: [Me]
 *     summary: 獲取我的個人偏好設定
 *     description: 獲取當前登入用戶的個人偏好設定
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: 偏好類型篩選
 *       - in: query
 *         name: includeSystem
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含系統偏好設定
 *     responses:
 *       200:
 *         description: 成功獲取我的個人偏好設定
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
 *                     preferences:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserPreference'
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             $ref: '#/components/schemas/PreferenceType'
 *                           userSelections:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 optionId:
 *                                   type: integer
 *                                 isSelected:
 *                                   type: boolean
 *                                 weight:
 *                                   type: number
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalPreferences:
 *                       type: integer
 *                       example: 15
 *                     activeSelections:
 *                       type: integer
 *                       example: 12
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     tags: [Me]
 *     summary: 更新我的個人偏好設定
 *     description: 更新當前登入用戶的個人偏好設定
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferences
 *             properties:
 *               preferences:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required:
 *                     - preferenceTypeId
 *                     - optionId
 *                     - isSelected
 *                   properties:
 *                     preferenceTypeId:
 *                       type: integer
 *                       minimum: 1
 *                       description: 偏好類型 ID
 *                     optionId:
 *                       type: integer
 *                       minimum: 1
 *                       description: 偏好選項 ID
 *                     isSelected:
 *                       type: boolean
 *                       description: 是否選中此偏好
 *                     weight:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 10
 *                       default: 1.0
 *                       description: 偏好權重
 *           example:
 *             preferences:
 *               - preferenceTypeId: 1
 *                 optionId: 3
 *                 isSelected: true
 *                 weight: 2.5
 *               - preferenceTypeId: 2
 *                 optionId: 7
 *                 isSelected: false
 *     responses:
 *       200:
 *         description: 成功更新我的個人偏好設定
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
 *                     updated:
 *                       type: integer
 *                       example: 3
 *                     created:
 *                       type: integer
 *                       example: 2
 *                     deleted:
 *                       type: integer
 *                       example: 1
 *                 message:
 *                   type: string
 *                   example: "偏好設定已更新：新增 2 項，更新 3 項，刪除 1 項"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * @swagger
 * /api/v1/me/ideas:
 *   get:
 *     tags: [Me]
 *     summary: 獲取我的想法列表
 *     description: 獲取當前登入用戶的想法列表，支援分頁、篩選和排序
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
 *         name: query
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 標籤篩選（逗號分隔）
 *         example: "javascript,react"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, draft, archived, all]
 *         description: 狀態篩選
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, likeCount]
 *           default: createdAt
 *         description: 排序欄位
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 成功獲取我的想法列表
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Idea'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         totalPages:
 *                           type: integer
 *                           example: 2
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalIdeas:
 *                           type: integer
 *                           example: 25
 *                         activeIdeas:
 *                           type: integer
 *                           example: 20
 *                         draftIdeas:
 *                           type: integer
 *                           example: 3
 *                         archivedIdeas:
 *                           type: integer
 *                           example: 2
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */