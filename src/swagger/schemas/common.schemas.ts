/**
 * @swagger
 * components:
 *   schemas:
 *     ApiErrorResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *         - error
 *         - timestamp
 *       properties:
 *         success:
 *           type: boolean
 *           description: 請求是否成功
 *           example: false
 *         data:
 *           type: "null"
 *           description: 錯誤時資料為 null
 *           example: null
 *         error:
 *           type: object
 *           required:
 *             - code
 *             - message
 *           properties:
 *             code:
 *               type: string
 *               description: 錯誤代碼
 *               example: "INVALID_REQUEST"
 *             message:
 *               type: string
 *               description: 錯誤訊息
 *               example: "請求參數錯誤"
 *             details:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *               description: 詳細錯誤資訊
 *               example: { "field": "email", "reason": "格式不正確" }
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: 時間戳
 *           example: "2024-01-15T10:30:00Z"
 *         meta:
 *           $ref: '#/components/schemas/ResponseMeta'
 *           nullable: true
 * 
 *     ApiSuccessResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *         - timestamp
 *       properties:
 *         success:
 *           type: boolean
 *           description: 請求是否成功
 *           example: true
 *         data:
 *           description: 成功時的資料內容
 *           example: { "id": 1, "name": "範例資料" }
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: 時間戳
 *           example: "2024-01-15T10:30:00Z"
 *         meta:
 *           $ref: '#/components/schemas/ResponseMeta'
 *           nullable: true

 *     PaginationInfo:
 *       type: object
 *       required:
 *         - currentPage
 *         - totalPages
 *         - totalItems
 *         - itemsPerPage
 *         - hasNext
 *         - hasPrev
 *       properties:
 *         currentPage:
 *           type: integer
 *           minimum: 1
 *           description: 目前頁碼
 *           example: 2
 *         totalPages:
 *           type: integer
 *           minimum: 0
 *           description: 總頁數
 *           example: 10
 *         totalItems:
 *           type: integer
 *           minimum: 0
 *           description: 總項目數
 *           example: 150
 *         itemsPerPage:
 *           type: integer
 *           minimum: 1
 *           description: 每頁項目數
 *           example: 20
 *         hasNext:
 *           type: boolean
 *           description: 是否有下一頁
 *           example: true
 *         hasPrev:
 *           type: boolean
 *           description: 是否有上一頁
 *           example: true

 *     CursorPaginationInfo:
 *       type: object
 *       required:
 *         - cursors
 *         - hasMore
 *         - count
 *       properties:
 *         cursors:
 *           type: object
 *           required:
 *             - start
 *             - end
 *           properties:
 *             start:
 *               type: string
 *               nullable: true
 *               description: 開始游標
 *               example: "eyJpZCI6MTAwfQ=="
 *             end:
 *               type: string
 *               nullable: true
 *               description: 結束游標
 *               example: "eyJpZCI6MTIwfQ=="
 *         hasMore:
 *           type: boolean
 *           description: 是否有更多數據
 *           example: true
 *         count:
 *           type: integer
 *           minimum: 0
 *           description: 本次返回的項目數
 *           example: 20

 *     ResponseMeta:
 *       type: object
 *       properties:
 *         searchQuery:
 *           type: string
 *           description: 搜尋查詢
 *           example: "JavaScript"
 *         searchTime:
 *           type: number
 *           description: 搜尋耗時（毫秒）
 *           example: 45
 *         filters:
 *           type: object
 *           additionalProperties: true
 *           description: 應用的篩選條件
 *           example: { "category": "tech", "status": "active" }
 *         categoryCounts:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: 分類統計
 *           example: { "tech": 50, "design": 30 }
 *         aggregateData:
 *           type: object
 *           additionalProperties: true
 *           description: 聚合資料
 *         requestId:
 *           type: string
 *           description: 請求 ID
 *           example: "req-12345"
 *         cacheHit:
 *           type: boolean
 *           description: 是否命中快取
 *           example: true
 *         processingTime:
 *           type: number
 *           description: 處理時間（毫秒）
 *           example: 123

 *     PaginatedApiResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *         - pagination
 *         - timestamp
 *       properties:
 *         success:
 *           type: boolean
 *           description: 請求是否成功
 *           example: true
 *         data:
 *           type: array
 *           description: 分頁資料陣列
 *           items: {}
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: 時間戳
 *           example: "2024-01-15T10:30:00Z"
 *         meta:
 *           $ref: '#/components/schemas/ResponseMeta'
 *           nullable: true

 *     CursorPaginatedApiResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *         - pagination
 *         - timestamp
 *       properties:
 *         success:
 *           type: boolean
 *           description: 請求是否成功
 *           example: true
 *         data:
 *           type: array
 *           description: 分頁資料陣列
 *           items: {}
 *         pagination:
 *           $ref: '#/components/schemas/CursorPaginationInfo'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: 時間戳
 *           example: "2024-01-15T10:30:00Z"
 *         meta:
 *           $ref: '#/components/schemas/ResponseMeta'
 *           nullable: true
     
 *     Timestamps:
 *       type: object
 *       properties:
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 建立時間
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新時間
 *           example: "2024-01-15T10:30:00Z"
     
 *     UserBasicInfo:
 *       type: object
 *       description: 使用者基本資訊
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: 使用者 ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 使用者名稱
 *           example: "張三"
 *         _id:
 *           type: string
 *           description: 使用者 UUID
 *           example: "507f1f77bcf86cd799439011"
 *         roleList:
 *           type: array
 *           description: 角色列表
 *           items:
 *             type: string
 *           example: ["user"]
 *         photoURL:
 *           type: string
 *           nullable: true
 *           description: 頭像 URL
 *           example: "https://example.com/avatar.jpg"
 *         educationStage:
 *           type: string
 *           nullable: true
 *           description: 教育階段
 *           example: "bachelor"
 *         tagList:
 *           type: array
 *           description: 使用者標籤列表
 *           items:
 *             type: string
 *           example: ["developer", "student"]
 *         selfIntroduction:
 *           type: string
 *           nullable: true
 *           description: 自我介紹
 *           example: "我是一名熱愛學習的軟體開發者"

 
 *   responses:
 *     BadRequestError:
 *       description: 請求參數錯誤
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiErrorResponse'
 *               - type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         example: "BAD_REQUEST"
 *                       message:
 *                         example: "請求參數錯誤"
 *     
 *     UnauthorizedError:
 *       description: 未授權存取
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiErrorResponse'
 *               - type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         example: "UNAUTHORIZED"
 *                       message:
 *                         example: "未授權存取"

 *     ForbiddenError:
 *       description: 禁止存取
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiErrorResponse'
 *               - type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         example: "FORBIDDEN"
 *                       message:
 *                         example: "無權限執行此操作"
 *     
 *     NotFoundError:
 *       description: 資源不存在
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiErrorResponse'
 *               - type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         example: "NOT_FOUND"
 *                       message:
 *                         example: "資源不存在"

 *     ConflictError:
 *       description: 資源衝突
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiErrorResponse'
 *               - type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         example: "CONFLICT"
 *                       message:
 *                         example: "資源已存在或發生衝突"

 *     ValidationError:
 *       description: 資料驗證錯誤
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiErrorResponse'
 *               - type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         example: "VALIDATION_ERROR"
 *                       message:
 *                         example: "資料驗證失敗"
 *                       details:
 *                         type: object
 *                         example: { "title": "標題不能為空", "email": "信箱格式錯誤" }
 *     
 *     InternalServerError:
 *       description: 伺服器內部錯誤
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiErrorResponse'
 *               - type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         example: "INTERNAL_SERVER_ERROR"
 *                       message:
 *                         example: "伺服器內部錯誤"
 */