/**
 * @swagger
 * components:
 *   schemas:
 *     NoteCreateRequest:
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
 *           description: 便利貼標題
 *           example: "第一週學習筆記"
 *         date:
 *           type: string
 *           format: date-time
 *           description: 日期
 *           example: "2024-01-15T10:30:00Z"
 *         content:
 *           type: string
 *           description: 便利貼內容
 *           example: "今天學習了 React 基礎概念，包括組件和狀態管理。"
 *         imgUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 圖片 URL 列表
 *           example: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *         videoUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 影片 URL 列表
 *           example: ["https://example.com/video1.mp4"]
 *         visibility:
 *           $ref: '#/components/schemas/Visibility'
 *     
 *     NoteUpdateRequest:
 *       type: object
 *       properties:
 *         week:
 *           type: integer
 *           description: 週數
 *           example: 2
 *         title:
 *           type: string
 *           description: 便利貼標題
 *           example: "第二週學習筆記"
 *         date:
 *           type: string
 *           format: date-time
 *           description: 日期
 *           example: "2024-01-22T10:30:00Z"
 *         content:
 *           type: string
 *           description: 便利貼內容
 *           example: "本週深入學習了 React Hooks，特別是 useState 和 useEffect。"
 *         imgUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 圖片 URL 列表
 *           example: ["https://example.com/updated-image.jpg"]
 *         videoUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 影片 URL 列表
 *           example: ["https://example.com/updated-video.mp4"]
 *         visibility:
 *           $ref: '#/components/schemas/Visibility'
 *     
 *     NoteResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 便利貼 ID
 *           example: 1
 *         week:
 *           type: integer
 *           description: 週數
 *           example: 1
 *         title:
 *           type: string
 *           description: 便利貼標題
 *           example: "第一週學習筆記"
 *         content:
 *           type: string
 *           description: 便利貼內容
 *           example: "今天學習了 React 基礎概念，包括組件和狀態管理。"
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
 *           example: ["https://example.com/image1.jpg"]
 *         videoUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: 影片 URL 列表
 *           example: ["https://example.com/video1.mp4"]
 *         visibility:
 *           type: string
 *           description: 可見性
 *           example: "private"
 *         user:
 *           $ref: '#/components/schemas/UserBasicInfo'
 *     
 *     PaginatedNotesResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NoteResponse'
 *           description: 便利貼列表
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
 *     NoteStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: 總便利貼數量
 *           example: 50
 *         public:
 *           type: integer
 *           description: 公開便利貼數量
 *           example: 30
 *         private:
 *           type: integer
 *           description: 私人便利貼數量
 *           example: 20
 *         withImages:
 *           type: integer
 *           description: 包含圖片的便利貼數量
 *           example: 15
 *         withVideos:
 *           type: integer
 *           description: 包含影片的便利貼數量
 *           example: 8
 */

export {};