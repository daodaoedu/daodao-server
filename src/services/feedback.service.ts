import { Prisma } from '../../generated/prisma'
import { escapeHtml } from '../utils/sanitize'
import type { BugReportInput } from '../validators/feedback.validator'
import { prisma } from './database/prisma.service'
import { emailService } from './email/email.service'
import { uploadToR2 } from './r2.service'

interface BugReportData extends BugReportInput {
  userId: number;
  screenshots?: Express.Multer.File[];
}

const uploadScreenshots = async (files: Express.Multer.File[]): Promise<string[]> => {
  const baseUrl = process.env.R2_PUBLIC_URL || ''

  const results = await Promise.all(
    files.map(async (file) => {
      const ext = file.originalname.split('.').pop() || 'png'
      const filename = `bug-reports/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
      await uploadToR2(file, filename)
      return `${baseUrl}/${filename}`
    })
  )

  return results
}

/** 回報者身分（通知信用，daodao#451 AC-04）；使用者沒有暱稱或聯絡信箱時為 null */
export interface BugReportReporter {
  userId: number
  nickname: string | null
  email: string | null
}

/**
 * 通知信主旨的環境標記（daodao#451 AC-05）：正式站不加，其他環境加 [DEV] 等標記，
 * 讓 contact@ 收件匣分得出測試回報。APP_ENV 優先，未設時看 NODE_ENV（server-dev 的 image 以 NODE_ENV=dev 建置）。
 */
export const environmentLabel = (env: NodeJS.ProcessEnv = process.env): string | null => {
  const value = (env.APP_ENV || env.NODE_ENV || '').trim().toLowerCase()
  if (value === 'prod' || value === 'production') return null
  if (value === '' || value === 'dev' || value === 'development') return 'DEV'
  return value.toUpperCase()
}

/** 後台意見回饋頁直接展開該則回報的連結；ADMIN_FRONTEND_URL 未設時回 null */
export const adminFeedbackUrl = (feedbackId: number, env: NodeJS.ProcessEnv = process.env): string | null => {
  const base = (env.ADMIN_FRONTEND_URL || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) return null
  return `${base}/admin/feedback?id=${feedbackId}`
}

/**
 * 通知信內容全部來自使用者輸入（描述、連結、referrer、UA、上傳檔名組成的截圖 URL、暱稱），
 * 一律 escapeHtml 後以純文字呈現；連結不產生 <a>，避免對 contact@daodao.so 的 HTML injection／釣魚連結。
 * 唯一的 <a> 是 server 自己組的後台連結（ADMIN_FRONTEND_URL + 數字 id）。
 */
export const buildNotificationEmail = (
  data: BugReportInput & {
    screenshotUrls: string[]
    feedbackId: number
    reporter: BugReportReporter
    env?: NodeJS.ProcessEnv
  }
): { subject: string; html: string } => {
  const text = (value: string | undefined | null): string => escapeHtml(value || '') || 'N/A'
  const subjectSummary = data.description.replace(/\s+/g, ' ').trim().slice(0, 60)
  const label = environmentLabel(data.env)
  const adminUrl = adminFeedbackUrl(data.feedbackId, data.env)

  return {
    subject: `${label ? `[${label}] ` : ''}[Bug Report] ${data.area} — ${subjectSummary}`,
    html: `
        <h3>${label ? `[${escapeHtml(label)}] ` : ''}新錯誤回報 #${data.feedbackId}</h3>
        <p><strong>回報者：</strong>${text(data.reporter.nickname)}（user #${data.reporter.userId}）</p>
        <p><strong>帳號 Email：</strong>${text(data.reporter.email)}</p>
        <p><strong>問題區域：</strong>${text(data.area)}</p>
        <p><strong>描述：</strong></p>
        <p>${escapeHtml(data.description).replace(/\r?\n/g, '<br>')}</p>
        ${data.link ? `<p><strong>相關連結：</strong>${text(data.link)}</p>` : ''}
        ${data.screenshotUrls.length > 0 ? `<p><strong>截圖：</strong>${data.screenshotUrls.map((u) => `<br>${text(u)}`).join('')}</p>` : ''}
        <p><strong>User Agent：</strong>${text(data.userAgent)}</p>
        <p><strong>Referrer：</strong>${text(data.referrer)}</p>
        ${adminUrl ? `<p><a href="${escapeHtml(adminUrl)}">到後台查看與回覆這則回報</a></p>` : ''}
      `,
  }
}

const findReporter = async (userId: number): Promise<BugReportReporter> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { nickname: true, contacts: { select: { email: true } } },
  })
  return { userId, nickname: user?.nickname ?? null, email: user?.contacts?.email ?? null }
}

const sendNotificationEmail = async (
  data: BugReportInput & { screenshotUrls: string[]; feedbackId: number; userId: number }
): Promise<void> => {
  try {
    const reporter = await findReporter(data.userId)
    const { subject, html } = buildNotificationEmail({ ...data, reporter })
    await emailService.sendEmail({
      to: 'contact@daodao.so',
      subject,
      html,
    })
  } catch (err) {
    console.error('Bug report email notification failed (non-blocking):', err)
  }
}

export const submitBugReport = async (data: BugReportData): Promise<{ id: number }> => {
  let screenshotUrls: string[] = []

  if (data.screenshots && data.screenshots.length > 0) {
    screenshotUrls = await uploadScreenshots(data.screenshots)
  }

  const meta = JSON.stringify({
    area: data.area,
    screenshots: screenshotUrls,
    link: data.link || null,
    referrer: data.referrer || null,
    userAgent: data.userAgent || null,
  })

  const [row] = await prisma.$queryRaw<Array<{ id: number }>>(
    Prisma.sql`
      INSERT INTO feedback (user_id, content, category, status, source, meta, created_at)
      VALUES (${data.userId}, ${data.description}, 'bug', 'pending', 'bug_report_form', ${meta}::jsonb, NOW())
      RETURNING id
    `
  )

  // Non-blocking email
  void sendNotificationEmail({ ...data, screenshotUrls, feedbackId: row.id })

  return { id: row.id }
}

/** 「我的回報」列表項目（daodao#451 AC-08） */
export interface MyBugReport {
  id: number
  content: string
  area: string | null
  link: string | null
  screenshots: string[]
  status: 'pending' | 'replied' | 'closed'
  createdAt: string
  replies: Array<{ id: number; content: string; createdAt: string }>
}

const metaString = (meta: unknown, key: string): string | null => {
  const value = (meta as Record<string, unknown> | null)?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

const metaScreenshots = (meta: unknown): string[] => {
  const screenshots = (meta as { screenshots?: unknown } | null)?.screenshots
  if (!Array.isArray(screenshots)) return []
  return screenshots.filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url))
}

/**
 * 列出使用者自己送出的錯誤回報與團隊回覆，新到舊（daodao#451 AC-08）
 * 查詢條件固定 user_id = 登入者，讀不到別人的回報（AC-09）
 * @param userId - 登入使用者 id（來自 req.user，不接受前端指定）
 */
export const listMyBugReports = async (userId: number): Promise<{ items: MyBugReport[] }> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number; content: string; status: string; created_at: Date; meta: unknown;
    replies: Array<{ id: number; content: string; createdAt: string }> | null;
  }>>(
    Prisma.sql`SELECT f.id, f.content, f.status, f.created_at, f.meta,
       (SELECT json_agg(json_build_object('id', fr.id, 'content', fr.content, 'createdAt', fr.created_at) ORDER BY fr.created_at)
          FROM feedback_replies fr WHERE fr.feedback_id = f.id) AS replies
     FROM feedback f
     WHERE f.user_id = ${userId} AND f.category = 'bug'
     ORDER BY f.created_at DESC, f.id DESC
     LIMIT 100`
  )

  return {
    items: rows.map((r) => ({
      id: r.id,
      content: r.content,
      area: metaString(r.meta, 'area'),
      link: metaString(r.meta, 'link'),
      screenshots: metaScreenshots(r.meta),
      status: r.status as MyBugReport['status'],
      createdAt: r.created_at.toISOString(),
      replies: (r.replies ?? []).map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: new Date(reply.createdAt).toISOString(),
      })),
    })),
  }
}

export default { submitBugReport, listMyBugReports }
