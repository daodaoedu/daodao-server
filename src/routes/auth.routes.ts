/**
 * 認證路由
 * 處理用戶認證相關的路由
 */

import { Router } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';
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
  verifyEmailValidator,
  oauthStateValidator,
  loginSuccessResponseSchema,
  logoutResponseSchema,
  refreshTokenResponseSchema,
  verifyEmailResponseSchema,
  getCurrentUserResponseSchema
} from '../validators/auth.validators';
import { apiSuccessResponseSchema } from '../validators/api-response.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * POST /api/v1/auth/login - 用戶登入
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Authentication'],
  summary: '用戶登入',
  description: '使用電子郵件和密碼進行用戶登入',
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginValidator
        }
      }
    }
  },
  responses: {
    200: {
      description: '登入成功',
      content: {
        'application/json': {
          schema: loginSuccessResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

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
 * POST /api/v1/auth/register - 用戶註冊
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  tags: ['Authentication'],
  summary: '用戶註冊',
  description: '註冊新用戶帳號',
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerValidator
        }
      }
    }
  },
  responses: {
    201: {
      description: '註冊成功',
      content: {
        'application/json': {
          schema: loginSuccessResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    409: {
      description: '用戶已存在',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.null(),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          }).openapi({
            description: '用戶已存在錯誤響應'
          })
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

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
 * POST /api/v1/auth/logout - 用戶登出
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Authentication'],
  summary: '用戶登出',
  description: '登出當前用戶會話',
  responses: {
    200: {
      description: '登出成功',
      content: {
        'application/json': {
          schema: logoutResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

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
 * POST /api/v1/auth/refresh - 刷新認證令牌
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  tags: ['Authentication'],
  summary: '刷新認證令牌',
  description: '使用有效的 JWT token 獲取新的 token',
  responses: {
    200: {
      description: '刷新成功',
      content: {
        'application/json': {
          schema: refreshTokenResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /auth/refresh
 * 刷新認證令牌
 * 支援從 Cookie 或 Authorization header 取得 Token
 */
router.post('/refresh',
  authController.refreshToken
);

/**
 * GET /api/v1/auth/me - 獲取當前用戶資訊
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/me',
  tags: ['Authentication'],
  summary: '獲取當前用戶資訊',
  description: '根據認證令牌獲取當前登入用戶的詳細資訊，支援從 Cookie 或 Authorization header 取得 Token',
  responses: {
    200: {
      description: '成功獲取用戶資訊',
      content: {
        'application/json': {
          schema: getCurrentUserResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /auth/me
 * 獲取當前用戶資訊
 * 支援從 Cookie 或 Authorization header 取得 Token
 */
router.get('/me',
  authController.getCurrentUser
);

/**
 * POST /api/v1/auth/forgot-password - 請求密碼重設
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/forgot-password',
  tags: ['Authentication'],
  summary: '請求密碼重設',
  description: '發送密碼重設連結到指定電子郵件',
  request: {
    body: {
      content: {
        'application/json': {
          schema: forgotPasswordValidator
        }
      }
    }
  },
  responses: {
    200: {
      description: '重設郵件已發送',
      content: {
        'application/json': {
          schema: apiSuccessResponseSchema(
            z.object({
              message: z.string()
            })
          )
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

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
 * POST /api/v1/auth/reset-password - 確認密碼重設
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/reset-password',
  tags: ['Authentication'],
  summary: '確認密碼重設',
  description: '使用重設令牌設定新密碼',
  request: {
    body: {
      content: {
        'application/json': {
          schema: resetPasswordValidator
        }
      }
    }
  },
  responses: {
    200: {
      description: '密碼重設成功',
      content: {
        'application/json': {
          schema: apiSuccessResponseSchema(
            z.object({
              message: z.string()
            })
          )
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

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
 * POST /api/v1/auth/verify-email - 驗證電子郵件
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/verify-email',
  tags: ['Authentication'],
  summary: '驗證電子郵件',
  description: '使用驗證令牌驗證用戶的電子郵件地址',
  request: {
    body: {
      content: {
        'application/json': {
          schema: verifyEmailValidator
        }
      }
    }
  },
  responses: {
    200: {
      description: '郵件驗證成功',
      content: {
        'application/json': {
          schema: verifyEmailResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

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
 * GET /api/v1/auth/google - 開始 Google OAuth 認證
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/google',
  tags: ['Authentication'],
  summary: '開始 Google OAuth 認證',
  description: '重定向到 Google OAuth 授權頁面',
  responses: {
    302: {
      description: '重定向到 Google OAuth 授權頁面'
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /auth/google
 * 開始 Google OAuth 認證
 * 重定向到 Google OAuth 授權頁面
 */
router.get('/google', authenticateGoogle);

/**
 * GET /api/v1/auth/google/callback - Google OAuth 回調
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/google/callback',
  tags: ['Authentication'],
  summary: 'Google OAuth 回調',
  description: '處理 Google OAuth 認證回調',
  request: {
    query: oauthStateValidator
  },
  responses: {
    200: {
      description: 'Google 認證成功',
      content: {
        'application/json': {
          schema: loginSuccessResponseSchema
        }
      }
    },
    302: {
      description: '重定向到前端應用'
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

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
 * GET /api/v1/auth/google/failure - Google OAuth 認證失敗
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/google/failure',
  tags: ['Authentication'],
  summary: 'Google OAuth 認證失敗',
  description: '返回 Google 認證失敗錯誤',
  responses: {
    401: {
      description: 'Google 認證失敗',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              type: z.string(),
              message: z.string()
            })
          }).openapi({
            description: 'Google 認證失敗錯誤響應'
          })
        }
      }
    }
  }
});

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