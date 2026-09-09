import { Router, RequestHandler } from 'express'
import { authenticateAny } from '../middleware/auth'
import upload from '../middleware/multer.middleware'
import feedbackController from '../controllers/feedback.controller'

const router = Router()

router.post(
  '/bug-report',
  authenticateAny as RequestHandler,
  upload.array('screenshots', 3),
  feedbackController.submitBugReport as RequestHandler,
)

export default router
