/**
 * Admin 回饋與 FAQ 服務
 * 提供用戶回饋管理、FAQ 分類與項目 CRUD 功能
 */

import { Prisma } from '../../generated/prisma'
import { prisma } from './database/prisma.service'
import { NotFoundError } from '../middleware/error.middleware'
import { NOTIFICATION_TYPES } from '../constants/notification-type'
import { EMAIL_STATUS, EMAIL_TYPES } from '../types/email'
import { emailService } from './email/email.service'
import { createEmailLog, updateEmailLogStatus } from './email/email-log.service'
import { generateFeedbackReplyEmail, summarizeReport } from './email/feedback-reply-template'
import { getEmailConfig } from '../config/email.config'
import { loggerService } from './logging/logger.service'
import type {
  FeedbackItem, FeedbackListResult, FeedbackReplyEmailStatus, FeedbackReplyResult,
  FaqCategory, FaqItem, CreateFaqInput, UpdateFaqInput,
} from '../types/admin-feedback.types'

/** email_logs 記錄回覆信用的 entity_type（email_type 沿用既有的 notification，避開 storage CHECK） */
export const FEEDBACK_REPLY_EMAIL_ENTITY = 'feedback_reply'

/** 設定頁錯誤回報表單寫入的 feedback.source（feedback.service.ts submitBugReport） */
export const BUG_REPORT_SOURCE = 'bug_report_form'

/**
 * 取出錯誤回報的截圖網址（feedback.meta.screenshots，見 feedback.service.ts uploadScreenshots）。
 * 只回傳後台可直接當 <img src> 載入的 http(s) 絕對網址；R2_PUBLIC_URL 未設時存下的相對路徑與其他值略過。
 */
const toScreenshotUrls = (meta: unknown): string[] => {
  const screenshots = (meta as { screenshots?: unknown } | null)?.screenshots
  if (!Array.isArray(screenshots)) return []
  return screenshots.filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url))
}

const metaString = (meta: unknown, key: string): string | null => {
  const value = (meta as Record<string, unknown> | null)?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

/**
 * 錯誤回報表單存在 feedback.meta 的處理資訊（daodao#451 AC-03）；不是錯誤回報表單來的回饋為 null
 */
const toBugReportInfo = (source: string | null, meta: unknown): FeedbackItem['bugReport'] => {
  if (source !== BUG_REPORT_SOURCE) return null
  return {
    area: metaString(meta, 'area'),
    link: metaString(meta, 'link'),
    referrer: metaString(meta, 'referrer'),
    userAgent: metaString(meta, 'userAgent'),
  }
}

const toEmailStatus = (status: string | null | undefined): FeedbackReplyEmailStatus | null => {
  if (status === EMAIL_STATUS.SENT || status === EMAIL_STATUS.FAILED || status === EMAIL_STATUS.PENDING || status === EMAIL_STATUS.SKIPPED) return status
  return null
}

/**
 * 列出回饋（含篩選與分頁）
 * @param filters - 單筆 id、狀態、分類篩選及分頁參數
 */
const listFeedback = async (filters: { id?: number; status?: string; category?: string; limit: number; offset: number }): Promise<FeedbackListResult> => {
  const conditions: Prisma.Sql[] = [Prisma.sql`1=1`]
  if (filters.id !== undefined) conditions.push(Prisma.sql`f.id = ${filters.id}`)
  if (filters.status) conditions.push(Prisma.sql`f.status = ${filters.status}`)
  if (filters.category) conditions.push(Prisma.sql`f.category = ${filters.category}`)
  const where = Prisma.join(conditions, ' AND ')

  const [countResult] = await prisma.$queryRaw<Array<{ total: bigint }>>(
    Prisma.sql`SELECT COUNT(*)::bigint as total FROM feedback f WHERE ${where}`
  )
  const total = Number(countResult?.total ?? 0)

  // 統計卡片用全部回饋（不受篩選影響）；「本月」以台灣時間的月初起算
  const [statsResult] = await prisma.$queryRaw<Array<{ total: bigint; pending: bigint; this_month: bigint }>>(
    Prisma.sql`SELECT COUNT(*)::bigint AS total,
       COUNT(*) FILTER (WHERE f.status = 'pending')::bigint AS pending,
       COUNT(*) FILTER (WHERE f.created_at >= date_trunc('month', NOW() AT TIME ZONE 'Asia/Taipei') AT TIME ZONE 'Asia/Taipei')::bigint AS this_month
     FROM feedback f`
  )

  // users 沒有 name 欄位（顯示名稱是 nickname）；feedback 沒有 replied_at，回覆時間取最後一則 feedback_replies
  const rows = await prisma.$queryRaw<Array<{
    id: number; user_id: number | null; user_name: string | null; user_email: string | null;
    content: string; category: string; status: string; source: string | null;
    created_at: Date; replied_at: Date | null; meta: unknown;
    replies?: Array<{ id: number; content: string; createdAt: string; emailStatus: string | null }> | null;
  }>>(
    // 回覆的寄送結果取該回覆最新一筆 email_logs（entity_type = feedback_reply）；本功能上線前的回覆沒有紀錄 → null
    Prisma.sql`SELECT f.id, f.user_id, u.nickname AS user_name, c.email AS user_email, f.content, f.category, f.status, f.source, f.created_at, f.meta,
       (SELECT MAX(fr.created_at) FROM feedback_replies fr WHERE fr.feedback_id = f.id) AS replied_at,
       (SELECT json_agg(json_build_object(
            'id', fr.id, 'content', fr.content, 'createdAt', fr.created_at,
            'emailStatus', (SELECT el.status FROM email_logs el
                             WHERE el.entity_type = ${FEEDBACK_REPLY_EMAIL_ENTITY} AND el.entity_id = fr.id
                             ORDER BY el.id DESC LIMIT 1)
          ) ORDER BY fr.created_at)
          FROM feedback_replies fr WHERE fr.feedback_id = f.id) AS replies
     FROM feedback f
     LEFT JOIN users u ON f.user_id = u.id
     LEFT JOIN contacts c ON u.contact_id = c.id
     WHERE ${where}
     ORDER BY f.created_at DESC
     LIMIT ${filters.limit} OFFSET ${filters.offset}`
  )

  return {
    total,
    stats: {
      total: Number(statsResult?.total ?? 0),
      pending: Number(statsResult?.pending ?? 0),
      thisMonth: Number(statsResult?.this_month ?? 0),
    },
    items: rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email ?? null,
      content: r.content,
      category: r.category as FeedbackItem['category'],
      status: r.status as FeedbackItem['status'],
      createdAt: r.created_at.toISOString(),
      repliedAt: r.replied_at?.toISOString() ?? null,
      screenshots: toScreenshotUrls(r.meta),
      bugReport: toBugReportInfo(r.source ?? null, r.meta),
      // json_agg 的時間是 Postgres 字串格式，統一成 ISO
      replies: (r.replies ?? []).map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: new Date(reply.createdAt).toISOString(),
        emailStatus: toEmailStatus(reply.emailStatus),
      })),
    })),
  }
}

/**
 * 更新回饋狀態與分類
 * @param id - 回饋 ID
 * @param status - 新狀態
 * @param category - 新分類（選填）
 */
const updateFeedbackStatus = async (id: number, status: string, category?: string): Promise<{ updated: boolean }> => {
  const affected = category
    ? await prisma.$executeRaw`UPDATE feedback SET status = ${status}, category = ${category}, updated_at = NOW() WHERE id = ${id}`
    : await prisma.$executeRaw`UPDATE feedback SET status = ${status}, updated_at = NOW() WHERE id = ${id}`
  if (affected === 0) throw new NotFoundError('找不到這則意見回饋')
  return { updated: true }
}

/**
 * 寄回覆信給回報者（daodao#451 AC-01／AC-02／AC-06）
 * 收件人一律從該筆回報的 user 查出（contacts.email），不接受呼叫端指定。
 * 寄送結果記在 email_logs（entity_type = feedback_reply、entity_id = 回覆 id），後台列表據此顯示寄送狀態。
 * 錯誤不往外拋：回覆已經存下，寄信失敗只回 failed 讓後台顯示。
 */
const deliverReplyEmail = async (params: {
  reporterId: number | null; reportContent: string; replyId: number; replyContent: string;
}): Promise<FeedbackReplyResult['emailStatus']> => {
  const { reporterId, reportContent, replyId, replyContent } = params
  if (reporterId === null) return 'no_recipient'

  let logId: number | null = null
  try {
    const user = await prisma.users.findUnique({
      where: { id: reporterId },
      select: { nickname: true, contacts: { select: { email: true } } },
    })
    const to = user?.contacts?.email?.trim() || null
    const { subject, html } = generateFeedbackReplyEmail({
      recipientName: user?.nickname?.trim() || '島島夥伴',
      reportContent,
      replyContent,
      myReportsUrl: `${getEmailConfig().urls.frontend}/settings/bug-report/mine`,
    })

    if (!user) return 'no_recipient'
    if (!to) {
      // 使用者沒有聯絡信箱：記一筆 failed，後台顯示未送達
      await createEmailLog({
        userId: reporterId, emailType: EMAIL_TYPES.NOTIFICATION,
        entityType: FEEDBACK_REPLY_EMAIL_ENTITY, entityId: replyId,
        subject, status: EMAIL_STATUS.FAILED,
      }).catch(() => null)
      return 'no_recipient'
    }

    const log = await createEmailLog({
      userId: reporterId, emailType: EMAIL_TYPES.NOTIFICATION,
      entityType: FEEDBACK_REPLY_EMAIL_ENTITY, entityId: replyId,
      subject, status: EMAIL_STATUS.PENDING,
    }).catch((error: unknown) => {
      // 記不到 email_logs 仍照寄，但後台列表會看不到這則的寄送結果，留 log 方便追
      loggerService.error('admin-feedback: reply email log create failed', {
        replyId, error: error instanceof Error ? error.message : String(error),
      })
      return null
    })
    logId = log?.id ?? null

    const result = await emailService.sendEmail({
      to, subject, html, trackingToken: log?.tracking_token ?? undefined,
    })
    const status = result.success ? EMAIL_STATUS.SENT : EMAIL_STATUS.FAILED
    if (logId !== null) await updateEmailLogStatus(logId, status).catch(() => null)
    if (!result.success) {
      loggerService.error('admin-feedback: reply email failed', { replyId, error: result.error })
    }
    return result.success ? 'sent' : 'failed'
  } catch (error) {
    loggerService.error('admin-feedback: reply email failed', {
      replyId, error: error instanceof Error ? error.message : String(error),
    })
    if (logId !== null) await updateEmailLogStatus(logId, EMAIL_STATUS.FAILED).catch(() => null)
    return 'failed'
  }
}

/**
 * 建立「團隊回覆了你的錯誤回報」站內通知（daodao#451 AC-07）
 * 直接寫 notifications，不經 notification_events：in-app worker 每小時才轉一次，
 * 而 digest email worker 會再寄一封重複的信。best-effort，失敗只記 log。
 */
const createReplyNotification = async (params: {
  reporterId: number; adminId: number; feedbackId: number; reportContent: string;
}): Promise<void> => {
  try {
    await prisma.notifications.create({
      data: {
        recipient_id: params.reporterId,
        actor_id: params.adminId,
        type: NOTIFICATION_TYPES.FEEDBACK_REPLIED,
        entity_type: 'feedback',
        entity_id: params.feedbackId,
        priority: 'P1',
        aggregation_key: null,
        aggregation_count: 1,
        payload: { entityTitle: summarizeReport(params.reportContent).slice(0, 60) },
        batch_sent_at: new Date(),
      },
    })
  } catch (error) {
    loggerService.error('admin-feedback: reply notification failed', {
      feedbackId: params.feedbackId, error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * 回覆回饋：寫入回覆紀錄後寄信並通知回報者（daodao#451）
 * @param id - 回饋 ID
 * @param content - 回覆內容
 * @param adminId - 回覆的管理者 user id
 * @returns 回覆 id 與回覆信寄送結果；寄送失敗時回覆仍保留（AC-02）
 */
const replyToFeedback = async (id: number, content: string, adminId: number): Promise<FeedbackReplyResult> => {
  const saved = await prisma.$transaction(async (tx) => {
    // 先更新狀態確認回饋存在；不存在就不寫回覆（否則撞 FK 變 500）
    // feedback 沒有 replied_at 欄位，回覆時間以 feedback_replies.created_at 為準
    const feedbackRows = await tx.$queryRaw<Array<{ user_id: number | null; content: string; source: string | null }>>`
      UPDATE feedback SET status = 'replied', updated_at = NOW() WHERE id = ${id} RETURNING user_id, content, source
    `
    const feedback = feedbackRows[0]
    if (!feedback) throw new NotFoundError('找不到這則意見回饋')
    const [reply] = await tx.$queryRaw<Array<{ id: number }>>`
      INSERT INTO feedback_replies (feedback_id, admin_id, content, created_at)
      VALUES (${id}, ${adminId}, ${content}, NOW())
      RETURNING id
    `
    return { reporterId: feedback.user_id, reportContent: feedback.content, source: feedback.source, replyId: reply.id }
  })

  // 回覆信與「我的回報」只涵蓋錯誤回報表單送出的回報；其他來源的回饋回覆只記在後台（issue 範圍不含其他類型）
  if (saved.source !== BUG_REPORT_SOURCE) return { replyId: saved.replyId, emailStatus: 'not_applicable' }

  if (saved.reporterId !== null) {
    await createReplyNotification({
      reporterId: saved.reporterId, adminId, feedbackId: id, reportContent: saved.reportContent,
    })
  }
  const emailStatus = await deliverReplyEmail({
    reporterId: saved.reporterId, reportContent: saved.reportContent,
    replyId: saved.replyId, replyContent: content,
  })
  return { replyId: saved.replyId, emailStatus }
}

/**
 * 列出所有 FAQ 分類
 */
const listFaqCategories = async (): Promise<FaqCategory[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number; name: string; sort_order: number;
  }>>`SELECT * FROM faq_categories ORDER BY sort_order ASC`

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    sortOrder: r.sort_order,
  }))
}

/**
 * 建立 FAQ 分類
 * @param name - 分類名稱
 */
const createFaqCategory = async (name: string): Promise<FaqCategory> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number; name: string; sort_order: number;
  }>>`
    INSERT INTO faq_categories (name, sort_order)
    VALUES (${name}, COALESCE((SELECT MAX(sort_order) + 1 FROM faq_categories), 0))
    RETURNING *
  `

  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  }
}

/**
 * 列出 FAQ 項目（可選分類篩選）
 * @param categoryId - 分類 ID（選填）
 */
const listFaqItems = async (categoryId?: number): Promise<FaqItem[]> => {
  let rows: Array<{
    id: number; category_id: number; question: string; answer: string;
    is_published: boolean; sort_order: number; created_at: Date;
  }>

  if (categoryId !== undefined) {
    rows = await prisma.$queryRaw`
      SELECT * FROM faq_items WHERE category_id = ${categoryId} ORDER BY sort_order ASC
    `
  } else {
    rows = await prisma.$queryRaw`
      SELECT * FROM faq_items ORDER BY sort_order ASC
    `
  }

  return rows.map(r => ({
    id: r.id,
    categoryId: r.category_id,
    question: r.question,
    answer: r.answer,
    isPublished: r.is_published,
    sortOrder: r.sort_order,
    createdAt: r.created_at.toISOString(),
  }))
}

/**
 * 建立 FAQ 項目
 * @param input - 建立 FAQ 項目輸入
 */
const createFaqItem = async (input: CreateFaqInput): Promise<FaqItem> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number; category_id: number; question: string; answer: string;
    is_published: boolean; sort_order: number; created_at: Date;
  }>>`
    INSERT INTO faq_items (category_id, question, answer, is_published, sort_order)
    VALUES (${input.categoryId}, ${input.question}, ${input.answer}, ${input.isPublished ?? false}, COALESCE((SELECT MAX(sort_order) + 1 FROM faq_items WHERE category_id = ${input.categoryId}), 0))
    RETURNING *
  `

  return {
    id: row.id,
    categoryId: row.category_id,
    question: row.question,
    answer: row.answer,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
  }
}

/**
 * 更新 FAQ 項目
 * @param id - FAQ 項目 ID
 * @param input - 更新 FAQ 項目輸入
 */
const updateFaqItem = async (id: number, input: UpdateFaqInput): Promise<FaqItem> => {
  const setClauses: Prisma.Sql[] = []
  if (input.question !== undefined) setClauses.push(Prisma.sql`question = ${input.question}`)
  if (input.answer !== undefined) setClauses.push(Prisma.sql`answer = ${input.answer}`)
  if (input.isPublished !== undefined) setClauses.push(Prisma.sql`is_published = ${input.isPublished}`)

  if (setClauses.length === 0) {
    const [existing] = await prisma.$queryRaw<Array<{
      id: number; category_id: number; question: string; answer: string;
      is_published: boolean; sort_order: number; created_at: Date;
    }>>`SELECT * FROM faq_items WHERE id = ${id}`
    if (!existing) throw new Error('FAQ item not found')
    return {
      id: existing.id, categoryId: existing.category_id, question: existing.question,
      answer: existing.answer, isPublished: existing.is_published,
      sortOrder: existing.sort_order, createdAt: existing.created_at.toISOString(),
    }
  }

  const [row] = await prisma.$queryRaw<Array<{
    id: number; category_id: number; question: string; answer: string;
    is_published: boolean; sort_order: number; created_at: Date;
  }>>(
    Prisma.sql`UPDATE faq_items SET ${Prisma.join(setClauses)} WHERE id = ${id} RETURNING *`
  )

  if (!row) throw new Error('FAQ item not found')

  return {
    id: row.id,
    categoryId: row.category_id,
    question: row.question,
    answer: row.answer,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
  }
}

/**
 * 刪除 FAQ 項目
 * @param id - FAQ 項目 ID
 */
const deleteFaqItem = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM faq_items WHERE id = ${id}`
}

/**
 * 重新排序 FAQ 項目
 * @param items - 項目 ID 與排序值的陣列
 */
const reorderFaqItems = async (items: Array<{ id: number; sortOrder: number }>): Promise<{ updated: boolean }> => {
  for (const item of items) {
    await prisma.$executeRaw`UPDATE faq_items SET sort_order = ${item.sortOrder} WHERE id = ${item.id}`
  }
  return { updated: true }
}

/**
 * 批量發佈/取消發佈 FAQ 項目
 * @param ids - FAQ 項目 ID 陣列
 * @param isPublished - 是否發佈
 */
const bulkPublishFaqItems = async (ids: number[], isPublished: boolean): Promise<{ updated: number }> => {
  const result = await prisma.$executeRaw`UPDATE faq_items SET is_published = ${isPublished} WHERE id = ANY(${ids}::int[])`
  return { updated: result }
}

export default {
  listFeedback, updateFeedbackStatus, replyToFeedback,
  listFaqCategories, createFaqCategory, listFaqItems,
  createFaqItem, updateFaqItem, deleteFaqItem,
  reorderFaqItems, bulkPublishFaqItems,
}
