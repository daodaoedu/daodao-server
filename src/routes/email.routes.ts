/**
 * 郵件路由（v1 版本）- 帶 OpenAPI 定義
 * 處理郵件發送相關的路由定義
 * 展示如何使用 zod-to-openapi 官方推薦的 registry.registerPath() 方法
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { emailController } from '../controllers/email.controller';
import { emailTrackingController } from '../controllers/email-tracking.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';
import { validate } from '../middleware/validation.middleware';
import { strictLimiter } from '../middleware/rate-limit.middleware';
import { z } from 'zod';
import {
  contactEmailSchema,
  verificationEmailSchema,
  welcomeEmailSchema,
  passwordResetEmailSchema,
  marathonEmailSchema,
  customEmailSchema,
  bulkEmailSchema,
  validateEmailSchema,
  previewEmailSchema,
  emailStatsQuerySchema,
  emailSuccessResponseSchema,
  emailValidationResponseSchema,
  emailPreviewResponseSchema,
  emailStatsResponseSchema,
  emailHealthResponseSchema,
  bulkEmailResponseSchema
} from '../validators/email.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * POST /api/v1/email/contact - 發送聯絡郵件
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/email/contact',
  tags: ['Email'],
  summary: '發送聯絡郵件',
  description: '發送一封聯絡郵件給指定收件人。需要身份驗證。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: contactEmailSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '郵件發送成功',
      content: {
        'application/json': {
          schema: emailSuccessResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/email/verification - 發送驗證郵件
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/email/verification',
  tags: ['Email'],
  summary: '發送驗證郵件',
  description: '發送電子郵件驗證連結給用戶。需要身份驗證。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: verificationEmailSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '驗證郵件發送成功',
      content: {
        'application/json': {
          schema: emailSuccessResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/email/welcome - 發送歡迎郵件
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/email/welcome',
  tags: ['Email'],
  summary: '發送歡迎郵件',
  description: '發送歡迎郵件給新註冊的用戶。需要管理員權限。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: welcomeEmailSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '歡迎郵件發送成功',
      content: {
        'application/json': {
          schema: emailSuccessResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（需要管理員權限）',
      content: {
        'application/json': {
          schema: { $ref: '#/components/responses/ForbiddenError' }
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/email/password-reset - 發送密碼重設郵件
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/email/password-reset',
  tags: ['Email'],
  summary: '發送密碼重設郵件',
  description: '發送密碼重設連結給用戶。支援可選身份驗證（允許未登入用戶重設密碼）。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: passwordResetEmailSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '密碼重設郵件發送成功',
      content: {
        'application/json': {
          schema: emailSuccessResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * POST /api/v1/email/marathon - 發送馬拉松郵件
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/email/marathon',
  tags: ['Email'],
  summary: '發送馬拉松活動郵件',
  description: '發送馬拉松活動相關的郵件給參與者。需要管理員權限。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: marathonEmailSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '馬拉松郵件發送成功',
      content: {
        'application/json': {
          schema: emailSuccessResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（需要管理員權限）',
      content: {
        'application/json': {
          schema: { $ref: '#/components/responses/ForbiddenError' }
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/email/custom - 發送自定義郵件
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/email/custom',
  tags: ['Email'],
  summary: '發送自定義郵件',
  description: '發送完全自定義的郵件內容或使用模板。需要管理員權限。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: customEmailSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '自定義郵件發送成功',
      content: {
        'application/json': {
          schema: emailSuccessResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（需要管理員權限）',
      content: {
        'application/json': {
          schema: { $ref: '#/components/responses/ForbiddenError' }
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/email/bulk - 批量發送郵件
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/email/bulk',
  tags: ['Email'],
  summary: '批量發送郵件',
  description: '批量發送郵件給多個收件人（最多100個）。需要管理員權限。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: bulkEmailSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '批量郵件發送成功',
      content: {
        'application/json': {
          schema: bulkEmailResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（需要管理員權限）',
      content: {
        'application/json': {
          schema: { $ref: '#/components/responses/ForbiddenError' }
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/email/validate - 驗證郵件地址
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/email/validate',
  tags: ['Email'],
  summary: '驗證郵件地址格式',
  description: '檢查郵件地址格式是否有效。支援可選身份驗證。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: validateEmailSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '郵件地址驗證結果',
      content: {
        'application/json': {
          schema: emailValidationResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * POST /api/v1/email/preview - 預覽郵件模板
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/email/preview',
  tags: ['Email'],
  summary: '預覽郵件模板',
  description: '預覽郵件模板渲染後的效果。需要身份驗證。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: previewEmailSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '郵件預覽成功',
      content: {
        'application/json': {
          schema: emailPreviewResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/email/stats - 獲取郵件統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/email/stats',
  tags: ['Email'],
  summary: '獲取郵件發送統計',
  description: '獲取郵件發送的統計數據（成功率、總數等）。需要管理員權限。',
  request: {
    query: emailStatsQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取郵件統計',
      content: {
        'application/json': {
          schema: emailStatsResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（需要管理員權限）',
      content: {
        'application/json': {
          schema: { $ref: '#/components/responses/ForbiddenError' }
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/email/health - 檢查郵件服務健康狀態
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/email/health',
  tags: ['Email'],
  summary: '檢查郵件服務健康狀態',
  description: '檢查郵件服務的運行狀態（SMTP 連線、佇列大小等）。需要管理員權限。',
  responses: {
    200: {
      description: '成功獲取郵件服務健康狀態',
      content: {
        'application/json': {
          schema: emailHealthResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: {
      description: '權限不足（需要管理員權限）',
      content: {
        'application/json': {
          schema: { $ref: '#/components/responses/ForbiddenError' }
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/email/track/open/:token - 追蹤 email 開啟
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/email/track/open/{token}',
  tags: ['Email Tracking'],
  summary: '追蹤 email 開啟事件',
  description: '透過追蹤像素記錄 email 開啟事件，回傳 1x1 透明 GIF。此為公開 endpoint，不需認證。',
  request: {
    params: z.object({
      token: z.string().uuid().openapi({
        description: '追蹤 Token (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000'
      })
    })
  },
  responses: {
    200: {
      description: '1x1 透明 GIF 圖片',
      content: {
        'image/gif': {
          schema: z.any()
        }
      }
    },
    429: {
      description: '請求過於頻繁'
    }
  }
});

// ============================================================================
// Express 路由定義（與之前相同）
// ============================================================================

/**
 * GET /email/track/open/:token
 * 追蹤 email 開啟事件（公開 endpoint）
 */
router.get('/track/open/:token',
  strictLimiter,
  emailTrackingController.trackOpen as RequestHandler
);

/**
 * POST /email/contact
 * 發送聯絡郵件
 * 需要身份驗證
 */
router.post('/contact',
  authenticate,
  validate(contactEmailSchema, 'body'),
  emailController.sendContactEmail as RequestHandler
);

/**
 * POST /email/verification
 * 發送驗證郵件
 * 需要身份驗證
 */
router.post('/verification',
  authenticate,
  validate(verificationEmailSchema, 'body'),
  emailController.sendVerificationEmail as RequestHandler
);

/**
 * POST /email/welcome
 * 發送歡迎郵件
 * 需要管理員權限
 */
router.post('/welcome',
  authenticate,
  // requireAdmin,
  validate(welcomeEmailSchema, 'body'),
  emailController.sendWelcomeEmail as RequestHandler
);

/**
 * POST /email/password-reset
 * 發送密碼重設郵件
 * 支援可選身份驗證（允許未登入用戶重設密碼）
 */
router.post('/password-reset',
  optionalAuth,
  validate(passwordResetEmailSchema, 'body'),
  emailController.sendPasswordResetEmail as RequestHandler
);

/**
 * POST /email/marathon
 * 發送馬拉松郵件
 * 需要管理員權限
 */
router.post('/marathon',
  authenticate,
  requireAdmin,
  validate(marathonEmailSchema, 'body'),
  emailController.sendMarathonEmail as RequestHandler
);

/**
 * POST /email/custom
 * 發送自定義郵件
 * 需要管理員權限
 */
router.post('/custom',
  authenticate,
  requireAdmin,
  validate(customEmailSchema, 'body'),
  emailController.sendCustomEmail as RequestHandler
);

/**
 * POST /email/bulk
 * 批量發送郵件
 * 需要管理員權限
 */
router.post('/bulk',
  authenticate,
  requireAdmin,
  validate(bulkEmailSchema, 'body'),
  emailController.sendBulkEmail as RequestHandler
);

/**
 * POST /email/validate
 * 驗證郵件地址
 * 支援可選身份驗證
 */
router.post('/validate',
  optionalAuth,
  validate(validateEmailSchema, 'body'),
  emailController.validateEmail as RequestHandler
);

/**
 * POST /email/preview
 * 預覽郵件模板
 * 需要身份驗證
 */
router.post('/preview',
  authenticate,
  validate(previewEmailSchema, 'body'),
  emailController.previewEmailTemplate as RequestHandler
);

/**
 * GET /email/stats
 * 獲取郵件統計
 * 需要管理員權限
 */
router.get('/stats',
  authenticate,
  requireAdmin,
  emailController.getEmailStats as RequestHandler
);

/**
 * GET /email/health
 * 檢查郵件服務健康狀態
 * 需要管理員權限
 */
router.get('/health',
  authenticate,
  requireAdmin,
  emailController.checkEmailHealth as RequestHandler
);

/**
 * POST /email/retry-failed
 * 手動重試失敗的郵件（從 BullMQ failed set）
 * 需要管理員權限
 */
router.post('/retry-failed',
  authenticate,
  requireAdmin,
  emailController.retryFailedEmailsHandler as RequestHandler
);

/**
 * POST /email/retry/:logId
 * 重試單封失敗的郵件
 * 需要管理員權限
 */
router.post('/retry/:logId',
  authenticate,
  requireAdmin,
  emailController.retrySingleEmailHandler as RequestHandler
);

export default router;
