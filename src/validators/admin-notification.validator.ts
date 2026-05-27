import { z } from 'zod'

export const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.enum(['announcement', 'reminder', 'system']),
  targetType: z.enum(['all', 'tag', 'user']),
  targetValue: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
})

export const notificationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})
