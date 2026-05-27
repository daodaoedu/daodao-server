import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/error.middleware'
import { createSuccessResponse } from '../utils/response-helper'
import adminAuditService from '../services/admin-audit.service'
import { auditLogQuerySchema, complianceHoldSchema, dataRetentionSchema } from '../validators/admin-audit.validator'

const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const filters = auditLogQuerySchema.parse(req.query)
  const data = await adminAuditService.listAuditLogs(filters)
  res.json(createSuccessResponse(data))
})

const setComplianceHold = asyncHandler(async (req: Request, res: Response) => {
  const input = complianceHoldSchema.parse(req.body)
  const result = await adminAuditService.setComplianceHold(input)
  res.json(createSuccessResponse(result))
})

const getDataRetentionPolicy = asyncHandler(async (_req: Request, res: Response) => {
  const policy = await adminAuditService.getDataRetentionPolicy()
  res.json(createSuccessResponse(policy))
})

const updateDataRetentionPolicy = asyncHandler(async (req: Request, res: Response) => {
  const policy = dataRetentionSchema.parse(req.body)
  const result = await adminAuditService.updateDataRetentionPolicy(policy)
  res.json(createSuccessResponse(result))
})

export default {
  listAuditLogs,
  setComplianceHold,
  getDataRetentionPolicy,
  updateDataRetentionPolicy,
}
