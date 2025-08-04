/**
 * @swagger
 * /api/v1/monitor:
 *   get:
 *     summary: 取得系統監控資訊
 *     description: 返回系統、資料庫和磁碟的監控資訊
 *     tags: [System Monitor]
 *     responses:
 *       200:
 *         description: 成功取得監控資訊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 system:
 *                   type: object
 *                   properties:
 *                     hostname:
 *                       type: string
 *                       description: 主機名稱
 *                     platform:
 *                       type: string
 *                       description: 作業系統平台
 *                     arch:
 *                       type: string
 *                       description: 系統架構
 *                     uptime:
 *                       type: number
 *                       description: 系統運行時間（秒）
 *                     loadAverage:
 *                       type: array
 *                       items:
 *                         type: number
 *                       description: 系統負載平均值
 *                     totalMemory:
 *                       type: number
 *                       description: 總記憶體（bytes）
 *                     freeMemory:
 *                       type: number
 *                       description: 可用記憶體（bytes）
 *                     processMemory:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: number
 *                         heapTotal:
 *                           type: number
 *                         heapUsed:
 *                           type: number
 *                         external:
 *                           type: number
 *                         arrayBuffers:
 *                           type: number
 *                       description: 程序記憶體使用情況
 *                 mongo:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       description: MongoDB 連線狀態
 *                     database:
 *                       type: string
 *                       description: 資料庫名稱
 *                     collections:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: 集合列表
 *                     error:
 *                       type: string
 *                       description: 錯誤訊息（如有）
 *                 postgres:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                       description: PostgreSQL 版本
 *                     current_connections:
 *                       type: number
 *                       description: 當前連線數
 *                     max_connections:
 *                       type: number
 *                       description: 最大連線數
 *                     database_size:
 *                       type: string
 *                       description: 資料庫大小
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                       description: 資料庫啟動時間
 *                     config:
 *                       type: object
 *                       additionalProperties:
 *                         type: string
 *                       description: 配置參數
 *                     tables:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           table_name:
 *                             type: string
 *                             description: 表格名稱
 *                           size:
 *                             type: string
 *                             description: 表格大小
 *                           row_count:
 *                             type: number
 *                             description: 資料筆數
 *                     error:
 *                       type: string
 *                       description: 錯誤訊息（如有）
 *                 disk:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filesystem:
 *                         type: string
 *                         description: 檔案系統
 *                       type:
 *                         type: string
 *                         description: 類型
 *                       size:
 *                         type: number
 *                         description: 總大小（bytes）
 *                       used:
 *                         type: number
 *                         description: 已使用（bytes）
 *                       available:
 *                         type: number
 *                         description: 可用空間（bytes）
 *                       use:
 *                         type: number
 *                         description: 使用率（%）
 *                       mount:
 *                         type: string
 *                         description: 掛載點
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */