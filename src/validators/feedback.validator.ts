import { z } from 'zod'

export const bugReportSchema = z.object({
  area: z.enum(['ui', 'performance', 'auth', 'data', 'other']),
  description: z.string().min(1).max(5000),
  link: z.string().url().optional().or(z.literal('')),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
})

export type BugReportInput = z.infer<typeof bugReportSchema>
