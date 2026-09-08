import { Prisma } from '../../generated/prisma'
import { prisma } from './database/prisma.service'
import { uploadToR2 } from './r2.service'
import { emailService } from './email/email.service'
import type { BugReportInput } from '../validators/feedback.validator'

interface BugReportData extends BugReportInput {
  userId: number
  screenshots?: Express.Multer.File[]
}

const uploadScreenshots = async (files: Express.Multer.File[]): Promise<string[]> => {
  const urls: string[] = []
  const baseUrl = process.env.R2_PUBLIC_URL || ''

  for (const file of files) {
    const ext = file.originalname.split('.').pop() || 'png'
    const filename = `bug-reports/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    await uploadToR2(file, filename)
    urls.push(`${baseUrl}/${filename}`)
  }

  return urls
}

const sendNotificationEmail = async (data: BugReportInput & { screenshotUrls: string[] }): Promise<void> => {
  try {
    await emailService.sendEmail({
      to: 'contact@daodao.so',
      subject: `[Bug Report] ${data.area} — ${data.description.slice(0, 60)}`,
      html: `
        <h3>新錯誤回報</h3>
        <p><strong>問題區域：</strong>${data.area}</p>
        <p><strong>描述：</strong></p>
        <p>${data.description.replace(/\n/g, '<br>')}</p>
        ${data.link ? `<p><strong>相關連結：</strong><a href="${data.link}">${data.link}</a></p>` : ''}
        ${data.screenshotUrls.length > 0 ? `<p><strong>截圖：</strong>${data.screenshotUrls.map(u => `<br><a href="${u}">${u}</a>`).join('')}</p>` : ''}
        <p><strong>User Agent：</strong>${data.userAgent || 'N/A'}</p>
        <p><strong>Referrer：</strong>${data.referrer || 'N/A'}</p>
      `,
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
