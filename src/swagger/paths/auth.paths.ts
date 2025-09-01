/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 用戶登入（暫不支援）
 *     description: 密碼登入功能暫時不可用，請使用 Google OAuth 登入
 *     tags: [Authentication]
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       401:
 *         description: 功能暫不支援，請使用 Google 登入
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *               example:
 *                 success: false
 *                 error:
 *                   type: "unauthorized"
 *                   message: "請使用 Google 登入"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/auth/register:
 *   post:
 *     summary: 用戶註冊（暫不支援）
 *     description: 註冊功能暫時不可用，請使用 Google OAuth 登入
 *     tags: [Authentication]
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       400:
 *         description: 功能暫不支援，請使用 Google 登入
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *               example:
 *                 success: false
 *                 error:
 *                   type: "bad_request"
 *                   message: "註冊功能暫時不可用，請使用 Google 登入"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/auth/logout:
 *   post:
 *     summary: 用戶登出
 *     description: 登出當前用戶（客戶端需要刪除本地 token）
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *       - SessionAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 刷新認證令牌
 *     description: 使用現有的 JWT token 生成新的 token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 令牌刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/auth/me:
 *   get:
 *     summary: 獲取當前用戶資訊
 *     description: 返回當前已認證用戶的個人資訊
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *       - SessionAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取用戶資訊
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: 請求密碼重設（暫不支援）
 *     description: 密碼重設功能暫時不可用，請使用 Google OAuth 登入
 *     tags: [Authentication]
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       400:
 *         description: 功能暫不支援，請使用 Google 登入
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: 確認密碼重設（暫不支援）
 *     description: 密碼重設功能暫時不可用，請使用 Google OAuth 登入
 *     tags: [Authentication]
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       400:
 *         description: 功能暫不支援，請使用 Google 登入
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: 驗證電子郵件
 *     description: 使用驗證令牌確認用戶的電子郵件地址
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailRequest'
 *     responses:
 *       200:
 *         description: 電子郵件驗證成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/auth/google:
 *   get:
 *     summary: 開始 Google OAuth 認證
 *     description: 重定向到 Google OAuth 授權頁面
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: 重定向到 Google OAuth 授權頁面
 *         headers:
 *           Location:
 *             description: Google OAuth 授權 URL
 *             schema:
 *               type: string
 *               example: "https://accounts.google.com/oauth/authorize?..."
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth 回調
 *     description: 處理 Google OAuth 認證回調，完成用戶認證
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Google OAuth 授權碼
 *         example: "4/0AX4XfWi..."
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: 狀態參數（防止 CSRF 攻擊）
 *         example: "random-state-string"
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: 錯誤代碼（當授權失敗時）
 *         example: "access_denied"
 *     responses:
 *       302:
 *         description: 認證成功，重定向到前端應用
 *         headers:
 *           Location:
 *             description: 重定向 URL，包含認證令牌
 *             schema:
 *               type: string
 *               example: "https://app.example.com/dashboard?token=eyJ..."
 *       401:
 *         description: Google OAuth 認證失敗
 *         headers:
 *           Location:
 *             description: 重定向到失敗頁面
 *             schema:
 *               type: string
 *               example: "https://app.example.com/auth/failure"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/auth/google/failure:
 *   get:
 *     summary: Google OAuth 認證失敗
 *     description: 當 Google OAuth 認證失敗時的處理端點
 *     tags: [OAuth]
 *     responses:
 *       401:
 *         description: Google OAuth 認證失敗
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Google 認證失敗"
 *                 error:
 *                   type: string
 *                   description: 詳細錯誤資訊
 *                   example: "OAuth authentication was cancelled by user"
 */