/**
 * Practice API Swagger Schemas
 * 
 * Defines all schemas for practice-related endpoints including:
 * - PracticeEntity and related data structures
 * - Request/response schemas for CRUD operations
 * - Check-in schemas and statistics
 * - Interaction and event tracking schemas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ContentType:
 *       type: string
 *       enum: ['book', 'video', 'articles', 'podcast', 'course', 'custom']
 *       description: 實踐內容類型
 *       example: 'book'
 * 
 *     PracticeStatus:
 *       type: string
 *       enum: ['active', 'paused', 'completed', 'archived']
 *       description: 實踐狀態
 *       example: 'active'
 * 
 *     DailyGoalType:
 *       type: string
 *       enum: ['time', 'completion']
 *       description: 每日目標類型
 *       example: 'time'
 * 
 *     CheckInMood:
 *       type: string
 *       enum: ['awesome', 'happy', 'neutral', 'tired', 'frustrated']
 *       description: 簽到心情
 *       example: 'happy'
 * 
 *     SortField:
 *       type: string
 *       enum: ['createdAt', 'updatedAt', 'likeCount']
 *       description: 排序字段
 *       example: 'createdAt'
 * 
 *     SortOrder:
 *       type: string
 *       enum: ['asc', 'desc']
 *       description: 排序順序
 *       example: 'desc'
 * 
 *     DailyGoal:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           $ref: '#/components/schemas/DailyGoalType'
 *         timeMinutes:
 *           type: integer
 *           minimum: 1
 *           description: 時間目標（分鐘）
 *           example: 60
 *         amount:
 *           type: integer
 *           minimum: 1
 *           description: 數量目標
 *           example: 10
 *         unit:
 *           type: string
 *           description: 數量單位
 *           example: '頁'
 * 
 *     PracticeResource:
 *       type: object
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: 資源 ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 資源名稱
 *           example: '學習資料'
 *         url:
 *           type: string
 *           format: uri
 *           description: 資源連結
 *           example: 'https://example.com/resource'
 * 
 *     PracticeStats:
 *       type: object
 *       required:
 *         - likeCount
 *         - viewCount
 *         - favoriteCount
 *         - shareCount
 *         - commentCount
 *       properties:
 *         likeCount:
 *           type: integer
 *           minimum: 0
 *           description: 點讚數
 *           example: 5
 *         viewCount:
 *           type: integer
 *           minimum: 0
 *           description: 瀏覽次數
 *           example: 100
 *         favoriteCount:
 *           type: integer
 *           minimum: 0
 *           description: 收藏數
 *           example: 3
 *         shareCount:
 *           type: integer
 *           minimum: 0
 *           description: 分享次數
 *           example: 2
 *         commentCount:
 *           type: integer
 *           minimum: 0
 *           description: 評論數
 *           example: 8
 * 
 *     PracticeEntity:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - contentType
 *         - totalAmount
 *         - currentProgress
 *         - dailyGoal
 *         - status
 *         - hasResources
 *         - streak
 *         - maxStreak
 *         - createdAt
 *         - user
 *         - tags
 *         - stats
 *       properties:
 *         id:
 *           type: integer
 *           description: 實踐 ID
 *           example: 1
 *         title:
 *           type: string
 *           description: 實踐標題
 *           example: '每日閱讀 JavaScript 高級程式設計'
 *         contentType:
 *           $ref: '#/components/schemas/ContentType'
 *         customContentType:
 *           type: string
 *           nullable: true
 *           description: 自定義內容類型
 *           example: '技術書籍'
 *         totalAmount:
 *           type: integer
 *           minimum: 1
 *           description: 總目標數量
 *           example: 500
 *         currentProgress:
 *           type: integer
 *           minimum: 0
 *           description: 目前進度
 *           example: 150
 *         startDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: 開始日期
 *           example: '2024-01-01'
 *         dailyGoal:
 *           $ref: '#/components/schemas/DailyGoal'
 *         practiceAction:
 *           type: string
 *           nullable: true
 *           description: 實踐行動描述
 *           example: '閱讀並做筆記'
 *         status:
 *           $ref: '#/components/schemas/PracticeStatus'
 *         hasResources:
 *           type: boolean
 *           description: 是否有關聯資源
 *           example: true
 *         streak:
 *           type: integer
 *           minimum: 0
 *           description: 目前連續天數
 *           example: 7
 *         maxStreak:
 *           type: integer
 *           minimum: 0
 *           description: 最長連續天數
 *           example: 15
 *         lastCheckInDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: 最後簽到日期
 *           example: '2024-01-15'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 建立時間
 *           example: '2024-01-01T10:30:00Z'
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 更新時間
 *           example: '2024-01-15T14:20:00Z'
 *         user:
 *           $ref: '#/components/schemas/UserBasicInfo'
 *         tags:
 *           type: array
 *           description: 標籤列表
 *           items:
 *             type: string
 *           example: ['學習', 'JavaScript', '程式設計']
 *         stats:
 *           $ref: '#/components/schemas/PracticeStats'
 * 
 *     CheckInEntity:
 *       type: object
 *       required:
 *         - id
 *         - practiceId
 *         - userId
 *         - checkInDate
 *         - progressAmount
 *         - streakDay
 *         - cumulativeProgress
 *         - createdAt
 *       properties:
 *         id:
 *           type: integer
 *           description: 簽到記錄 ID
 *           example: 1
 *         practiceId:
 *           type: integer
 *           description: 實踐 ID
 *           example: 1
 *         userId:
 *           type: integer
 *           description: 使用者 ID
 *           example: 1
 *         checkInDate:
 *           type: string
 *           format: date
 *           description: 簽到日期
 *           example: '2024-01-15'
 *         progressAmount:
 *           type: integer
 *           minimum: 1
 *           description: 本次進度數量
 *           example: 10
 *         note:
 *           type: string
 *           nullable: true
 *           description: 簽到備註
 *           example: '今天學習了閉包的概念'
 *         mood:
 *           $ref: '#/components/schemas/CheckInMood'
 *           nullable: true
 *         reflectionText:
 *           type: string
 *           nullable: true
 *           description: 反思內容
 *           example: '理解了閉包的實際應用場景'
 *         relatedResourceId:
 *           type: string
 *           nullable: true
 *           description: 相關資源 ID
 *           example: 'resource-123'
 *         streakDay:
 *           type: integer
 *           minimum: 1
 *           description: 連續簽到天數
 *           example: 7
 *         cumulativeProgress:
 *           type: integer
 *           minimum: 0
 *           description: 累積進度
 *           example: 150
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 建立時間
 *           example: '2024-01-15T10:30:00Z'
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 更新時間
 *           example: '2024-01-15T10:30:00Z'
 * 
 *     PracticeStatistics:
 *       type: object
 *       required:
 *         - totalPractices
 *         - activePractices
 *         - completedPractices
 *         - pausedPractices
 *         - totalCheckIns
 *         - averageStreak
 *         - maxStreak
 *       properties:
 *         totalPractices:
 *           type: integer
 *           minimum: 0
 *           description: 總實踐數
 *           example: 5
 *         activePractices:
 *           type: integer
 *           minimum: 0
 *           description: 進行中實踐數
 *           example: 3
 *         completedPractices:
 *           type: integer
 *           minimum: 0
 *           description: 已完成實踐數
 *           example: 2
 *         pausedPractices:
 *           type: integer
 *           minimum: 0
 *           description: 暫停實踐數
 *           example: 0
 *         totalCheckIns:
 *           type: integer
 *           minimum: 0
 *           description: 總簽到次數
 *           example: 50
 *         averageStreak:
 *           type: integer
 *           minimum: 0
 *           description: 平均連續天數
 *           example: 8
 *         maxStreak:
 *           type: integer
 *           minimum: 0
 *           description: 最長連續天數
 *           example: 15
 * 
 *     CreatePracticeRequest:
 *       type: object
 *       required:
 *         - title
 *         - contentType
 *         - totalAmount
 *         - dailyGoal
 *         - tags
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: 實踐標題
 *           example: '每日閱讀 JavaScript 高級程式設計'
 *         contentType:
 *           $ref: '#/components/schemas/ContentType'
 *         customContentType:
 *           type: string
 *           maxLength: 50
 *           description: 自定義內容類型（當 contentType 為 custom 時）
 *           example: '技術書籍'
 *         totalAmount:
 *           type: integer
 *           minimum: 1
 *           description: 總目標數量
 *           example: 500
 *         startDate:
 *           type: string
 *           format: date
 *           description: 開始日期
 *           example: '2024-01-01'
 *         dailyGoal:
 *           $ref: '#/components/schemas/DailyGoal'
 *         practiceAction:
 *           type: string
 *           maxLength: 500
 *           description: 實踐行動描述
 *           example: '閱讀並做筆記'
 *         tags:
 *           type: array
 *           description: 標籤列表
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 20
 *           example: ['學習', 'JavaScript']
 *         resources:
 *           type: array
 *           description: 相關資源列表
 *           items:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: 資源名稱
 *                 example: 'JavaScript 高級程式設計'
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: 資源連結
 *                 example: 'https://example.com/book'
 * 
 *     UpdatePracticeRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: 實踐標題
 *           example: '每日閱讀 JavaScript 高級程式設計（更新）'
 *         totalAmount:
 *           type: integer
 *           minimum: 1
 *           description: 總目標數量
 *           example: 600
 *         startDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: 開始日期
 *           example: '2024-01-01'
 *         dailyGoal:
 *           $ref: '#/components/schemas/DailyGoal'
 *         practiceAction:
 *           type: string
 *           maxLength: 500
 *           description: 實踐行動描述
 *           example: '深入閱讀並做詳細筆記'
 *         tags:
 *           type: array
 *           description: 標籤列表
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 20
 *           example: ['學習', 'JavaScript', '進階']
 *         resources:
 *           type: array
 *           description: 相關資源列表
 *           items:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: 資源名稱
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: 資源連結
 *         status:
 *           $ref: '#/components/schemas/PracticeStatus'
 * 
 *     CreateCheckInRequest:
 *       type: object
 *       required:
 *         - progressAmount
 *       properties:
 *         progressAmount:
 *           type: integer
 *           minimum: 1
 *           description: 本次進度數量
 *           example: 10
 *         note:
 *           type: string
 *           maxLength: 1000
 *           description: 簽到備註
 *           example: '今天學習了閉包的概念'
 *         mood:
 *           $ref: '#/components/schemas/CheckInMood'
 *         reflectionText:
 *           type: string
 *           maxLength: 2000
 *           description: 反思內容
 *           example: '理解了閉包的實際應用場景'
 *         relatedResourceId:
 *           type: string
 *           description: 相關資源 ID
 *           example: 'resource-123'
 * 
 *     InteractionStatusResponse:
 *       type: object
 *       required:
 *         - isLiked
 *         - isFavorited
 *         - hasViewed
 *       properties:
 *         isLiked:
 *           type: boolean
 *           description: 是否已點讚
 *           example: true
 *         isFavorited:
 *           type: boolean
 *           description: 是否已收藏
 *           example: false
 *         hasViewed:
 *           type: boolean
 *           description: 是否已瀏覽
 *           example: true
 * 
 *     InteractionStatsResponse:
 *       type: object
 *       required:
 *         - likeCount
 *         - favoriteCount
 *         - viewCount
 *         - shareCount
 *       properties:
 *         likeCount:
 *           type: integer
 *           minimum: 0
 *           description: 點讚總數
 *           example: 25
 *         favoriteCount:
 *           type: integer
 *           minimum: 0
 *           description: 收藏總數
 *           example: 8
 *         viewCount:
 *           type: integer
 *           minimum: 0
 *           description: 瀏覽總數
 *           example: 150
 *         shareCount:
 *           type: integer
 *           minimum: 0
 *           description: 分享總數
 *           example: 5
 * 
 *     ViewEventRequest:
 *       type: object
 *       properties:
 *         duration:
 *           type: integer
 *           minimum: 1
 *           description: 瀏覽持續時間（秒）
 *           example: 30
 *         referrer:
 *           type: string
 *           description: 來源頁面
 *           example: 'home_page'
 *         metadata:
 *           type: object
 *           description: 額外數據
 *           example: { "section": "featured" }
 * 
 *     ShareEventRequest:
 *       type: object
 *       properties:
 *         platform:
 *           type: string
 *           description: 分享平台
 *           example: 'facebook'
 *         shareUrl:
 *           type: string
 *           format: uri
 *           description: 分享連結
 *           example: 'https://app.com/practices/1'
 *         shareTitle:
 *           type: string
 *           description: 分享標題
 *           example: '我的學習實踐'
 *         shareContent:
 *           type: string
 *           description: 分享內容
 *           example: '正在學習 JavaScript'
 *         metadata:
 *           type: object
 *           description: 額外數據
 * 
 *     PracticeListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/PaginatedApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PracticeEntity'
 * 
 *     PracticeDetailResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/PracticeEntity'
 * 
 *     PracticeStatsResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/PracticeStatistics'
 * 
 *     CheckInListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CheckInEntity'
 *             pagination:
 *               $ref: '#/components/schemas/PaginationInfo'
 */