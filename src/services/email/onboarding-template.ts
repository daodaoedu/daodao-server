/**
 * Onboarding Email Templates (A–E)
 * 入門任務觸發信，依 Onboarding Letter.md 設計
 */

import { getEmailConfig } from '../../config/email.config';
import {
  EMAIL_COLORS,
  generateCtaButton,
  generateAuthorSection,
  generateDivider,
  generateStandardEmail,
} from './base-template';
import { escapeHtml } from '../../utils/sanitize';
import type { EmailTemplateContent } from '../../types/email';

// ── 共用工具 ──────────────────────────────────────────────────────────────────

function greeting(name: string): string {
  const safe = escapeHtml(name);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
            Hello ${safe}，
          </h2>
        </td>
      </tr>
    </table>`;
}

function paragraph(text: string, pb = 24): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: ${pb}px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            ${text}
          </p>
        </td>
      </tr>
    </table>`;
}

// ── A: 學習測驗 ───────────────────────────────────────────────────────────────

export function generateOnboardingAEmail(data: { name: string }): EmailTemplateContent {
  const config = getEmailConfig();
  const content = `
    ${greeting(data.name)}
    ${paragraph('每個人都有不同的學習方式和習慣！<br>利用 2 分鐘了解你是哪種學習類型，找到你適合的學習策略與夥伴！')}
    ${generateCtaButton({ text: '進行測驗', url: `${config.urls.website}/quiz`, color: 'cyan' })}
    ${generateDivider()}
    ${generateAuthorSection()}
  `;
  return generateStandardEmail({
    title: '學習風格測驗',
    subject: '學習風格測驗 - 你是什麼島?',
    preheader: '利用 2 分鐘了解你的學習類型，找到最適合你的學習夥伴！',
    content,
  });
}

// ── B: 帳號必填設定 ───────────────────────────────────────────────────────────

export function generateOnboardingBEmail(data: { name: string }): EmailTemplateContent {
  const config = getEmailConfig();
  const content = `
    ${greeting(data.name)}
    ${paragraph('為了讓島島阿學能更懂你的學習步調與喜好，想邀請你花 3 分鐘完成個人偏好設定。')}
    ${paragraph('這個小動作讓我們能為你更精準提供最適合的學習和成長建議。', 28)}
    ${generateCtaButton({ text: '進行填寫', url: `${config.urls.frontend}/settings`, color: 'orange' })}
    ${generateDivider()}
    ${generateAuthorSection()}
  `;
  return generateStandardEmail({
    title: '為你量身打造學習導航',
    subject: '為你量身打造學習導航',
    preheader: '花 3 分鐘完成個人偏好設定，讓島島更了解你！',
    content,
  });
}

// ── C: 建立主題實踐 ───────────────────────────────────────────────────────────

export function generateOnboardingCEmail(data: { name: string }): EmailTemplateContent {
  const config = getEmailConfig();
  const content = `
    ${greeting(data.name)}
    ${paragraph('與其等待完美的時機，不如現在就啟一個「主題實踐」！<br>建立一個 7–30 天的主題實踐，把想法變成一次小小的行動。')}
    ${paragraph(`想知道別人在做什麼嗎？可以到「<a href="${config.urls.frontend}" style="color: ${EMAIL_COLORS.brandCyan}; text-decoration: underline;">靈感</a>」看看！`, 28)}
    ${generateCtaButton({ text: '建立主題實踐', url: `${config.urls.frontend}/practices/new`, color: 'cyan' })}
    ${generateDivider()}
    ${generateAuthorSection()}
  `;
  return generateStandardEmail({
    title: '啟動你的主題實踐',
    subject: '啟動你的主題實踐',
    preheader: '建立一個 7–30 天的主題實踐，把想法變成行動！',
    content,
  });
}

// ── D: 進行第一次打卡 ─────────────────────────────────────────────────────────

export function generateOnboardingDEmail(data: { name: string }): EmailTemplateContent {
  const config = getEmailConfig();
  const content = `
    ${greeting(data.name)}
    ${paragraph('準備好記錄你的第一個進展了嗎？')}
    ${paragraph('打卡不需要追求完美，除了一鍵打卡讓你看到推動進度，另外花個 3 分鐘，文字記下今天的一個「小卡關」或「新發現」，都是在為你的成長做記錄。', 28)}
    ${generateCtaButton({ text: '現在就留下你的足跡', url: `${config.urls.frontend}/practices`, color: 'orange' })}
    ${generateDivider()}
    ${generateAuthorSection()}
  `;
  return generateStandardEmail({
    title: '完成你的第一次打卡',
    subject: '看見成長！完成你的第一次打卡',
    preheader: '打卡不需要追求完美，從一個小發現開始記錄你的成長！',
    content,
  });
}

// ── E: 「靈感」留言 ───────────────────────────────────────────────────────────

export function generateOnboardingEEmail(data: { name: string }): EmailTemplateContent {
  const config = getEmailConfig();
  const content = `
    ${greeting(data.name)}
    ${paragraph('學習是建立在人與人的互動與交流上！')}
    ${paragraph(`當你在「靈感」看見讓你感興趣的內容時，試著留下一個簡單的回應吧！<br>這不只是給對方的支持，也透過對話，讓你的思考從模糊變得清晰。`, 28)}
    ${generateCtaButton({ text: '到「靈感」看看', url: config.urls.frontend, color: 'cyan' })}
    ${generateDivider()}
    ${generateAuthorSection()}
  `;
  return generateStandardEmail({
    title: '你在靈感看見共鳴了嗎？',
    subject: '你在靈感看見共鳴了嗎？✨',
    preheader: '試著在靈感留下一個回應，讓思考從模糊變得清晰！',
    content,
  });
}
