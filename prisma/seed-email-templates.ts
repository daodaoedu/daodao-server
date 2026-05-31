/**
 * Seed script: 將現有的 TypeScript email templates 寫入 DB
 * 執行方式：
 *   npx ts-node prisma/seed-email-templates.ts
 */

// 設定 placeholder env（避免 email.config 因缺 env 報錯）
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'https://daodao.tw';
process.env.BACKEND_URL = process.env.BACKEND_URL || 'https://api.daodao.tw';

import { prisma } from '../src/services/database/prisma.service';
import { generateVerificationEmail } from '../src/services/email/verification-template';
import { generatePasswordResetEmail } from '../src/services/email/password-reset-template';
import { generateMarathonEmail } from '../src/services/email/marathon-template';
import { generateWelcomeEmail } from '../src/services/email/welcome-template';
import { generateWishLinkedEmail } from '../src/services/email/wish-linked-template';

// ── sample data ──────────────────────────────────────────────────────────────

const SAMPLE = {
  name: '小明',
  nickname: '小明',
  email: 'user@example.com',
  practiceTitle: '每日閱讀30分鐘',
  practiceUrl: 'https://daodao.tw/practices/1',
  itemTitle: '建立線上讀書會',
  roadmapUrl: 'https://daodao.tw/roadmap/1',
  marathonTitle: '島島馬拉松 2025',
  marathonDate: '2025-08-01',
  marathonDescription: '一起挑戰 30 天閱讀馬拉松！',
  verifyLink: 'https://daodao.tw/verify?token=SAMPLE',
  resetLink: 'https://daodao.tw/reset?token=SAMPLE',
  unsubscribeUrl: 'https://daodao.tw/unsubscribe?token=SAMPLE',
}

// ── generate templates ───────────────────────────────────────────────────────

async function main() {
  const templates: Array<{ name: string; subject: string; body: string; variables: string[] }> = []

  // 歡迎信（3 版本）
  const welcome = generateWelcomeEmail({
    name: SAMPLE.name,
    referralGroup: 'default',
    practiceUrl: SAMPLE.practiceUrl,
    unsubscribeUrl: SAMPLE.unsubscribeUrl,
  })
  templates.push({
    name: '歡迎信（預設版）',
    subject: welcome.subject,
    body: welcome.html,
    variables: ['name', 'practiceUrl', 'unsubscribeUrl'],
  })

  const welcomeSocial = generateWelcomeEmail({
    name: SAMPLE.name,
    referralGroup: 'social-media',
    practiceUrl: SAMPLE.practiceUrl,
    unsubscribeUrl: SAMPLE.unsubscribeUrl,
  })
  templates.push({
    name: '歡迎信（社群媒體來源）',
    subject: welcomeSocial.subject,
    body: welcomeSocial.html,
    variables: ['name', 'practiceUrl', 'unsubscribeUrl'],
  })

  const welcomeCommunity = generateWelcomeEmail({
    name: SAMPLE.name,
    referralGroup: 'community',
    practiceUrl: SAMPLE.practiceUrl,
    unsubscribeUrl: SAMPLE.unsubscribeUrl,
  })
  templates.push({
    name: '歡迎信（社群推薦來源）',
    subject: welcomeCommunity.subject,
    body: welcomeCommunity.html,
    variables: ['name', 'practiceUrl', 'unsubscribeUrl'],
  })

  // 驗證信
  const verification = generateVerificationEmail({
    name: SAMPLE.name,
    verifyLink: SAMPLE.verifyLink,
  })
  templates.push({
    name: '信箱驗證',
    subject: verification.subject,
    body: verification.html,
    variables: ['name', 'verifyLink'],
  })

  // 密碼重設
  const passwordReset = generatePasswordResetEmail({
    name: SAMPLE.name,
    resetLink: SAMPLE.resetLink,
  })
  templates.push({
    name: '密碼重設',
    subject: passwordReset.subject,
    body: passwordReset.html,
    variables: ['name', 'resetLink'],
  })

  // 馬拉松報名
  const marathon = generateMarathonEmail({
    name: SAMPLE.name,
    marathonTitle: SAMPLE.marathonTitle,
    marathonDate: SAMPLE.marathonDate,
    marathonDescription: SAMPLE.marathonDescription,
  })
  templates.push({
    name: '馬拉松報名確認',
    subject: marathon.subject,
    body: marathon.html,
    variables: ['name', 'marathonTitle', 'marathonDate', 'marathonDescription'],
  })

  // 許願採納
  const wishLinked = generateWishLinkedEmail({
    recipientName: SAMPLE.name,
    itemTitle: SAMPLE.itemTitle,
    url: SAMPLE.roadmapUrl,
    unsubscribeUrl: SAMPLE.unsubscribeUrl,
  })
  templates.push({
    name: '許願採納通知',
    subject: wishLinked.subject,
    body: wishLinked.html,
    variables: ['recipientName', 'itemTitle', 'url', 'unsubscribeUrl'],
  })

  // 其餘 template（reaction、digest、weekly、PE 系列、onboarding）
  // 這些 template 依賴複雜的資料結構，用 placeholder body
  const remaining = [
    {
      name: '共鳴通知',
      subject: '「{{practiceTitle}}」獲得了共鳴！',
      variables: ['recipientName', 'practiceTitle', 'reactionCount', 'practiceUrl'],
    },
    {
      name: '4小時通知摘要',
      subject: '【島島阿學】你有新的通知',
      variables: ['recipientName', 'notifications'],
    },
    {
      name: '每週通知摘要',
      subject: '【島島阿學】本週學習回顧',
      variables: ['recipientName', 'weeklyStats'],
    },
    {
      name: 'PE01 實踐建立確認',
      subject: '開啟你的小而美學習生活提案',
      variables: ['name', 'practiceTitle', 'practiceUrl'],
    },
    {
      name: 'PE02 第一次打卡鼓勵',
      subject: '你在【{{practiceTitle}}】的第一次打卡紀錄 ✨',
      variables: ['name', 'practiceTitle', 'checkinNote', 'practiceUrl'],
    },
    {
      name: 'PE03 每週回顧（有筆記）',
      subject: '【{{practiceTitle}}】每週回顧：看見生活中的成長微光 ✨',
      variables: ['practiceTitle', 'checkinCount', 'notes', 'practiceUrl'],
    },
    {
      name: 'PE04 每週回顧（無筆記）',
      subject: '【{{practiceTitle}}】每週回顧：看見生活中的成長微光 ✨',
      variables: ['practiceTitle', 'checkinCount', 'practiceUrl'],
    },
    {
      name: 'PE05 每週回顧（未打卡）',
      subject: '看不見的成長，也在悄悄發生',
      variables: ['practiceTitle', 'practiceUrl'],
    },
    {
      name: 'PE06 實踐沉睡喚醒',
      subject: '關於【{{practiceTitle}}】的下一步 🛤️',
      variables: ['practiceTitle', 'practiceUrl'],
    },
    {
      name: 'PE07 最終總結（有打卡）',
      subject: '這是你的【{{practiceTitle}}】成長足跡',
      variables: ['practiceTitle', 'totalCheckins', 'practiceUrl'],
    },
    {
      name: 'PE08 最終總結（無打卡）',
      subject: '關於【{{practiceTitle}}】',
      variables: ['practiceTitle', 'practiceUrl'],
    },
    { name: '入門任務 A', subject: '【島島阿學】完成入門任務 A', variables: ['name'] },
    { name: '入門任務 B', subject: '【島島阿學】完成入門任務 B', variables: ['name'] },
    { name: '入門任務 C', subject: '【島島阿學】完成入門任務 C', variables: ['name'] },
    { name: '入門任務 D', subject: '【島島阿學】完成入門任務 D', variables: ['name'] },
    { name: '入門任務 E', subject: '【島島阿學】完成入門任務 E', variables: ['name'] },
  ]
  for (const t of remaining) {
    templates.push({
      ...t,
      body: `<!-- ${t.name} -->\n<p>此模板由程式碼動態生成，請在此填入 HTML 內容。</p>`,
    })
  }

  // ── upsert to DB ─────────────────────────────────────────────────────────

  let created = 0
  let skipped = 0

  for (const tpl of templates) {
    const existing = await prisma.email_templates.findFirst({ where: { name: tpl.name } })
    if (existing) {
      skipped++
      console.log(`  skip (already exists): ${tpl.name}`)
      continue
    }
    await prisma.email_templates.create({
      data: {
        name: tpl.name,
        subject: tpl.subject,
        body: tpl.body,
        variables: tpl.variables,
      },
    })
    created++
    console.log(`  created: ${tpl.name}`)
  }

  console.log(`\n✓ Done — created: ${created}, skipped: ${skipped}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
