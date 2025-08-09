/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProjectRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 專案標題
 *           example: 我的學習專案
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: 專案描述
 *           example: 這是一個關於學習React的專案
 *         motivation:
 *           type: object
 *           description: 專案動機
 *         motivation_description:
 *           type: string
 *           maxLength: 1000
 *           description: 動機描述
 *           example: 想要掌握現代前端開發技術
 *         goal:
 *           type: string
 *           maxLength: 500
 *           description: 專案目標
 *           example: 完成一個完整的React應用程式
 *         content:
 *           type: string
 *           maxLength: 5000
 *           description: 專案內容
 *           example: 詳細的專案內容...
 *         strategy:
 *           type: object
 *           description: 專案策略
 *         strategy_description:
 *           type: string
 *           maxLength: 1000
 *           description: 策略描述
 *           example: 每週學習3小時，完成實作練習
 *         resource:
 *           type: string
 *           maxLength: 2000
 *           description: 資源描述
 *           example: 線上課程、官方文檔、實作範例
 *         outcome:
 *           type: object
 *           description: 專案成果
 *         outcome_description:
 *           type: string
 *           maxLength: 1000
 *           description: 成果描述
 *           example: 完成待辦事項應用程式
 *         is_public:
 *           type: boolean
 *           description: 是否公開
 *           example: true
 *         status:
 *           type: string
 *           enum: [Not Started, Ongoing, Completed, Canceled]
 *           description: 專案狀態
 *           example: Ongoing
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: 開始日期
 *           example: 2024-01-01T00:00:00Z
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: 結束日期
 *           example: 2024-12-31T23:59:59Z
 *         interval:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           description: 間隔天數
 *           example: 30
 *         img_url:
 *           type: string
 *           format: uri
 *           description: 圖片URL
 *           example: https://example.com/project-image.jpg
 *
 *     UpdateProjectRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 專案標題
 *           example: 更新後的專案標題
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: 專案描述
 *         motivation:
 *           type: object
 *           description: 專案動機
 *         motivation_description:
 *           type: string
 *           maxLength: 1000
 *           description: 動機描述
 *         goal:
 *           type: string
 *           maxLength: 500
 *           description: 專案目標
 *         content:
 *           type: string
 *           maxLength: 5000
 *           description: 專案內容
 *         strategy:
 *           type: object
 *           description: 專案策略
 *         strategy_description:
 *           type: string
 *           maxLength: 1000
 *           description: 策略描述
 *         resource:
 *           type: string
 *           maxLength: 2000
 *           description: 資源描述
 *         outcome:
 *           type: object
 *           description: 專案成果
 *         outcome_description:
 *           type: string
 *           maxLength: 1000
 *           description: 成果描述
 *         is_public:
 *           type: boolean
 *           description: 是否公開
 *         status:
 *           type: string
 *           enum: [Not Started, Ongoing, Completed, Canceled]
 *           description: 專案狀態
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: 開始日期
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: 結束日期
 *         interval:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           description: 間隔天數
 *         img_url:
 *           type: string
 *           format: uri
 *           description: 圖片URL
 *
 *     ProjectMotivation:
 *       type: string
 *       enum: [driven_by_curiosity, interest_and_passion, self_challenge, personal_growth, career_development, pursuing_education_or_qualifications, social_recognition, exploring_possibilities, preparing_for_the_future, innovation_and_development, practical_needs, inspired_by_events, interpersonal_connections, life_changes, impact_on_society, influenced_by_a_group, others]
 *       description: 專案動機
 *       example: personal_growth
 *     
 *     ProjectStrategy:
 *       type: string
 *       enum: [data_collection_research_analysis, book_reading, watching_videos, listening_to_podcasts, examinations, participating_in_competitions, finding_study_partners, joining_communities, consulting_experts_and_scholars, doing_projects, initiating_actions, field_internship, organizing_events_or_courses, attending_events_or_courses, field_research, conducting_interviews, conducting_surveys, others]
 *       description: 專案策略
 *       example: book_reading
 *     
 *     ProjectOutcome:
 *       type: string
 *       enum: [building_websites, managing_social_media, writing_research_reports, artistic_creation, initiating_projects_or_organizations, making_videos, organizing_events, teaching_courses, participating_in_competitions, others]
 *       description: 專案成果
 *       example: building_websites
 *     
 *     ProjectStatus:
 *       type: string
 *       enum: [Ongoing, Completed, Not Started, Canceled]
 *       description: 專案狀態
 *       example: Ongoing
 *     
 *     DaysOfWeek:
 *       type: string
 *       enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *       description: 星期
 *       example: Monday
 *     
 *     PostType:
 *       type: string
 *       enum: [outcome, note, review]
 *       description: 發文類型
 *       example: note
 *     
 *     Visibility:
 *       type: string
 *       enum: [public, private]
 *       description: 可見性
 *       example: private
 *     
 *     PostStatus:
 *       type: string
 *       enum: [draft, published]
 *       description: 發文狀態
 *       example: draft
 *     
 *     Mood:
 *       type: string
 *       enum: [happy, calm, anxious, tired, frustrated]
 *       description: 心情
 *       example: happy
 *     
 *     Project:
 *       allOf:
 *         - $ref: '#/components/schemas/Timestamps'
 *         - type: object
 *           required:
 *             - id
 *             - external_id
 *             - user_id
 *             - is_public
 *             - status
 *           properties:
 *             id:
 *               type: integer
 *               description: 專案內部 ID
 *               example: 123
 *             external_id:
 *               type: string
 *               format: uuid
 *               description: 專案外部 UUID
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *             user_id:
 *               type: integer
 *               description: 使用者 ID
 *               example: 1
 *             img_url:
 *               type: string
 *               format: uri
 *               description: 專案圖片 URL
 *               example: "https://example.com/image.jpg"
 *             title:
 *               type: string
 *               maxLength: 100
 *               description: 專案標題
 *               example: "學習 React 前端開發"
 *             description:
 *               type: string
 *               maxLength: 2000
 *               description: 專案描述
 *               example: "深入學習 React 框架，建立現代化前端應用"
 *             motivation:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectMotivation'
 *               description: 專案動機列表
 *               example: ["personal_growth", "career_development"]
 *             motivation_description:
 *               type: string
 *               maxLength: 1000
 *               description: 動機描述
 *               example: "希望提升前端技能，為職業發展做準備"
 *             goal:
 *               type: string
 *               maxLength: 500
 *               description: 專案目標
 *               example: "能夠獨立開發 React 應用"
 *             content:
 *               type: string
 *               maxLength: 5000
 *               description: 專案內容
 *               example: "學習 React 基礎概念、組件開發、狀態管理等"
 *             strategy:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectStrategy'
 *               description: 學習策略列表
 *               example: ["book_reading", "watching_videos", "doing_projects"]
 *             strategy_description:
 *               type: string
 *               maxLength: 1000
 *               description: 策略描述
 *               example: "通過閱讀官方文檔、觀看教學影片和實作專案來學習"
 *             resource:
 *               type: string
 *               maxLength: 2000
 *               description: 學習資源
 *               example: "React 官方文檔、Udemy 課程、GitHub 專案"
 *             outcome:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectOutcome'
 *               description: 預期成果列表
 *               example: ["building_websites"]
 *             outcome_description:
 *               type: string
 *               maxLength: 1000
 *               description: 成果描述
 *               example: "建立個人作品集網站"
 *             is_public:
 *               type: boolean
 *               description: 是否公開
 *               example: false
 *             status:
 *               $ref: '#/components/schemas/ProjectStatus'
 *             start_date:
 *               type: string
 *               format: date-time
 *               description: 開始日期
 *               example: "2024-01-01T00:00:00Z"
 *             end_date:
 *               type: string
 *               format: date-time
 *               description: 結束日期
 *               example: "2024-06-30T23:59:59Z"
 *             interval:
 *               type: integer
 *               minimum: 1
 *               maximum: 365
 *               description: 間隔天數
 *               example: 180
 *             created_by:
 *               type: integer
 *               description: 創建者 ID
 *               example: 1
 *             updated_by:
 *               type: integer
 *               description: 更新者 ID
 *               example: 1
 *             version:
 *               type: integer
 *               description: 版本號
 *               example: 1
 *     
 *     Milestone:
 *       allOf:
 *         - $ref: '#/components/schemas/Timestamps'
 *         - type: object
 *           required:
 *             - id
 *             - project_id
 *             - position
 *             - is_completed
 *             - is_deleted
 *           properties:
 *             id:
 *               type: integer
 *               description: 里程碑 ID
 *               example: 1
 *             project_id:
 *               type: string
 *               format: uuid
 *               description: 專案 ID
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *             position:
 *               type: integer
 *               minimum: 1
 *               description: 位置順序
 *               example: 1
 *             name:
 *               type: string
 *               maxLength: 100
 *               description: 里程碑名稱
 *               example: "完成 React 基礎學習"
 *             description:
 *               type: string
 *               maxLength: 1000
 *               description: 里程碑描述
 *               example: "掌握 React 基本概念和語法"
 *             start_date:
 *               type: string
 *               format: date-time
 *               description: 開始日期
 *               example: "2024-01-01T00:00:00Z"
 *             end_date:
 *               type: string
 *               format: date-time
 *               description: 結束日期
 *               example: "2024-02-01T00:00:00Z"
 *             is_completed:
 *               type: boolean
 *               description: 是否完成
 *               example: false
 *             is_deleted:
 *               type: boolean
 *               description: 是否刪除
 *               example: false
 *     
 *     Task:
 *       allOf:
 *         - $ref: '#/components/schemas/Timestamps'
 *         - type: object
 *           required:
 *             - id
 *             - milestone_id
 *             - position
 *             - is_completed
 *             - is_deleted
 *           properties:
 *             id:
 *               type: integer
 *               description: 任務 ID
 *               example: 1
 *             milestone_id:
 *               type: integer
 *               description: 里程碑 ID
 *               example: 1
 *             position:
 *               type: integer
 *               minimum: 1
 *               description: 位置順序
 *               example: 1
 *             name:
 *               type: string
 *               maxLength: 100
 *               description: 任務名稱
 *               example: "閱讀 React 官方文檔"
 *             description:
 *               type: string
 *               maxLength: 1000
 *               description: 任務描述
 *               example: "完整閱讀 React 官方文檔的核心概念部分"
 *             days_of_week:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DaysOfWeek'
 *               description: 執行日期（星期）
 *               example: ["Monday", "Wednesday", "Friday"]
 *             is_completed:
 *               type: boolean
 *               description: 是否完成
 *               example: false
 *             is_deleted:
 *               type: boolean
 *               description: 是否刪除
 *               example: false
 *     
 *     Post:
 *       allOf:
 *         - $ref: '#/components/schemas/Timestamps'
 *         - type: object
 *           required:
 *             - id
 *             - project_id
 *             - user_id
 *             - type
 *             - week
 *             - title
 *             - date
 *             - visibility
 *             - status
 *           properties:
 *             id:
 *               type: integer
 *               description: 發文 ID
 *               example: 1
 *             project_id:
 *               type: integer
 *               description: 專案 ID
 *               example: 123
 *             user_id:
 *               type: integer
 *               description: 使用者 ID
 *               example: 1
 *             type:
 *               $ref: '#/components/schemas/PostType'
 *             week:
 *               type: integer
 *               description: 第幾週
 *               example: 1
 *             title:
 *               type: string
 *               description: 發文標題
 *               example: "第一週學習心得"
 *             date:
 *               type: string
 *               format: date
 *               description: 發文日期
 *               example: "2024-01-07"
 *             visibility:
 *               $ref: '#/components/schemas/Visibility'
 *             status:
 *               $ref: '#/components/schemas/PostStatus'
 *     
 *     Note:
 *       allOf:
 *         - $ref: '#/components/schemas/Timestamps'
 *         - type: object
 *           required:
 *             - id
 *             - post_id
 *             - content
 *             - image_urls
 *             - video_urls
 *             - visibility
 *           properties:
 *             id:
 *               type: integer
 *               description: 筆記 ID
 *               example: 1
 *             post_id:
 *               type: integer
 *               description: 發文 ID
 *               example: 1
 *             content:
 *               type: string
 *               description: 筆記內容
 *               example: "今天學習了 React 的基本概念，包括組件和 JSX 語法"
 *             image_urls:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uri
 *               description: 圖片 URL 列表
 *               example: ["https://example.com/image1.jpg"]
 *             video_urls:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uri
 *               description: 影片 URL 列表
 *               example: ["https://example.com/video1.mp4"]
 *             visibility:
 *               $ref: '#/components/schemas/Visibility'
 *     
 *     Outcome:
 *       allOf:
 *         - $ref: '#/components/schemas/Timestamps'
 *         - type: object
 *           required:
 *             - id
 *             - post_id
 *             - content
 *             - image_urls
 *             - video_urls
 *             - visibility
 *           properties:
 *             id:
 *               type: integer
 *               description: 成果 ID
 *               example: 1
 *             post_id:
 *               type: integer
 *               description: 發文 ID
 *               example: 1
 *             content:
 *               type: string
 *               description: 成果內容
 *               example: "完成了第一個 React 專案 - 待辦事項應用"
 *             image_urls:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uri
 *               description: 圖片 URL 列表
 *               example: ["https://example.com/screenshot.jpg"]
 *             video_urls:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uri
 *               description: 影片 URL 列表
 *               example: ["https://example.com/demo.mp4"]
 *             visibility:
 *               $ref: '#/components/schemas/Visibility'
 *     
 *     Review:
 *       allOf:
 *         - $ref: '#/components/schemas/Timestamps'
 *         - type: object
 *           required:
 *             - id
 *             - post_id
 *             - mood
 *             - visibility
 *           properties:
 *             id:
 *               type: integer
 *               description: 評審 ID
 *               example: 1
 *             post_id:
 *               type: integer
 *               description: 發文 ID
 *               example: 1
 *             mood:
 *               $ref: '#/components/schemas/Mood'
 *             mood_description:
 *               type: string
 *               description: 心情描述
 *               example: "今天學習很順利，感覺很有成就感"
 *             stress_level:
 *               type: integer
 *               minimum: 1
 *               maximum: 10
 *               description: 壓力等級 (1-10)
 *               example: 3
 *             learning_review:
 *               type: integer
 *               minimum: 1
 *               maximum: 10
 *               description: 學習回顧評分 (1-10)
 *               example: 8
 *             learning_feedback:
 *               type: string
 *               description: 學習反饋
 *               example: "今天的學習內容比較容易理解，進度不錯"
 *             adjustment_plan:
 *               type: string
 *               description: 調整計劃
 *               example: "明天加強練習 React Hooks"
 *             visibility:
 *               $ref: '#/components/schemas/Visibility'
 *     
 *     ProjectResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/Project'
 *         - type: object
 *           properties:
 *             milestones:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Milestone'
 *                   - type: object
 *                     properties:
 *                       tasks:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Task'
 *             posts:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Post'
 *                   - type: object
 *                     properties:
 *                       note:
 *                         $ref: '#/components/schemas/Note'
 *                       outcome:
 *                         $ref: '#/components/schemas/Outcome'
 *                       review:
 *                         $ref: '#/components/schemas/Review'
 *     
 *     CreateProjectRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *           description: 專案標題
 *           example: "學習 React 前端開發"
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: 專案描述
 *           example: "深入學習 React 框架，建立現代化前端應用"
 *         motivation:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectMotivation'
 *           description: 專案動機列表
 *           example: ["personal_growth", "career_development"]
 *         motivation_description:
 *           type: string
 *           maxLength: 1000
 *           description: 動機描述
 *           example: "希望提升前端技能，為職業發展做準備"
 *         goal:
 *           type: string
 *           maxLength: 500
 *           description: 專案目標
 *           example: "能夠獨立開發 React 應用"
 *         content:
 *           type: string
 *           maxLength: 5000
 *           description: 專案內容
 *           example: "學習 React 基礎概念、組件開發、狀態管理等"
 *         strategy:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectStrategy'
 *           description: 學習策略列表
 *           example: ["book_reading", "watching_videos", "doing_projects"]
 *         strategy_description:
 *           type: string
 *           maxLength: 1000
 *           description: 策略描述
 *           example: "通過閱讀官方文檔、觀看教學影片和實作專案來學習"
 *         resource:
 *           type: string
 *           maxLength: 2000
 *           description: 學習資源
 *           example: "React 官方文檔、Udemy 課程、GitHub 專案"
 *         outcome:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectOutcome'
 *           description: 預期成果列表
 *           example: ["building_websites"]
 *         outcome_description:
 *           type: string
 *           maxLength: 1000
 *           description: 成果描述
 *           example: "建立個人作品集網站"
 *         is_public:
 *           type: boolean
 *           description: 是否公開
 *           example: false
 *         status:
 *           $ref: '#/components/schemas/ProjectStatus'
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: 開始日期
 *           example: "2024-01-01T00:00:00Z"
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: 結束日期
 *           example: "2024-06-30T23:59:59Z"
 *         interval:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           description: 間隔天數
 *           example: 180
 *         img_url:
 *           type: string
 *           format: uri
 *           description: 專案圖片 URL
 *           example: "https://example.com/image.jpg"
 *     
 *     UpdateProjectRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *           description: 專案標題
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: 專案描述
 *         motivation:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectMotivation'
 *           description: 專案動機列表
 *         motivation_description:
 *           type: string
 *           maxLength: 1000
 *           description: 動機描述
 *         goal:
 *           type: string
 *           maxLength: 500
 *           description: 專案目標
 *         content:
 *           type: string
 *           maxLength: 5000
 *           description: 專案內容
 *         strategy:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectStrategy'
 *           description: 學習策略列表
 *         strategy_description:
 *           type: string
 *           maxLength: 1000
 *           description: 策略描述
 *         resource:
 *           type: string
 *           maxLength: 2000
 *           description: 學習資源
 *         outcome:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectOutcome'
 *           description: 預期成果列表
 *         outcome_description:
 *           type: string
 *           maxLength: 1000
 *           description: 成果描述
 *         is_public:
 *           type: boolean
 *           description: 是否公開
 *         status:
 *           $ref: '#/components/schemas/ProjectStatus'
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: 開始日期
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: 結束日期
 *         interval:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           description: 間隔天數
 *         img_url:
 *           type: string
 *           format: uri
 *           description: 專案圖片 URL
 *     
 *     DuplicateProjectRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *           description: 新專案標題
 *           example: "學習 React 前端開發 (副本)"
 *     
 *     ProjectStats:
 *       type: object
 *       required:
 *         - total_projects
 *         - ongoing_projects
 *         - completed_projects
 *         - not_started_projects
 *         - canceled_projects
 *       properties:
 *         total_projects:
 *           type: integer
 *           description: 總專案數
 *           example: 10
 *         ongoing_projects:
 *           type: integer
 *           description: 進行中專案數
 *           example: 3
 *         completed_projects:
 *           type: integer
 *           description: 已完成專案數
 *           example: 5
 *         not_started_projects:
 *           type: integer
 *           description: 未開始專案數
 *           example: 1
 *         canceled_projects:
 *           type: integer
 *           description: 已取消專案數
 *           example: 1
 */

export {};