/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: 請求是否成功
 *           example: false
 *         message:
 *           type: string
 *           description: 錯誤訊息
 *           example: "請求參數錯誤"
 *         error:
 *           type: string
 *           description: 詳細錯誤資訊
 *           example: "Invalid request parameters"
 *         errors:
 *           type: array
 *           description: 驗證錯誤詳情
 *           items:
 *             type: object
 *             properties:
 *               path:
 *                 type: string
 *                 example: "email"
 *               message:
 *                 type: string
 *                 example: "Invalid email format"
 *     
 *     PaginationMeta:
 *       type: object
 *       required:
 *         - limit
 *         - hasNext
 *         - hasPrev
 *       properties:
 *         limit:
 *           type: integer
 *           description: 每頁記錄數
 *           example: 20
 *         hasNext:
 *           type: boolean
 *           description: 是否有下一頁
 *           example: true
 *         hasPrev:
 *           type: boolean
 *           description: 是否有上一頁
 *           example: false
 *         nextCursor:
 *           type: string
 *           nullable: true
 *           description: 下一頁游標
 *           example: "eyJpZCI6MTAwfQ=="
 *         prevCursor:
 *           type: string
 *           nullable: true
 *           description: 上一頁游標
 *           example: null
 *         totalEstimate:
 *           type: integer
 *           description: 預估總記錄數
 *           example: 150
 *         parentTotalEstimate:
 *           type: integer
 *           nullable: true
 *           description: 父分類下的資源總數估計（僅在有子分類篩選時提供）
 *           example: 45
 *     
 *     SuccessResponse:
 *       type: object
 *       required:
 *         - success
 *       properties:
 *         success:
 *           type: boolean
 *           description: 請求是否成功
 *           example: true
 *         message:
 *           type: string
 *           description: 成功訊息
 *           example: "操作成功"
 *     
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
 *     
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
 *   
 * 
 *   responses:
 *     BadRequestError:
 *       description: 請求參數錯誤
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ErrorResponse'
 *               - type: object
 *                 properties:
 *                   message:
 *                     example: "請求參數錯誤"
 *     
 *     NotFoundError:
 *       description: 資源不存在
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ErrorResponse'
 *               - type: object
 *                 properties:
 *                   message:
 *                     example: "資源不存在"
 *     
 *     InternalServerError:
 *       description: 伺服器內部錯誤
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ErrorResponse'
 *               - type: object
 *                 properties:
 *                   message:
 *                     example: "伺服器內部錯誤"
 */