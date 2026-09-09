import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/error.middleware'
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

export default { submitBugReport }
