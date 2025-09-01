/**
 * @swagger
 * components:
 *   schemas:
 *     MilestoneCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - startDate
 *         - endDate
 *       properties:
 *         position:
 *           type: integer
 *           description: 里程碑位置順序
 *           example: 1
 *         name:
 *           type: string
 *           description: 里程碑名稱
 *           example: "第一階段：基礎學習"
 *         description:
 *           type: string
 *           description: 里程碑描述
 *           example: "完成基本概念學習和練習"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: 開始日期
 *           example: "2024-01-01T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: 結束日期
 *           example: "2024-01-31T23:59:59Z"
 *         isCompleted:
 *           type: boolean
 *           description: 是否已完成
 *           default: false
 *           example: false
 *     
 *     MilestoneUpdateRequest:
 *       type: object
 *       properties:
 *         position:
 *           type: integer
 *           description: 里程碑位置順序
 *           example: 2
 *         name:
 *           type: string
 *           description: 里程碑名稱
 *           example: "第二階段：進階實作"
 *         description:
 *           type: string
 *           description: 里程碑描述
 *           example: "完成專案實作和優化"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: 開始日期
 *           example: "2024-02-01T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: 結束日期
 *           example: "2024-02-28T23:59:59Z"
 *         isCompleted:
 *           type: boolean
 *           description: 是否已完成
 *           example: true
 *     
 *     TaskResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 任務 ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 任務名稱
 *           example: "閱讀相關文件"
 *         position:
 *           type: integer
 *           description: 任務位置順序
 *           example: 1
 *         description:
 *           type: string
 *           description: 任務描述
 *           example: "閱讀官方文件和教學"
 *         daysOfWeek:
 *           description: 任務執行的星期
 *           example: null
 *         isCompleted:
 *           type: boolean
 *           description: 是否已完成
 *           example: false
 *     
 *     MilestoneResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 里程碑 ID
 *           example: 1
 *         position:
 *           type: integer
 *           description: 里程碑位置順序
 *           example: 1
 *         name:
 *           type: string
 *           description: 里程碑名稱
 *           example: "第一階段：基礎學習"
 *         description:
 *           type: string
 *           description: 里程碑描述
 *           example: "完成基本概念學習和練習"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: 開始日期
 *           example: "2024-01-01T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: 結束日期
 *           example: "2024-01-31T23:59:59Z"
 *         isCompleted:
 *           type: boolean
 *           description: 是否已完成
 *           example: false
 *         tasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TaskResponse'
 *           description: 相關任務列表
 *     
 *     MilestoneStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: 總里程碑數量
 *           example: 5
 *         completed:
 *           type: integer
 *           description: 已完成里程碑數量
 *           example: 2
 *         pending:
 *           type: integer
 *           description: 待完成里程碑數量
 *           example: 2
 *         overdue:
 *           type: integer
 *           description: 逾期里程碑數量
 *           example: 1
 */

export {};