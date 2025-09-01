/**
 * @swagger
 * components:
 *   schemas:
 *     OutcomeCreateRequest:
 *       type: object
 *       required:
 *         - week
 *         - title
 *         - date
 *         - content
 *       properties:
 *         week:
 *           type: integer
 *           description: 週數
 *           example: 1
 *         title:
 *           type: string
 *           description: 成果標題
 *           example: "第一週學習成果"
 *         date:
 *           type: string
 *           format: date-time
 *           description: 日期
 *           example: "2024-01-15T10:30:00Z"
 *         content:
 *           type: string
 *           description: 成果內容
 *           example: "完成了 React 基礎專案，包含組件設計和狀態管理。"
 *         imgUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 圖片 URL 列表
 *           example: ["https://example.com/project-screenshot.jpg"]
 *         videoUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 影片 URL 列表
 *           example: ["https://example.com/demo-video.mp4"]
 *         visibility:
 *           $ref: '#/components/schemas/Visibility'
 *     
 *     OutcomeUpdateRequest:
 *       type: object
 *       properties:
 *         week:
 *           type: integer
 *           description: 週數
 *           example: 2
 *         title:
 *           type: string
 *           description: 成果標題
 *           example: "第二週學習成果"
 *         date:
 *           type: string
 *           format: date-time
 *           description: 日期
 *           example: "2024-01-22T10:30:00Z"
 *         content:
 *           type: string
 *           description: 成果內容
 *           example: "完成了進階 React 專案，加入了路由和狀態管理庫。"
 *         imgUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 圖片 URL 列表
 *           example: ["https://example.com/updated-screenshot.jpg"]
 *         videoUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 影片 URL 列表
 *           example: ["https://example.com/updated-demo.mp4"]
 *         visibility:
 *           $ref: '#/components/schemas/Visibility'
 *     
 *     OutcomeResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 成果 ID
 *           example: 1
 *         week:
 *           type: integer
 *           description: 週數
 *           example: 1
 *         title:
 *           type: string
 *           description: 成果標題
 *           example: "第一週學習成果"
 *         content:
 *           type: string
 *           description: 成果內容
 *           example: "完成了 React 基礎專案，包含組件設計和狀態管理。"
 *         date:
 *           type: string
 *           format: date-time
 *           description: 日期
 *           example: "2024-01-15T10:30:00Z"
 *         imgUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 圖片 URL 列表
 *           example: ["https://example.com/project-screenshot.jpg"]
 *         videoUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 影片 URL 列表
 *           example: ["https://example.com/demo-video.mp4"]
 *         visibility:
 *           type: string
 *           description: 可見性
 *           example: "public"
 *     
 *     PaginatedOutcomesResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OutcomeResponse'
 *           description: 成果列表
 *         page:
 *           type: integer
 *           description: 當前頁數
 *           example: 1
 *         pageSize:
 *           type: integer
 *           description: 每頁項目數
 *           example: 10
 *         totalCount:
 *           type: integer
 *           description: 總項目數
 *           example: 50
 *         totalPages:
 *           type: integer
 *           description: 總頁數
 *           example: 5
 *     
 *     OutcomeStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: 總成果數量
 *           example: 50
 *         public:
 *           type: integer
 *           description: 公開成果數量
 *           example: 35
 *         private:
 *           type: integer
 *           description: 私人成果數量
 *           example: 15
 *         withImages:
 *           type: integer
 *           description: 包含圖片的成果數量
 *           example: 40
 *         withVideos:
 *           type: integer
 *           description: 包含影片的成果數量
 *           example: 20
 *         byWeek:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: 按週統計的成果數量
 *           example:
 *             "1": 5
 *             "2": 8
 *             "3": 6
 */

export {};