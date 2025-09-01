/**
 * @swagger
 * components:
 *   schemas:
 *     ContactEmailRequest:
 *       type: object
 *       required:
 *         - from
 *         - to
 *         - subject
 *         - text
 *         - name
 *       properties:
 *         from:
 *           type: string
 *           format: email
 *           description: 寄件人電子郵件地址
 *           example: sender@example.com
 *         to:
 *           type: string
 *           format: email
 *           description: 收件人電子郵件地址
 *           example: receiver@example.com
 *         subject:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: 郵件主旨
 *           example: 聯絡表單詢問
 *         text:
 *           type: string
 *           minLength: 1
 *           maxLength: 5000
 *           description: 郵件內容
 *           example: 這是一封聯絡郵件的內容
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 寄件人姓名
 *           example: 張三
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: 標題
 *           example: 產品詢問
 *         information:
 *           oneOf:
 *             - type: string
 *               maxLength: 500
 *             - type: array
 *               items:
 *                 type: string
 *                 maxLength: 100
 *               maxItems: 10
 *           description: 聯絡資訊
 *         activityTitle:
 *           type: string
 *           maxLength: 200
 *           description: 活動標題
 *
 *     VerificationEmailRequest:
 *       type: object
 *       required:
 *         - email
 *         - verifyLink
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 收件人電子郵件地址
 *           example: user@example.com
 *         verifyLink:
 *           type: string
 *           format: uri
 *           description: 驗證連結
 *           example: https://example.com/verify?token=abc123
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: 收件人姓名
 *           example: 李四
 *
 *     WelcomeEmailRequest:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 收件人電子郵件地址
 *           example: newuser@example.com
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 收件人姓名
 *           example: 王五
 *
 *     PasswordResetEmailRequest:
 *       type: object
 *       required:
 *         - email
 *         - resetLink
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 收件人電子郵件地址
 *           example: user@example.com
 *         resetLink:
 *           type: string
 *           format: uri
 *           description: 密碼重設連結
 *           example: https://example.com/reset-password?token=xyz789
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: 收件人姓名
 *           example: 趙六
 *
 *     MarathonEmailRequest:
 *       type: object
 *       required:
 *         - email
 *         - name
 *         - marathonTitle
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 收件人電子郵件地址
 *           example: participant@example.com
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 收件人姓名
 *           example: 孫七
 *         marathonTitle:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: 馬拉松活動標題
 *           example: 2024 春季程式馬拉松
 *         marathonDate:
 *           type: string
 *           maxLength: 100
 *           description: 馬拉松日期
 *           example: 2024-04-15
 *         marathonDescription:
 *           type: string
 *           maxLength: 1000
 *           description: 馬拉松活動描述
 *           example: 為期兩天的程式設計挑戰賽
 *
 *     CustomEmailRequest:
 *       type: object
 *       required:
 *         - to
 *         - subject
 *       properties:
 *         to:
 *           oneOf:
 *             - type: string
 *               format: email
 *             - type: array
 *               items:
 *                 type: string
 *                 format: email
 *               minItems: 1
 *               maxItems: 50
 *           description: 收件人電子郵件地址（單個或多個）
 *           example: user@example.com
 *         subject:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: 郵件主旨
 *           example: 自定義郵件主旨
 *         htmlContent:
 *           type: string
 *           maxLength: 50000
 *           description: HTML 格式的郵件內容
 *           example: <h1>標題</h1><p>內容</p>
 *         template:
 *           type: string
 *           enum: [welcome, verification, password-reset, contact, marathon, custom]
 *           description: 郵件模板類型
 *           example: welcome
 *         data:
 *           type: object
 *           additionalProperties: true
 *           description: 模板替換資料
 *           example:
 *             userName: 張三
 *             productName: DaoDao Learning
 *
 *     BulkEmailRecipient:
 *       type: object
 *       required:
 *         - email
 *         - data
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 收件人電子郵件地址
 *           example: recipient@example.com
 *         data:
 *           type: object
 *           additionalProperties: true
 *           description: 個人化資料
 *           example:
 *             name: 李四
 *             customField: value
 *
 *     BulkEmailRequest:
 *       type: object
 *       required:
 *         - template
 *         - subject
 *         - recipients
 *       properties:
 *         template:
 *           type: string
 *           enum: [welcome, verification, password-reset, contact, marathon, custom]
 *           description: 郵件模板類型
 *           example: welcome
 *         subject:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: 郵件主旨
 *           example: 批量郵件主旨
 *         recipients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BulkEmailRecipient'
 *           minItems: 1
 *           maxItems: 100
 *           description: 收件人列表
 *         from:
 *           type: string
 *           format: email
 *           description: 寄件人電子郵件地址
 *           example: noreply@example.com
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           description: 排程發送時間
 *           example: 2024-04-15T10:00:00Z
 *
 *     ValidateEmailRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           minLength: 1
 *           description: 要驗證的電子郵件地址
 *           example: test@example.com
 *
 *     PreviewEmailRequest:
 *       type: object
 *       required:
 *         - template
 *         - data
 *       properties:
 *         template:
 *           type: string
 *           enum: [welcome, verification, password-reset, contact, marathon, custom]
 *           description: 郵件模板類型
 *           example: welcome
 *         data:
 *           type: object
 *           additionalProperties: true
 *           description: 模板資料
 *           example:
 *             userName: 預覽用戶
 *             companyName: 測試公司
 *
 *     EmailStatsResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 sent:
 *                   type: integer
 *                   description: 已發送郵件數量
 *                   example: 1500
 *                 failed:
 *                   type: integer
 *                   description: 發送失敗郵件數量
 *                   example: 15
 *                 pending:
 *                   type: integer
 *                   description: 待發送郵件數量
 *                   example: 100
 *                 totalRecipients:
 *                   type: integer
 *                   description: 總收件人數量
 *                   example: 1615
 *                 period:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-01T00:00:00Z
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                   example: 2024-04-01T00:00:00Z
 *
 *     EmailHealthResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   description: 服務健康狀態
 *                   example: healthy
 *                 provider:
 *                   type: string
 *                   description: 郵件服務提供商
 *                   example: SendGrid
 *                 lastCheck:
 *                   type: string
 *                   format: date-time
 *                   description: 最後檢查時間
 *                   example: 2024-04-01T12:00:00Z
 *                 responseTime:
 *                   type: number
 *                   description: 響應時間（毫秒）
 *                   example: 150
 *                 details:
 *                   type: object
 *                   additionalProperties: true
 *                   description: 詳細健康資訊
 *
 *     EmailResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 messageId:
 *                   type: string
 *                   description: 郵件訊息ID
 *                   example: msg_abc123xyz
 *                 status:
 *                   type: string
 *                   enum: [sent, queued, failed]
 *                   description: 發送狀態
 *                   example: sent
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 發送時間戳
 *                   example: 2024-04-01T12:00:00Z
 *
 *     ValidateEmailResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   description: 郵件地址是否有效
 *                   example: true
 *                 reason:
 *                   type: string
 *                   description: 驗證結果原因
 *                   example: Email format is valid
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 建議的修正
 *                   example: []
 *
 *     PreviewEmailResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 subject:
 *                   type: string
 *                   description: 郵件主旨預覽
 *                   example: 歡迎加入 DaoDao Learning
 *                 htmlContent:
 *                   type: string
 *                   description: HTML 內容預覽
 *                   example: <html>...</html>
 *                 textContent:
 *                   type: string
 *                   description: 純文字內容預覽
 *                   example: 歡迎加入...
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     template:
 *                       type: string
 *                       example: welcome
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-04-01T12:00:00Z
 */