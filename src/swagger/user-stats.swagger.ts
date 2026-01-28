/**
 * Swagger 文檔 - 使用者統計 API
 * 為所有統計端點提供詳細的 API 文檔
 */

/**
 * @swagger
 * tags:
 *   name: User Statistics
 *   description: 使用者統計 API（僅管理員）
 */

/**
 * @swagger
 * /api/v1/admin/user-stats/overview:
 *   get:
 *     summary: 獲取總覽儀表板
 *     description: 返回使用者統計的關鍵指標摘要，包括總使用者數、本月新增、增長率、活躍使用者等
 *     tags: [User Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回總覽統計
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                       description: 總使用者數
 *                       example: 1500
 *                     newUsersThisMonth:
 *                       type: number
 *                       description: 本月新增使用者數
 *                       example: 120
 *                     newUsersLastMonth:
 *                       type: number
 *                       description: 上月新增使用者數
 *                       example: 100
 *                     growthRate:
 *                       type: number
 *                       description: 增長率（百分比）
 *                       example: 20.00
 *                     activeUsers:
 *                       type: number
 *                       description: 活躍使用者數（最近30天）
 *                       example: 850
 *                     activeRate:
 *                       type: number
 *                       description: 活躍率（百分比）
 *                       example: 56.67
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                       description: 統計生成時間
 *       401:
 *         description: 未授權
 *       403:
 *         description: 權限不足（需要管理員權限）
 */

/**
 * @swagger
 * /api/v1/admin/user-stats/registrations:
 *   get:
 *     summary: 獲取註冊統計
 *     description: 根據不同維度（時間、地區、角色、教育階段）獲取使用者註冊統計資料
 *     tags: [User Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         required: true
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, location, role, education_stage]
 *         description: 統計分組方式
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: 開始日期（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         description: 結束日期（YYYY-MM-DD）
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: integer
 *         description: 地區 ID 篩選
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         description: 角色 ID 篩選
 *       - in: query
 *         name: educationStage
 *         schema:
 *           type: string
 *         description: 教育階段篩選
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 1000
 *         description: 分頁限制
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 分頁偏移
 *     responses:
 *       200:
 *         description: 成功返回註冊統計
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   oneOf:
 *                     - type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             example: "2024-01-01"
 *                           count:
 *                             type: number
 *                             example: 25
 *                           label:
 *                             type: string
 *                             example: "2024-01-01"
 *                     - type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           locationId:
 *                             type: number
 *                             nullable: true
 *                           country:
 *                             type: string
 *                             nullable: true
 *                           city:
 *                             type: string
 *                             nullable: true
 *                           isTaiwan:
 *                             type: boolean
 *                             nullable: true
 *                           userCount:
 *                             type: number
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     groupBy:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 參數錯誤
 *       401:
 *         description: 未授權
 *       403:
 *         description: 權限不足
 */

/**
 * @swagger
 * /api/v1/admin/user-stats/activity:
 *   get:
 *     summary: 獲取活躍度統計
 *     description: 分析使用者活躍度，可選擇按角色、地區或教育階段分組
 *     tags: [User Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeWithinDays
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 365
 *         description: 活躍度時間範圍（天數）
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [role, location, education_stage]
 *         description: 統計分組方式
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 1000
 *         description: 分頁限制
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 分頁偏移
 *     responses:
 *       200:
 *         description: 成功返回活躍度統計
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeUsers:
 *                       type: number
 *                       description: 活躍使用者數
 *                       example: 850
 *                     inactiveUsers:
 *                       type: number
 *                       description: 非活躍使用者數
 *                       example: 650
 *                     totalUsers:
 *                       type: number
 *                       description: 總使用者數
 *                       example: 1500
 *                     activeRate:
 *                       type: number
 *                       description: 活躍率（百分比）
 *                       example: 56.67
 *                     breakdown:
 *                       type: object
 *                       description: 細分統計（如果提供 groupBy）
 *                       nullable: true
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     activeWithinDays:
 *                       type: number
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 參數錯誤
 *       401:
 *         description: 未授權
 *       403:
 *         description: 權限不足
 */

/**
 * @swagger
 * /api/v1/admin/user-stats/export:
 *   get:
 *     summary: 匯出統計資料
 *     description: 將統計資料匯出為 CSV 或 Excel 格式
 *     tags: [User Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *         description: 匯出格式
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [registrations, activity, full]
 *         description: 匯出類型
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: 開始日期（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         description: 結束日期（YYYY-MM-DD）
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, location, role, education_stage]
 *         description: 統計分組方式（type=registrations 時必選）
 *     responses:
 *       200:
 *         description: 成功匯出檔案
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: 參數錯誤
 *       401:
 *         description: 未授權
 *       403:
 *         description: 權限不足
 */
