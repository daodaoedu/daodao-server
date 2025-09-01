/**
 * @swagger
 * components:
 *   schemas:
 *     ResourceType:
 *       type: string
 *       enum: [learning_platform_app, learning_tools, books_articles, video_content, podcast_content, workshops_courses, professional_certificates, community_organization, other]
 *       description: 資源類型
 *       example: workshops_courses
 *     
 *     CostType:
 *       type: string
 *       enum: [free, paid, partial_free]
 *       description: 費用類型
 *       example: free
 *     
 *     LevelType:
 *       type: string
 *       enum: [beginner, intermediate, expert, all_levels]
 *       description: 難度等級
 *       example: beginner
 *     
 *     ResourceStatus:
 *       type: string
 *       enum: [draft, active, archived, reported]
 *       description: 資源狀態
 *       example: active
 *     
 *     Resource:
 *       allOf:
 *         - $ref: '#/components/schemas/Timestamps'
 *         - type: object
 *           required:
 *             - id
 *             - name
 *             - url
 *             - type
 *             - cost
 *             - level
 *             - status
 *             - userId
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: 資源唯一識別碼 (UUID)
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *             name:
 *               type: string
 *               description: 資源名稱
 *               example: "JavaScript 完整教程"
 *             url:
 *               type: string
 *               format: uri
 *               description: 資源連結
 *               example: "https://example.com/js-course"
 *             imageUrl:
 *               type: string
 *               format: uri
 *               nullable: true
 *               description: 資源圖片連結
 *               example: "https://example.com/js-course-cover.jpg"
 *             description:
 *               type: string
 *               nullable: true
 *               description: 資源描述
 *               example: "從零開始學習 JavaScript 的完整教程"
 *             videoUrl:
 *               type: string
 *               format: uri
 *               nullable: true
 *               description: 資源影片連結
 *               example: "https://youtube.com/watch?v=xxxxx"
 *             level:
 *               $ref: '#/components/schemas/LevelType'
 *             type:
 *               $ref: '#/components/schemas/ResourceType'
 *             cost:
 *               $ref: '#/components/schemas/CostType'
 *             status:
 *               $ref: '#/components/schemas/ResourceStatus'
 *             userId:
 *               type: integer
 *               description: 分享者 ID
 *               example: 1
 *             majorCategory:
 *               type: string
 *               nullable: true
 *               description: 主分類唯一識別名稱
 *               example: "nature_environment"
 *             subCategory:
 *               type: string
 *               nullable: true
 *               description: 子分類唯一識別名稱
 *               example: "earth_science"
 *             viewCount:
 *               type: integer
 *               description: 瀏覽次數
 *               example: 1500
 *             favoriteCount:
 *               type: integer
 *               description: 收藏次數
 *               example: 89
 *             shareCount:
 *               type: integer
 *               description: 分享次數
 *               example: 23
 *             reviewCount:
 *               type: integer
 *               description: 評論數量
 *               example: 25
 *             avgRating:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               nullable: true
 *               description: 平均評分
 *               example: 4.3
 *             likeCount:
 *               type: integer
 *               description: 點讚數量
 *               example: 156
 *             user:
 *               allOf:
 *                 - $ref: '#/components/schemas/UserBasicInfo'
 *                 - description: 分享者資訊
 *             tags:
 *               type: array
 *               description: 資源標籤列表
 *               items:
 *                 type: string
 *               example: ["JavaScript", "前端開發", "初學者"]
 *     
 *     CreateResourceDto:
 *       type: object
 *       required:
 *         - name
 *         - url
 *         - type
 *         - cost
 *         - level
 *         - majorCategory
 *         - subCategory
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           description: 資源名稱
 *           example: "JavaScript 完整教程"
 *         url:
 *           type: string
 *           format: uri
 *           description: 資源連結
 *           example: "https://example.com/js-course"
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: 資源圖片連結
 *           example: "https://example.com/js-course-cover.jpg"
 *         description:
 *           type: string
 *           nullable: true
 *           maxLength: 1000
 *           description: 資源描述
 *           example: "從零開始學習 JavaScript 的完整教程"
 *         videoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: 資源影片連結
 *           example: "https://youtube.com/watch?v=xxxxx"
 *         level:
 *           $ref: '#/components/schemas/LevelType'
 *         type:
 *           $ref: '#/components/schemas/ResourceType'
 *         cost:
 *           $ref: '#/components/schemas/CostType'
 *         majorCategory:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 主分類唯一識別名稱
 *           example: "nature_environment"
 *         subCategory:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 子分類唯一識別名稱
 *           example: "earth_science"
 *         tags:
 *           type: array
 *           description: 資源標籤列表
 *           items:
 *             type: string
 *           example: ["JavaScript", "前端開發", "初學者"]
 *         review:
 *           $ref: '#/components/schemas/CreateResourceReviewDto'
 *     
 *     UpdateResourceDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           description: 資源名稱
 *           example: "JavaScript 完整教程 - 更新版"
 *         url:
 *           type: string
 *           format: uri
 *           description: 資源連結
 *           example: "https://example.com/js-course-v2"
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: 資源圖片連結
 *         description:
 *           type: string
 *           nullable: true
 *           maxLength: 1000
 *           description: 資源描述
 *         videoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: 資源影片連結
 *         level:
 *           $ref: '#/components/schemas/LevelType'
 *         type:
 *           $ref: '#/components/schemas/ResourceType'
 *         cost:
 *           $ref: '#/components/schemas/CostType'
 *         majorCategory:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 主分類唯一識別名稱
 *           example: "nature_environment"
 *         subCategory:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 子分類唯一識別名稱
 *           example: "earth_science"
 *         tags:
 *           type: array
 *           description: 資源標籤列表
 *           items:
 *             type: string
 *     
 *     UpdateResourceStatusDto:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/ResourceStatus'
 *     
 *     ResourceListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/PaginatedApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Resource'
 *     
 *     ResourceResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/Resource'
 *     
 *     ResourceStatsResponse:
 *       type: object
 *       required:
 *         - totalCount
 *         - activeCount
 *         - typeStats
 *       properties:
 *         totalCount:
 *           type: integer
 *           description: 資源總數量（包含所有資源）
 *           example: 853
 *         activeCount:
 *           type: integer
 *           description: 啟用狀態的資源數量（排除軟刪除）
 *           example: 843
 *         typeStats:
 *           type: object
 *           description: 按資源類型分組的統計
 *           additionalProperties:
 *             type: integer
 *           example:
 *             course: 45
 *             book: 30
 *             video: 25
 *             article: 15
 *             tool: 3
 *             other: 2
 */