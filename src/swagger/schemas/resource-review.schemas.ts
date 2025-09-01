/**
 * @swagger
 * components:
 *   schemas:
 *     TimeUsageType:
 *       type: string
 *       enum: [1_2_hours_daily, few_intensive_days_week, spare_moments, not_applicable_time]
 *       description: 時間使用方式
 *       example: 1_2_hours_daily
 *     
 *     ReviewStatus:
 *       type: string
 *       enum: [draft, published, archived, reported]
 *       description: 評論狀態
 *       example: published
 *     
 *     ContentFeatures:
 *       type: object
 *       properties:
 *         wellStructured:
 *           type: boolean
 *           description: 結構良好
 *           example: true
 *         practiceFocused:
 *           type: boolean
 *           description: 注重實踐
 *           example: true
 *         wellRoundedConcepts:
 *           type: boolean
 *           description: 概念完整
 *           example: false
 *         thoughtProvoking:
 *           type: boolean
 *           description: 引人深思
 *           example: true
 *         progressiveLearning:
 *           type: boolean
 *           description: 漸進式學習
 *           example: true
 *         problemBased:
 *           type: boolean
 *           description: 基於問題
 *           example: false
 *         realWorldExamples:
 *           type: boolean
 *           description: 真實案例
 *           example: true
 *         interactive:
 *           type: boolean
 *           description: 互動性
 *           example: false
 *         visuallyRich:
 *           type: boolean
 *           description: 視覺豐富
 *           example: true
 *     
 *     ResourceUsage:
 *       type: object
 *       properties:
 *         withOnlineCourses:
 *           type: boolean
 *           description: 搭配線上課程
 *           example: true
 *         withBooks:
 *           type: boolean
 *           description: 搭配書籍
 *           example: false
 *         withOtherTools:
 *           type: boolean
 *           description: 搭配其他工具
 *           example: true
 *         withCommunity:
 *           type: boolean
 *           description: 搭配社群
 *           example: false
 *         onlyThisResource:
 *           type: boolean
 *           description: 僅使用此資源
 *           example: false
 *         notApplicableResource:
 *           type: boolean
 *           description: 不適用
 *           example: false
 *     
 *     ResourceReview:
 *       allOf:
 *         - $ref: '#/components/schemas/Timestamps'
 *         - type: object
 *           required:
 *             - id
 *             - content
 *             - overallImpact
 *             - changeMindset
 *             - solveProblems
 *             - gainPerspectives
 *             - achieveGoals
 *             - status
 *             - resourceId
 *             - userId
 *           properties:
 *             id:
 *               type: string
 *               description: 評論唯一識別碼
 *               example: "1"
 *             content:
 *               type: string
 *               description: 評論內容
 *               example: "這是一個非常棒的 JavaScript 教程，從基礎到進階都講解得很清楚。"
 *             overallImpact:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               multipleOf: 0.5
 *               description: 整體影響力評分
 *               example: 4.5
 *             changeMindset:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               multipleOf: 0.5
 *               description: 改變思維評分
 *               example: 4.0
 *             solveProblems:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               multipleOf: 0.5
 *               description: 解決問題評分
 *               example: 4.5
 *             gainPerspectives:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               multipleOf: 0.5
 *               description: 獲得洞察評分
 *               example: 4.0
 *             achieveGoals:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               multipleOf: 0.5
 *               description: 達成目標評分
 *               example: 4.5
 *             avgRating:
 *               type: number
 *               format: float
 *               minimum: 1.0
 *               maximum: 5.0
 *               description: 平均評分（由五個評分維度計算得出）
 *               example: 4.2
 *             timeUsage:
 *               allOf:
 *                 - $ref: '#/components/schemas/TimeUsageType'
 *                 - nullable: true
 *             contentFeatures:
 *               $ref: '#/components/schemas/ContentFeatures'
 *             resourceUsage:
 *               $ref: '#/components/schemas/ResourceUsage'
 *             status:
 *               $ref: '#/components/schemas/ReviewStatus'
 *             resourceId:
 *               type: string
 *               format: uuid
 *               description: 關聯的資源 ID (UUID)
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *             userId:
 *               type: integer
 *               description: 評論者 ID
 *               example: 2
 *             likeCount:
 *               type: integer
 *               description: 點讚數量
 *               example: 10
 *             deletedAt:
 *               type: string
 *               format: date-time
 *               nullable: true
 *               description: 刪除時間
 *               example: null
 *             tags:
 *               type: array
 *               description: 評論標籤列表
 *               items:
 *                 type: string
 *               example: ["實用", "清晰易懂", "推薦"]
 *             resource:
 *               $ref: '#/components/schemas/Resource'
 *               description: 關聯的資源資訊（僅在特定查詢時返回）
 *             user:
 *               allOf:
 *                 - $ref: '#/components/schemas/UserBasicInfo'
 *                 - description: 評論者資訊（僅在特定查詢時返回）
 *     
 *     CreateResourceReviewDto:
 *       type: object
 *       required:
 *         - content
 *         - overallImpact
 *         - changeMindset
 *         - solveProblems
 *         - gainPerspectives
 *         - achieveGoals
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           description: 評論內容
 *           example: "這是一個非常棒的 JavaScript 教程，從基礎到進階都講解得很清楚。"
 *         overallImpact:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *           multipleOf: 0.5
 *           description: 整體影響力評分
 *           example: 4.5
 *         changeMindset:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *           multipleOf: 0.5
 *           description: 改變思維評分
 *           example: 4.0
 *         solveProblems:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *           multipleOf: 0.5
 *           description: 解決問題評分
 *           example: 4.5
 *         gainPerspectives:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *           multipleOf: 0.5
 *           description: 獲得洞察評分
 *           example: 4.0
 *         achieveGoals:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *           multipleOf: 0.5
 *           description: 達成目標評分
 *           example: 4.5
 *         timeUsage:
 *           allOf:
 *             - $ref: '#/components/schemas/TimeUsageType'
 *             - nullable: true
 *         contentFeatures:
 *           $ref: '#/components/schemas/ContentFeatures'
 *         resourceUsage:
 *           $ref: '#/components/schemas/ResourceUsage'
 *         tags:
 *           type: array
 *           description: 評論標籤列表
 *           items:
 *             type: string
 *           example: ["實用", "清晰易懂", "推薦"]
 *     
 *     UpdateResourceReviewDto:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           description: 評論內容
 *         overallImpact:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *           multipleOf: 0.5
 *           description: 整體影響力評分
 *         changeMindset:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *           multipleOf: 0.5
 *           description: 改變思維評分
 *         solveProblems:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *           multipleOf: 0.5
 *           description: 解決問題評分
 *         gainPerspectives:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *           multipleOf: 0.5
 *           description: 獲得洞察評分
 *         achieveGoals:
 *           type: number
 *           format: float
 *           minimum: 1.0
 *           maximum: 5.0
 *           multipleOf: 0.5
 *           description: 達成目標評分
 *         timeUsage:
 *           allOf:
 *             - $ref: '#/components/schemas/TimeUsageType'
 *             - nullable: true
 *         contentFeatures:
 *           $ref: '#/components/schemas/ContentFeatures'
 *         resourceUsage:
 *           $ref: '#/components/schemas/ResourceUsage'
 *         status:
 *           $ref: '#/components/schemas/ReviewStatus'
 *         tags:
 *           type: array
 *           description: 評論標籤列表
 *           items:
 *             type: string
 *     
 *     UpdateReviewStatusDto:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/ReviewStatus'
 *     
 *     ResourceReviewListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/PaginatedApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ResourceReview'
 *     
 *     ResourceReviewResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ResourceReview'
 */