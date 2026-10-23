import { Request, Response } from 'express'
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware'
import { createSuccessResponse } from '../utils/response-helper'
import adminFeedbackService from '../services/admin-feedback.service'
import {
  feedbackQuerySchema, feedbackIdParamSchema, feedbackReplySchema, feedbackStatusSchema,
  createFaqCategorySchema, createFaqSchema, updateFaqSchema, faqIdParamSchema,
  faqReorderSchema, faqBulkPublishSchema,
} from '../validators/admin-feedback.validator'

const listFeedback = asyncHandler(async (req: Request, res: Response) => {
  const query = feedbackQuerySchema.parse(req.query)
  const data = await adminFeedbackService.listFeedback(query)
  res.json(createSuccessResponse(data))
})

const updateFeedbackStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = feedbackIdParamSchema.parse(req.params)
  const { status, category } = feedbackStatusSchema.parse(req.body)
  const result = await adminFeedbackService.updateFeedbackStatus(id, status, category)
  res.json(createSuccessResponse(result))
})

const replyToFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { id } = feedbackIdParamSchema.parse(req.params)
  const { content } = feedbackReplySchema.parse(req.body)
  if (!req.user?.id) throw new UnauthorizedError('請先登入')
  const result = await adminFeedbackService.replyToFeedback(id, content, req.user.id)
  res.json(createSuccessResponse(result))
})

const listFaqCategories = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminFeedbackService.listFaqCategories()
  res.json(createSuccessResponse(data))
})

const createFaqCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name } = createFaqCategorySchema.parse(req.body)
  const category = await adminFeedbackService.createFaqCategory(name)
  res.status(201).json(createSuccessResponse(category))
})

const listFaqItems = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminFeedbackService.listFaqItems()
  res.json(createSuccessResponse(data))
})

const createFaqItem = asyncHandler(async (req: Request, res: Response) => {
  const input = createFaqSchema.parse(req.body)
  const item = await adminFeedbackService.createFaqItem(input)
  res.status(201).json(createSuccessResponse(item))
})

const updateFaqItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = faqIdParamSchema.parse(req.params)
  const input = updateFaqSchema.parse(req.body)
  const item = await adminFeedbackService.updateFaqItem(id, input)
  res.json(createSuccessResponse(item))
})

const deleteFaqItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = faqIdParamSchema.parse(req.params)
  await adminFeedbackService.deleteFaqItem(id)
  res.json(createSuccessResponse({ deleted: true, id }))
})

const reorderFaqItems = asyncHandler(async (req: Request, res: Response) => {
  const { items } = faqReorderSchema.parse(req.body)
  const result = await adminFeedbackService.reorderFaqItems(items)
  res.json(createSuccessResponse(result))
})

const bulkPublishFaqItems = asyncHandler(async (req: Request, res: Response) => {
  const { ids, isPublished } = faqBulkPublishSchema.parse(req.body)
  const result = await adminFeedbackService.bulkPublishFaqItems(ids, isPublished)
  res.json(createSuccessResponse(result))
})

export default {
  listFeedback, updateFeedbackStatus, replyToFeedback,
  listFaqCategories, createFaqCategory, listFaqItems,
  createFaqItem, updateFaqItem, deleteFaqItem,
  reorderFaqItems, bulkPublishFaqItems,
}
