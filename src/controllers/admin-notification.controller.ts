import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/error.middleware'
import { createSuccessResponse } from '../utils/response-helper'
import adminNotificationService from '../services/admin-notification.service'
import { createNotificationSchema, notificationIdParamSchema } from '../validators/admin-notification.validator'

const list = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminNotificationService.listNotifications()
  res.json(createSuccessResponse(data))
})

const create = asyncHandler(async (req: Request, res: Response) => {
  const input = createNotificationSchema.parse(req.body)
  const notification = await adminNotificationService.createNotification(input)
  res.status(201).json(createSuccessResponse(notification))
})

const send = asyncHandler(async (req: Request, res: Response) => {
  const { id } = notificationIdParamSchema.parse(req.params)
  const result = await adminNotificationService.sendNotification(id)
  res.json(createSuccessResponse(result))
})

const stats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = notificationIdParamSchema.parse(req.params)
  const result = await adminNotificationService.getNotificationStats(id)
  res.json(createSuccessResponse(result))
})

export default { list, create, send, stats }
