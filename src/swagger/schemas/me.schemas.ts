/**
 * @swagger
 * components:
 *   schemas:
 *     MyPracticeItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *           description: 實踐記錄 ID
 *         title:
 *           type: string
 *           example: "學習 TypeScript"
 *           description: 實踐標題
 *         contentType:
 *           type: string
 *           enum: [book, video, articles, podcast, course, custom]
 *           example: "book"
 *           description: 內容類型
 *         customContentType:
 *           type: string
 *           example: "程式碼練習"
 *           description: 自定義內容類型
 *         totalAmount:
 *           type: integer
 *           example: 30
 *           description: 總目標數量
 *         currentProgress:
 *           type: number
 *           example: 15.5
 *           description: 當前進度
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2023-12-01"
 *           description: 開始日期
 *         status:
 *           type: string
 *           enum: [active, paused, completed, archived]
 *           example: "active"
 *           description: 實踐狀態
 *         streak:
 *           type: integer
 *           example: 7
 *           description: 連續天數
 *         maxStreak:
 *           type: integer
 *           example: 15
 *           description: 最高連續天數
 *         lastCheckInDate:
 *           type: string
 *           format: date
 *           example: "2023-12-07"
 *           description: 上次簽到日期
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-12-01T10:00:00Z"
 *           description: 創建時間
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-12-07T18:30:00Z"
 *           description: 更新時間
 *         dailyGoal:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [time, completion]
 *               example: "time"
 *               description: 目標類型
 *             timeMinutes:
 *               type: integer
 *               example: 60
 *               description: 時間目標（分鐘）
 *             amount:
 *               type: integer
 *               example: 5
 *               description: 數量目標
 *             unit:
 *               type: string
 *               example: "頁"
 *               description: 單位
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["TypeScript", "程式設計", "前端"]
 *           description: 標籤列表
 *         practiceAction:
 *           type: string
 *           example: "每天閱讀一個章節"
 *           description: 實踐行動描述
 *         hasResources:
 *           type: boolean
 *           example: true
 *           description: 是否有相關資源
 * 
 *     PracticeStatsData:
 *       type: object
 *       properties:
 *         totalPractices:
 *           type: integer
 *           example: 12
 *           description: 總實踐數
 *         activePractices:
 *           type: integer
 *           example: 8
 *           description: 進行中的實踐數
 *         completedPractices:
 *           type: integer
 *           example: 3
 *           description: 已完成的實踐數
 *         pausedPractices:
 *           type: integer
 *           example: 1
 *           description: 暫停的實踐數
 *         archivedPractices:
 *           type: integer
 *           example: 0
 *           description: 已封存的實踐數
 *         totalCheckIns:
 *           type: integer
 *           example: 145
 *           description: 總簽到次數
 *         currentStreak:
 *           type: integer
 *           example: 7
 *           description: 當前連續天數
 *         maxStreak:
 *           type: integer
 *           example: 21
 *           description: 最高連續天數
 *         averageProgress:
 *           type: number
 *           example: 68.5
 *           description: 平均進度百分比
 *         timeSpentToday:
 *           type: integer
 *           example: 90
 *           description: 今天花費時間（分鐘）
 *         timeSpentThisWeek:
 *           type: integer
 *           example: 420
 *           description: 本週花費時間（分鐘）
 *         timeSpentThisMonth:
 *           type: integer
 *           example: 1800
 *           description: 本月花費時間（分鐘）
 *         practicesByCategory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 example: "book"
 *                 description: 分類
 *               count:
 *                 type: integer
 *                 example: 5
 *                 description: 數量
 *               avgProgress:
 *                 type: number
 *                 example: 72.3
 *                 description: 平均進度
 *           description: 按分類統計
 *         recentActivity:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-07"
 *                 description: 日期
 *               checkInCount:
 *                 type: integer
 *                 example: 3
 *                 description: 簽到次數
 *               timeSpent:
 *                 type: integer
 *                 example: 120
 *                 description: 花費時間（分鐘）
 *           description: 近期活動
 *         achievements:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [streak, completion, consistency]
 *                 example: "streak"
 *                 description: 成就類型
 *               milestone:
 *                 type: integer
 *                 example: 7
 *                 description: 里程碑數值
 *               achievedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-12-07T18:00:00Z"
 *                 description: 達成時間
 *               description:
 *                 type: string
 *                 example: "連續簽到 7 天"
 *                 description: 成就描述
 *           description: 成就列表
 * 
 *     MyResourceItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *           description: 資源 ID
 *         name:
 *           type: string
 *           example: "TypeScript 學習筆記"
 *           description: 資源名稱
 *         description:
 *           type: string
 *           example: "我的 TypeScript 學習筆記和心得"
 *           description: 資源描述
 *         url:
 *           type: string
 *           format: uri
 *           example: "https://example.com/my-notes"
 *           description: 資源連結
 *         type:
 *           type: string
 *           enum: [link, file, note, draft]
 *           example: "note"
 *           description: 資源類型
 *         category:
 *           type: string
 *           example: "程式設計"
 *           description: 分類
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           example: "draft"
 *           description: 資源狀態
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["TypeScript", "筆記", "前端"]
 *           description: 標籤列表
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-12-01T10:00:00Z"
 *           description: 創建時間
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-12-07T15:30:00Z"
 *           description: 更新時間
 *         fileSize:
 *           type: integer
 *           example: 2048
 *           description: 檔案大小（位元組）
 *         visibility:
 *           type: string
 *           enum: [private, public]
 *           example: "private"
 *           description: 可見性
 *         metadata:
 *           type: object
 *           additionalProperties: true
 *           example: { "format": "markdown", "wordCount": 1500 }
 *           description: 額外資料
 * 
 *     PreferenceType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *           description: 偏好類型 ID
 *         name:
 *           type: string
 *           example: "學習偏好"
 *           description: 偏好類型名稱
 *         value:
 *           type: string
 *           example: "learning_style"
 *           description: 偏好類型值
 *         description:
 *           type: string
 *           example: "選擇你的學習方式偏好"
 *           description: 偏好類型描述
 *         maxSelections:
 *           type: integer
 *           example: 3
 *           description: 最大選擇數量
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PreferenceOption'
 *           description: 偏好選項列表
 * 
 *     PreferenceOption:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *           description: 偏好選項 ID
 *         value:
 *           type: string
 *           example: "visual_learning"
 *           description: 偏好選項值
 *         name:
 *           type: string
 *           example: "視覺化學習"
 *           description: 偏好選項名稱
 *         description:
 *           type: string
 *           example: "透過圖表、圖像等視覺元素學習"
 *           description: 偏好選項描述
 * 
 *     UserPreference:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *           description: 用戶偏好 ID
 *         preferenceTypeId:
 *           type: integer
 *           example: 1
 *           description: 偏好類型 ID
 *         optionId:
 *           type: integer
 *           example: 3
 *           description: 偏好選項 ID
 *         isSelected:
 *           type: boolean
 *           example: true
 *           description: 是否選中
 *         weight:
 *           type: number
 *           example: 2.5
 *           description: 偏好權重
 *         lastAccessedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-12-07T15:30:00Z"
 *           description: 最後存取時間
 *         accessCount:
 *           type: integer
 *           example: 15
 *           description: 存取次數
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-12-01T10:00:00Z"
 *           description: 創建時間
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-12-07T15:30:00Z"
 *           description: 更新時間
 *         preferenceType:
 *           $ref: '#/components/schemas/PreferenceType'
 *         option:
 *           $ref: '#/components/schemas/PreferenceOption'
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         currentPage:
 *           type: integer
 *           example: 1
 *           description: 當前頁碼
 *         totalPages:
 *           type: integer
 *           example: 5
 *           description: 總頁數
 *         totalItems:
 *           type: integer
 *           example: 95
 *           description: 總項目數
 *         itemsPerPage:
 *           type: integer
 *           example: 20
 *           description: 每頁項目數
 *         hasNext:
 *           type: boolean
 *           example: true
 *           description: 是否有下一頁
 *         hasPrev:
 *           type: boolean
 *           example: false
 *           description: 是否有上一頁
 * 
 *     UserAuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 123
 *               description: 用戶 ID
 *             email:
 *               type: string
 *               format: email
 *               example: "user@example.com"
 *               description: 用戶郵箱
 *             isAuthenticated:
 *               type: boolean
 *               example: true
 *               description: 是否已認證
 * 
 *     UserProfileResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 123
 *               description: 用戶 ID
 *             displayName:
 *               type: string
 *               example: "張小明"
 *               description: 顯示名稱
 *             email:
 *               type: string
 *               format: email
 *               example: "user@example.com"
 *               description: 用戶郵箱
 *             profilePicture:
 *               type: string
 *               format: uri
 *               example: "https://example.com/avatar.jpg"
 *               description: 頭像 URL
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2023-01-01T00:00:00Z"
 *               description: 創建時間
 *             lastLoginAt:
 *               type: string
 *               format: date-time
 *               example: "2023-12-01T12:00:00Z"
 *               description: 最後登入時間
 */