import { z } from 'zod'

export const auditLogQuerySchema = z.object({
  adminId: z.coerce.number().int().positive().optional(),
  actionType: z.string().optional(),
  targetResource: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export const complianceHoldSchema = z.object({
  dateFrom: z.string().min(1),
  dateTo: z.string().min(1),
  reason: z.string().min(1),
})

export const dataRetentionSchema = z.object({
  auditLogRetentionDays: z.coerce.number().int().min(30).max(3650),
  userDataRetentionDays: z.coerce.number().int().min(30).max(3650),
  contentRetentionDays: z.coerce.number().int().min(30).max(3650),
})
