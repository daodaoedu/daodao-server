/**
 * @swagger
 * /api/v1/email/contact:
 *   post:
 *     tags: [Email]
 *     summary: 發送聯絡郵件
 *     description: 發送聯絡表單郵件給指定收件人
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactEmailRequest'
 *     responses:
 *       200:
 *         description: 郵件發送成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/email/verification:
 *   post:
 *     tags: [Email]
 *     summary: 發送驗證郵件
 *     description: 發送電子郵件地址驗證郵件
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerificationEmailRequest'
 *     responses:
 *       200:
 *         description: 驗證郵件發送成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/email/welcome:
 *   post:
 *     tags: [Email]
 *     summary: 發送歡迎郵件
 *     description: 發送新用戶歡迎郵件（需要管理員權限）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WelcomeEmailRequest'
 *     responses:
 *       200:
 *         description: 歡迎郵件發送成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/email/password-reset:
 *   post:
 *     tags: [Email]
 *     summary: 發送密碼重設郵件
 *     description: 發送密碼重設連結郵件（支援未登入用戶）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetEmailRequest'
 *     responses:
 *       200:
 *         description: 密碼重設郵件發送成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/email/marathon:
 *   post:
 *     tags: [Email]
 *     summary: 發送馬拉松郵件
 *     description: 發送馬拉松活動相關郵件（需要管理員權限）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarathonEmailRequest'
 *     responses:
 *       200:
 *         description: 馬拉松郵件發送成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/email/custom:
 *   post:
 *     tags: [Email]
 *     summary: 發送自定義郵件
 *     description: 使用自定義模板或內容發送郵件（需要管理員權限）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomEmailRequest'
 *     responses:
 *       200:
 *         description: 自定義郵件發送成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/email/bulk:
 *   post:
 *     tags: [Email]
 *     summary: 批量發送郵件
 *     description: 向多個收件人批量發送個人化郵件（需要管理員權限）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkEmailRequest'
 *     responses:
 *       200:
 *         description: 批量郵件發送成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 批量郵件已排入發送隊列
 *                 data:
 *                   type: object
 *                   properties:
 *                     batchId:
 *                       type: string
 *                       example: batch_123abc
 *                     totalRecipients:
 *                       type: integer
 *                       example: 50
 *                     status:
 *                       type: string
 *                       example: queued
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/email/validate:
 *   post:
 *     tags: [Email]
 *     summary: 驗證郵件地址
 *     description: 檢查郵件地址格式是否有效
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateEmailRequest'
 *     responses:
 *       200:
 *         description: 驗證結果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateEmailResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/email/preview:
 *   post:
 *     tags: [Email]
 *     summary: 預覽郵件模板
 *     description: 預覽指定模板的郵件內容
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PreviewEmailRequest'
 *     responses:
 *       200:
 *         description: 郵件預覽成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PreviewEmailResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/email/stats:
 *   get:
 *     tags: [Email]
 *     summary: 獲取郵件統計
 *     description: 獲取郵件發送統計資料（需要管理員權限）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 統計開始時間
 *         example: 2024-01-01T00:00:00Z
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 統計結束時間
 *         example: 2024-04-01T00:00:00Z
 *     responses:
 *       200:
 *         description: 郵件統計資料
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailStatsResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/email/health:
 *   get:
 *     tags: [Email]
 *     summary: 檢查郵件服務健康狀態
 *     description: 檢查郵件服務的運行狀態和健康情況（需要管理員權限）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 郵件服務健康狀態
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailHealthResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */