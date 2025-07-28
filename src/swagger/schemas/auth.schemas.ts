/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 用戶電子郵件
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: 用戶密碼
 *           example: "securePassword123"
 *         rememberMe:
 *           type: boolean
 *           description: 記住我選項
 *           default: false
 *           example: false
 *     
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - confirmPassword
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: 用戶名
 *           example: "john_doe"
 *         email:
 *           type: string
 *           format: email
 *           description: 電子郵件
 *           example: "john@example.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: 密碼
 *           example: "securePassword123"
 *         confirmPassword:
 *           type: string
 *           format: password
 *           description: 確認密碼
 *           example: "securePassword123"
 *         name:
 *           type: string
 *           description: 顯示名稱
 *           example: "John Doe"
 *     
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 用戶電子郵件
 *           example: "user@example.com"
 *     
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *         - confirmPassword
 *       properties:
 *         token:
 *           type: string
 *           description: 密碼重設令牌
 *           example: "reset-token-uuid"
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: 新密碼
 *           example: "newSecurePassword123"
 *         confirmPassword:
 *           type: string
 *           format: password
 *           description: 確認新密碼
 *           example: "newSecurePassword123"
 *     
 *     VerifyEmailRequest:
 *       type: object
 *       required:
 *         - token
 *         - email
 *       properties:
 *         token:
 *           type: string
 *           description: 郵件驗證令牌
 *           example: "verify-token-uuid"
 *         email:
 *           type: string
 *           format: email
 *           description: 用戶電子郵件
 *           example: "user@example.com"
 *     
 *     AuthResponse:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: 操作是否成功
 *           example: true
 *         message:
 *           type: string
 *           description: 響應訊息
 *           example: "登入成功"
 *         token:
 *           type: string
 *           description: JWT 認證令牌
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           $ref: '#/components/schemas/UserProfile'
 *         isTemporary:
 *           type: boolean
 *           description: 是否為臨時用戶
 *           example: false
 *         redirectUrl:
 *           type: string
 *           description: 重定向 URL
 *           example: "https://app.example.com/dashboard"
 *     
 *     UserProfile:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: integer
 *           description: 用戶 ID
 *           example: 1
 *         username:
 *           type: string
 *           description: 用戶名
 *           example: "john_doe"
 *         email:
 *           type: string
 *           format: email
 *           description: 電子郵件
 *           example: "john@example.com"
 *         name:
 *           type: string
 *           description: 顯示名稱
 *           example: "John Doe"
 *         photo_url:
 *           type: string
 *           nullable: true
 *           description: 頭像 URL
 *           example: "https://example.com/avatar.jpg"
 *         is_active:
 *           type: boolean
 *           description: 帳號是否啟用
 *           example: true
 *         email_verified:
 *           type: boolean
 *           description: 電子郵件是否已驗證
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 建立時間
 *           example: "2024-01-15T10:30:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 更新時間
 *           example: "2024-01-15T10:30:00Z"
 *         last_login_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 最後登入時間
 *           example: "2024-01-15T09:15:00Z"
 *     
 *     TempUserProfile:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: 臨時用戶 ID
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           description: 電子郵件
 *           example: "temp@example.com"
 *         name:
 *           type: string
 *           description: 顯示名稱
 *           example: "Temp User"
 *         photo_url:
 *           type: string
 *           nullable: true
 *           description: 頭像 URL
 *           example: "https://example.com/avatar.jpg"
 *         google_id:
 *           type: string
 *           description: Google OAuth ID
 *           example: "google-oauth-id"
 *         is_verified:
 *           type: boolean
 *           description: 是否已驗證
 *           example: false
 *         expires_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 過期時間
 *           example: "2024-01-22T10:30:00Z"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 建立時間
 *           example: "2024-01-15T10:30:00Z"
 *   
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT 認證令牌，格式：Bearer {token}
 *     
 *     SessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 *       description: Session 認證，基於 cookie
 *   
 *   responses:
 *     UnauthorizedError:
 *       description: 未授權錯誤
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ErrorResponse'
 *               - type: object
 *                 properties:
 *                   message:
 *                     example: "未經授權的訪問"
 *     
 *     ForbiddenError:
 *       description: 禁止存取錯誤
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ErrorResponse'
 *               - type: object
 *                 properties:
 *                   message:
 *                     example: "無權限執行此操作"
 *     
 *     ConflictError:
 *       description: 資源衝突錯誤
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ErrorResponse'
 *               - type: object
 *                 properties:
 *                   message:
 *                     example: "此電子郵件已被註冊"
 */