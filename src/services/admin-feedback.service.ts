/**
 * Admin 回饋與 FAQ 服務
 * 提供用戶回饋管理、FAQ 分類與項目 CRUD 功能
 */

import { Prisma } from '../../generated/prisma'
import { prisma } from './database/prisma.service'
import type { FeedbackItem, FeedbackListResult, FaqCategory, FaqItem, CreateFaqInput, UpdateFaqInput } from '../types/admin-feedback.types'

/**
 * 列出回饋（含篩選與分頁）
 * @param filters - 狀態、分類篩選及分頁參數
 */
const listFeedback = async (filters: { status?: string; category?: string; limit: number; offset: number }): Promise<FeedbackListResult> => {
  const conditions: Prisma.Sql[] = [Prisma.sql`1=1`]
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
    id: number; user_id: number | null; user_name: string | null;
    content: string; category: string; status: string;
    created_at: Date; replied_at: Date | null;
  }>>(
    Prisma.sql`SELECT f.id, f.user_id, u.nickname AS user_name, f.content, f.category, f.status, f.created_at,
       (SELECT MAX(fr.created_at) FROM feedback_replies fr WHERE fr.feedback_id = f.id) AS replied_at
     FROM feedback f
     LEFT JOIN users u ON f.user_id = u.id
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
      content: r.content,
      category: r.category as FeedbackItem['category'],
      status: r.status as FeedbackItem['status'],
      createdAt: r.created_at.toISOString(),
      repliedAt: r.replied_at?.toISOString() ?? null,
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
  if (category) {
    await prisma.$executeRaw`UPDATE feedback SET status = ${status}, category = ${category} WHERE id = ${id}`
  } else {
    await prisma.$executeRaw`UPDATE feedback SET status = ${status} WHERE id = ${id}`
  }
  return { updated: true }
}

/**
 * 回覆回饋
 * @param id - 回饋 ID
 * @param content - 回覆內容
 */
const replyToFeedback = async (id: number, content: string): Promise<{ sent: boolean }> => {
  await prisma.$executeRaw`
    INSERT INTO feedback_replies (feedback_id, content, created_at)
    VALUES (${id}, ${content}, NOW())
  `
  // feedback 沒有 replied_at 欄位，回覆時間以 feedback_replies.created_at 為準
  await prisma.$executeRaw`UPDATE feedback SET status = 'replied', updated_at = NOW() WHERE id = ${id}`
  return { sent: true }
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
