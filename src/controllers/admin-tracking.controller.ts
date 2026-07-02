import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/error.middleware'
import { createSuccessResponse } from '../utils/response-helper'
import { NotFoundError } from '../middleware/error.middleware'
import adminTrackingService from '../services/admin-tracking.service'

export const getOnboardingStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminTrackingService.getOnboardingStats()
  res.json(createSuccessResponse(stats))
})

export const getUserOnboardingDetail = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params
  const detail = await adminTrackingService.getUserOnboardingDetail(userId)
  if (!detail) throw new NotFoundError('使用者不存在或尚未建立 onboarding 記錄')
  res.json(createSuccessResponse(detail))
})

export const getQuizStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminTrackingService.getQuizStats()
  res.json(createSuccessResponse(stats))
})

export const getPersonaStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminTrackingService.getPersonaStats()
  res.json(createSuccessResponse(stats))
})

export const getEmailOnboardingStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminTrackingService.getEmailOnboardingStats()
  res.json(createSuccessResponse(stats))
})

export const getEngagementStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminTrackingService.getEngagementStats()
  res.json(createSuccessResponse(stats))
})

export const getMetricDrillDown = asyncHandler(async (req: Request, res: Response) => {
  const metric = req.query.metric as string
  if (!metric) {
    res.json(createSuccessResponse([]))
    return
  }
  const users = await adminTrackingService.getMetricDrillDown(metric)
  res.json(createSuccessResponse(users))
})

export default {
  getOnboardingStats,
  getUserOnboardingDetail,
  getQuizStats,
  getPersonaStats,
  getEmailOnboardingStats,
  getEngagementStats,
  getMetricDrillDown,
}
