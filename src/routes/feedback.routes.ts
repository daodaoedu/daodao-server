import { type RequestHandler, Router } from 'express'
import feedbackController from '../controllers/feedback.controller'
import { authenticateAny } from '../middleware/auth'
import upload from '../middleware/multer.middleware'
import { requireOnboardingComplete } from '../middleware/onboarding-gate.middleware'
import { bugReportLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

/**
 * POST /api/v1/feedback/bug-report
 * - requireOnboardingComplete：feedback.user_id 是 users(id) 的 FK，臨時用戶的 id 屬於 temp_users，
 *   寫進去會掛錯人或違反 FK，所以必須完成 onboarding 才能回報（放在 authenticateAny 之後才讀得到 req.user）
 * - bugReportLimiter：每次請求最多上傳 3 張圖到 R2 並寄一封通知信，以使用者為 key 限流，
 *   放在 multer 之前，超量的請求不會解析／上傳檔案
 */
router.post(
  '/bug-report',
  authenticateAny as RequestHandler,
  requireOnboardingComplete as RequestHandler,
  bugReportLimiter,
  upload.array('screenshots', 3),
  feedbackController.submitBugReport as RequestHandler
)

export default router
