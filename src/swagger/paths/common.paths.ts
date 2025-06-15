/**
 * @swagger
 * /health:
 *   get:
 *     summary: API 健康檢查
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API 運行正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *                 - timestamp
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *                 uptime:
 *                   type: number
 *                   description: 系統運行時間（秒）
 *                   example: 86400
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "connected"
 *                     responseTime:
 *                       type: number
 *                       description: 資料庫響應時間（毫秒）
 *                       example: 12
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /info:
 *   get:
 *     summary: API 版本資訊
 *     tags: [System]
 *     responses:
 *       200:
 *         description: 成功獲取 API 資訊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - name
 *                 - version
 *                 - description
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "DaoDao 資源管理 API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 description:
 *                   type: string
 *                   example: "提供資源管理、心得評價和標籤功能的 RESTful API"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 node_version:
 *                   type: string
 *                   example: "18.17.0"
 *                 database:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "PostgreSQL"
 *                     version:
 *                       type: string
 *                       example: "14.9"
 *                 features:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["資源管理", "心得評價", "標籤系統", "分頁查詢", "全文搜索"]
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */