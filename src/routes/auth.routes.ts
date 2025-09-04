/**
 * 認證路由
 * 處理用戶認證相關的路由
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import {
  authenticateJWT,
  authenticateAny
} from '../middleware/auth';
import {
  authenticateGoogle,
  authenticateGoogleCallback
} from '../services/auth/oauth.service';
import { validate } from '../middleware/validation.middleware';
import {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator
} from '../validators/auth.validators';

const router = Router();

/**
 * POST /auth/login
 * 用戶登入
 * 請求體：LoginRequest - 包含 email, password, rememberMe
 */
router.post('/login',
  validate(loginValidator, 'body'),
  authController.login
);

/**
 * POST /auth/register
 * 用戶註冊
 * 請求體：RegisterRequest - 包含 username, email, password, confirmPassword, name
 */
router.post('/register',
  validate(registerValidator, 'body'),
  authController.register
);

/**
 * POST /auth/logout
 * 用戶登出
 * 需要認證（JWT 或 Session）
 */
router.post('/logout',
  authenticateAny,
  authController.logout
);

/**
 * POST /auth/refresh
 * 刷新認證令牌
 * 需要有效的 JWT token
 */
router.post('/refresh',
  authenticateJWT,
  authController.refreshToken
);

/**
 * POST /auth/forgot-password
 * 請求密碼重設
 * 請求體：{ email }
 */
router.post('/forgot-password',
  validate(forgotPasswordValidator, 'body'),
  authController.forgotPassword
);

/**
 * POST /auth/reset-password
 * 確認密碼重設
 * 請求體：{ token, newPassword, confirmPassword }
 */
router.post('/reset-password',
  validate(resetPasswordValidator, 'body'),
  authController.resetPassword
);

/**
 * POST /auth/verify-email
 * 驗證電子郵件
 * 請求體：{ token, email }
 */
router.post('/verify-email',
  validate(verifyEmailValidator, 'body'),
  authController.verifyEmail
);

// Google OAuth 路由
/**
 * GET /auth/google
 * 開始 Google OAuth 認證
 * 重定向到 Google OAuth 授權頁面
 */
router.get('/google', authenticateGoogle);

/**
 * GET /auth/google/callback
 * Google OAuth 回調
 * 處理 Google OAuth 認證回調
 * 查詢參數：code, state (由 Google 提供)
 */
router.get('/google/callback',
  authenticateGoogleCallback,
  authController.googleCallback
);

/**
 * GET /auth/google/failure
 * Google OAuth 認證失敗
 * 返回認證失敗錯誤
 */
router.get('/google/failure', (req, res) => {
  res.status(401).json({
    success: false,
    error: {
      type: 'unauthorized',
      message: 'Google 認證失敗'
    }
  });
});

export default router;