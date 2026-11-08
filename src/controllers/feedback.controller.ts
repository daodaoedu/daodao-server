import { Request, Response } from 'express'
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware'
import { createSuccessResponse } from '../utils/response-helper'
import { bugReportSchema } from '../validators/feedback.validator'
import feedbackService from '../services/feedback.service'

const submitBugReport = asyncHandler(async (req: Request, res: Response) => {
  const parsed = bugReportSchema.parse(req.body)
  const userId = req.user!.id
  const screenshots = (req.files as Express.Multer.File[] | undefined) ?? []

  const result = await feedbackService.submitBugReport({
    ...parsed,
    userId,
    screenshots: screenshots.slice(0, 3),
  })

  res.status(201).json(createSuccessResponse(result))
})

/**
 * GET /api/v1/feedback/mine — 登入者自己的錯誤回報與團隊回覆（daodao#451）
 * 只用 req.user.id 查詢，不接受 query／body 指定使用者
 */
const listMyBugReports = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('請先登入')
  const result = await feedbackService.listMyBugReports(req.user.id)
  res.json(createSuccessResponse(result))
})

export default { submitBugReport, listMyBugReports }
