import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/error.middleware'
import { createSuccessResponse } from '../utils/response-helper'
import adminTrackingService from '../services/admin-tracking.service'

export const getQuizStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminTrackingService.getQuizStats()
  res.json(createSuccessResponse(stats))
})

export const getPersonaStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminTrackingService.getPersonaStats()
  res.json(createSuccessResponse(stats))
})

export const getEngagementStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminTrackingService.getEngagementStats()
  res.json(createSuccessResponse(stats))
})

export const getMetricDrillDown = asyncHandler(async (req: Request, res: Response) => {
  const metric = req.query.metric as string
  const period = req.query.period as string | undefined
  if (!metric) {
    res.json(createSuccessResponse([]))
    return
  }
  const users = await adminTrackingService.getMetricDrillDown(metric, period)
  res.json(createSuccessResponse(users))
})

export default {
  getQuizStats,
  getPersonaStats,
  getEngagementStats,
  getMetricDrillDown,
}
