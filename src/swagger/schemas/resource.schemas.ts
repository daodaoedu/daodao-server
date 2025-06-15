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
 *       enum: [draft, published, archived, deleted]
 *       description: 資源狀態
 *       example: published
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
 *             - majorCategoryId
 *             - subCategoryId
 *           properties:
 *             id:
 *               type: integer
 *               description: 資源唯一識別碼
 *               example: 1
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
 *             overallImpact:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               description: 整體影響力評分
 *               example: 4.5
 *             changeMindset:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               description: 改變思維評分
 *               example: 4.0
 *             solveProblems:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               description: 解決問題評分
 *               example: 4.5
 *             gainPerspectives:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               description: 獲得洞察評分
 *               example: 4.0
 *             achieveGoals:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               description: 達成目標評分
 *               example: 4.5
 *             status:
 *               $ref: '#/components/schemas/ResourceStatus'
 *             userId:
 *               type: integer
 *               description: 創建者 ID
 *               example: 1
 *             majorCategoryId:
 *               type: integer
 *               description: 主分類 ID
 *               example: 1
 *             subCategoryId:
 *               type: integer
 *               description: 子分類 ID
 *               example: 5
 *             viewCount:
 *               type: integer
 *               description: 瀏覽次數
 *               example: 1500
 *             clickCount:
 *               type: integer
 *               description: 點擊次數
 *               example: 500
 *             reviewCount:
 *               type: integer
 *               description: 評論數量
 *               example: 25
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
 *         - majorCategoryId
 *         - subCategoryId
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
 *         majorCategoryId:
 *           type: integer
 *           minimum: 1
 *           description: 主分類 ID
 *           example: 1
 *         subCategoryId:
 *           type: integer
 *           minimum: 1
 *           description: 子分類 ID
 *           example: 5
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
 *         majorCategoryId:
 *           type: integer
 *           minimum: 1
 *           description: 主分類 ID
 *         subCategoryId:
 *           type: integer
 *           minimum: 1
 *           description: 子分類 ID
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
 *       type: object
 *       required:
 *         - success
 *         - data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           required:
 *             - resources
 *             - pagination
 *           properties:
 *             resources:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Resource'
 *             pagination:
 *               $ref: '#/components/schemas/PaginationMeta'
 *     
 *     ResourceResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Resource'
 */