/**
 * Re-sync email templates in DB to match current TypeScript template code.
 * Run when template source files have been updated after the initial seed.
 *
 * Usage:
 *   npx ts-node prisma/resync-email-templates.ts
 */

process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'https://daodao.tw'
process.env.BACKEND_URL = process.env.BACKEND_URL || 'https://api.daodao.tw'

import { prisma } from '../src/services/database/prisma.service'
import { generateWelcomeEmail } from '../src/services/email/welcome-template'
import { generateWeeklyDigestHtml, generateWeeklyDigestSubject } from '../src/services/email/notification-weekly-template'
import type { WeeklyDigestData } from '../src/services/email/notification-weekly-template'

// ── sample data ──────────────────────────────────────────────────────────────

const SAMPLE_NAME = '小明'
const SAMPLE_PRACTICE_URL = 'https://daodao.tw/practices/1'
const SAMPLE_UNSUBSCRIBE_URL = 'https://daodao.tw/unsubscribe?token=SAMPLE'
const SAMPLE_SETTINGS_URL = 'https://daodao.tw/settings/notifications'

const SAMPLE_WEEKLY: WeeklyDigestData = {
  recipientName: SAMPLE_NAME,
  weekStart: '5/19',
  weekEnd: '5/25',
  stats: { reactions: 12, comments: 5, newFollowers: 3, connectRequests: 2 },
  practiceProgress: [
    { title: '每日閱讀30分鐘', checkInCount: 5, isCompleted: false },
    { title: '每日冥想10分鐘', checkInCount: 7, isCompleted: true },
  ],
  unsubscribeUrl: SAMPLE_UNSUBSCRIBE_URL,
  settingsUrl: SAMPLE_SETTINGS_URL,
}

// ── templates to update ───────────────────────────────────────────────────────

interface TemplateUpdate {
  name: string
  subject: string
  body: string
  variables: string[]
  preheader?: string
}

function buildUpdates(): TemplateUpdate[] {
  const updates: TemplateUpdate[] = []

  // 歡迎信（3 版本）
  for (const [variant, referralGroup] of [
    ['歡迎信（預設版）', 'default'],
    ['歡迎信（社群媒體來源）', 'social-media'],
    ['歡迎信（社群推薦來源）', 'community'],
  ] as const) {
    const result = generateWelcomeEmail({
      name: SAMPLE_NAME,
      referralGroup,
      practiceUrl: SAMPLE_PRACTICE_URL,
      unsubscribeUrl: SAMPLE_UNSUBSCRIBE_URL,
    })
    updates.push({
      name: variant,
      subject: result.subject,
      body: result.html,
      variables: ['name', 'practiceUrl', 'unsubscribeUrl'],
      preheader: result.preheader,
    })
  }

  // 每週通知摘要
  const weeklySubject = generateWeeklyDigestSubject(SAMPLE_WEEKLY)
  const weeklyHtml = generateWeeklyDigestHtml(SAMPLE_WEEKLY)
  // Normalise subject to use variable placeholders for admin display
  updates.push({
    name: '每週通知摘要',
    subject: '【島島阿學】{{recipientName}} 的本週學習週報（{{weekStart}}～{{weekEnd}}）',
    body: weeklyHtml,
    variables: ['recipientName', 'weekStart', 'weekEnd', 'stats', 'practiceProgress', 'unsubscribeUrl', 'settingsUrl'],
    preheader: `${SAMPLE_NAME} 的本週學習週報（${SAMPLE_WEEKLY.weekStart}～${SAMPLE_WEEKLY.weekEnd}）。`,
  })

  // Suppress unused-variable warning for weeklySubject (kept for reference)
  void weeklySubject

  return updates
}

// ── upsert ───────────────────────────────────────────────────────────────────

async function main() {
  const updates = buildUpdates()

  console.log(`Re-syncing ${updates.length} templates...\n`)

  let updated = 0
  let notFound = 0

  for (const tpl of updates) {
    const existing = await prisma.email_templates.findFirst({ where: { name: tpl.name } })
    if (!existing) {
      console.log(`  NOT FOUND (skipped): ${tpl.name}`)
      notFound++
      continue
    }
    await prisma.email_templates.update({
      where: { id: existing.id },
      data: {
        subject: tpl.subject,
        body: tpl.body,
        variables: tpl.variables,
        ...(tpl.preheader !== undefined && { preheader: tpl.preheader }),
      },
    })
    console.log(`  updated: ${tpl.name}`)
    updated++
  }

  console.log(`\n✓ Done — updated: ${updated}, not found: ${notFound}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
