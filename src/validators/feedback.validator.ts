import { z } from 'zod'
import { registry } from '../config/openapi-registry'
import { apiSuccessResponseSchema } from './api-response.validators'

export const bugReportSchema = z.object({
  area: z.enum(['ui', 'performance', 'auth', 'data', 'other']),
  description: z.string().min(1).max(5000),
  link: z.string().url().optional().or(z.literal('')),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
})

export type BugReportInput = z.infer<typeof bugReportSchema>

// ── GET /api/v1/feedback/mine（daodao#451 AC-08／AC-09）────────────────────

const myBugReportReplySchema = z.object({
  id: z.number().openapi({ description: '回覆 id', example: 12 }),
  content: z.string().openapi({ description: '團隊回覆內容', example: '已修正，謝謝回報！' }),
  createdAt: z.string().openapi({ description: '回覆時間（ISO 8601）', example: '2026-11-08T03:00:00.000Z' }),
}).openapi('MyBugReportReply')

const myBugReportSchema = z.object({
  id: z.number().openapi({ description: '回報 id', example: 8 }),
  content: z.string().openapi({ description: '回報描述', example: '按下送出後畫面沒有反應' }),
  area: z.string().nullable().openapi({ description: '問題區域（ui／performance／auth／data／other）', example: 'ui' }),
  link: z.string().nullable().openapi({ description: '相關連結', example: 'https://app.daodao.so/settings' }),
  screenshots: z.array(z.string()).openapi({ description: '截圖網址', example: [] }),
  status: z.enum(['pending', 'replied', 'closed']).openapi({ description: '處理狀態', example: 'replied' }),
  createdAt: z.string().openapi({ description: '回報時間（ISO 8601）', example: '2026-11-08T02:00:00.000Z' }),
  replies: z.array(myBugReportReplySchema).openapi({ description: '團隊回覆，由舊到新' }),
}).openapi('MyBugReport')

export const myBugReportListApiResponseSchema = apiSuccessResponseSchema(
  z.object({ items: z.array(myBugReportSchema) })
).openapi('MyBugReportListApiResponse')

registry.register('MyBugReportListApiResponse', myBugReportListApiResponseSchema)
