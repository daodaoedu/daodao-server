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

/**
 * 通知信內容全部來自使用者輸入（描述、連結、referrer、UA、上傳檔名組成的截圖 URL），
 * 一律 escapeHtml 後以純文字呈現；連結不產生 <a>，避免對 contact@daodao.so 的 HTML injection／釣魚連結。
 */
export const buildNotificationEmail = (
  data: BugReportInput & { screenshotUrls: string[] }
): { subject: string; html: string } => {
  const text = (value: string | undefined | null): string => escapeHtml(value || '') || 'N/A'
  const subjectSummary = data.description.replace(/\s+/g, ' ').trim().slice(0, 60)

  return {
    subject: `[Bug Report] ${data.area} — ${subjectSummary}`,
    html: `
        <h3>新錯誤回報</h3>
        <p><strong>問題區域：</strong>${text(data.area)}</p>
        <p><strong>描述：</strong></p>
        <p>${escapeHtml(data.description).replace(/\r?\n/g, '<br>')}</p>
        ${data.link ? `<p><strong>相關連結：</strong>${text(data.link)}</p>` : ''}
        ${data.screenshotUrls.length > 0 ? `<p><strong>截圖：</strong>${data.screenshotUrls.map((u) => `<br>${text(u)}`).join('')}</p>` : ''}
        <p><strong>User Agent：</strong>${text(data.userAgent)}</p>
        <p><strong>Referrer：</strong>${text(data.referrer)}</p>
      `,
  }
}

const sendNotificationEmail = async (
  data: BugReportInput & { screenshotUrls: string[] }
): Promise<void> => {
  try {
    const { subject, html } = buildNotificationEmail(data)
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
  sendNotificationEmail({ ...data, screenshotUrls })

  return { id: row.id }
}

export default { submitBugReport }
