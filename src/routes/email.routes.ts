/**
 * 郵件路由（v1 版本）
 * 處理郵件發送相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { emailController } from '../controllers/email.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';
import { validate } from '../validators/validation.middleware';
import { 
  contactEmailSchema,
  verificationEmailSchema,
  welcomeEmailSchema,
  passwordResetEmailSchema,
  marathonEmailSchema,
  customEmailSchema,
  bulkEmailSchema,
  validateEmailSchema,
  previewEmailSchema
} from '../validators/email.validators';

const router = Router();

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
  requireAdmin,
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

export default router;