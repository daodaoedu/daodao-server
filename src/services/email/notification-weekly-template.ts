/**
 * 週報 Email 模板
 * 每週日 20:00 UTC+8 發送，彙整本週活動統計與實踐進度
 */

import {
  EMAIL_COLORS,
  EMAIL_ASSETS,
  generateEmailHead,
  generateEmailWrapper,
  generateBanner,
  generateFooter,
  generateCtaButton,
} from './base-template';
import { escapeHtml, sanitizeUrl } from '../../utils/sanitize';

// ─── 型別定義 ──────────────────────────────────────────────────────────────────

export interface WeeklyDigestStats {
  reactions: number;
  comments: number;
  newFollowers: number;
  connectRequests: number;
}

export interface WeeklyDigestPractice {
  title: string;
  checkInCount: number;
  isCompleted: boolean;
}

export interface WeeklyDigestData {
  recipientName: string;
  /** e.g. "3/10" */
  weekStart: string;
  /** e.g. "3/16" */
  weekEnd: string;
  stats: WeeklyDigestStats;
  practiceProgress: WeeklyDigestPractice[];
  unsubscribeUrl: string;
  settingsUrl: string;
}

// ─── 工具函式 ──────────────────────────────────────────────────────────────────

/**
 * 產生單一統計數字方塊
 */
function generateStatBox(label: string, value: number): string {
  return `
<td align="center" style="padding: 12px 8px;">
  <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${EMAIL_COLORS.brandCyan}; line-height: 1.2;">${value}</p>
  <p style="margin: 4px 0 0 0; font-size: 12px; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.4;">${label}</p>
</td>`;
}

/**
 * 產生實踐進度列
 */
function generatePracticeRow(practice: WeeklyDigestPractice): string {
  const safeTitle = escapeHtml(practice.title);
  const statusIcon = practice.isCompleted ? '✅' : '🌱';
  const statusLabel = practice.isCompleted ? '已完成' : `已打卡 ${practice.checkInCount} 次`;
  const statusColor = practice.isCompleted ? EMAIL_COLORS.brandCyan : EMAIL_COLORS.textSecondary;

  return `
<tr>
  <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.divider};">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="width: 24px; vertical-align: top; padding-top: 2px;">
          <span style="font-size: 16px;">${statusIcon}</span>
        </td>
        <td style="padding-left: 8px;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.4;">${safeTitle}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: ${statusColor};">${statusLabel}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

// ─── 主要輸出函式 ───────────────────────────────────────────────────────────────

/**
 * 產生週報 Email 主旨
 */
export function generateWeeklyDigestSubject(data: WeeklyDigestData): string {
  return `【島島阿學】${data.recipientName} 的本週學習週報（${data.weekStart}～${data.weekEnd}）`;
}

/**
 * 產生週報 Email HTML
 */
export function generateWeeklyDigestHtml(data: WeeklyDigestData): string {
  const safeName        = escapeHtml(data.recipientName);
  const safeSettingsUrl = sanitizeUrl(data.settingsUrl);
  const { stats }       = data;

  // 統計區塊
  const statsSection = `
<!-- 本週統計 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 8px;">
      <h3 style="margin: 0; font-size: 17px; font-weight: 600; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
        本週你的影響力
      </h3>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%"
  style="border: 1px solid ${EMAIL_COLORS.divider}; border-radius: 8px; background-color: ${EMAIL_COLORS.bgOuter}; margin-bottom: 24px;">
  <tr>
    ${generateStatBox('共鳴數', stats.reactions)}
    ${generateStatBox('留言數', stats.comments)}
    ${generateStatBox('新追蹤者', stats.newFollowers)}
    ${generateStatBox('連結邀請', stats.connectRequests)}
  </tr>
</table>`;

  // 實踐進度區塊（若有）
  const practiceSection = data.practiceProgress.length > 0 ? `
<!-- 實踐進度 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 8px;">
      <h3 style="margin: 0; font-size: 17px; font-weight: 600; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
        本週實踐進度
      </h3>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
  ${data.practiceProgress.map(generatePracticeRow).join('')}
</table>` : '';

  // 鼓勵文案
  const encouragement = data.practiceProgress.some(p => p.isCompleted)
    ? '你完成了一段旅程，這份堅持是送給自己最好的禮物！'
    : data.practiceProgress.length > 0
    ? '持續累積，每一次打卡都是你探索自我的足跡。'
    : '新的一週，要不要開啟一段新的探索旅程？';

  const content = `
<!-- 問候語 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 8px;">
      <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%; mso-line-height-rule: exactly;">
        ${safeName}，你的本週學習週報來了！
      </h2>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 160%;">
        ${data.weekStart}～${data.weekEnd} 的學習足跡
      </p>
    </td>
  </tr>
</table>

${statsSection}

${practiceSection}

<!-- 鼓勵文案 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding: 16px; background-color: ${EMAIL_COLORS.bgOuter}; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 15px; font-style: italic; color: ${EMAIL_COLORS.textPrimary}; line-height: 170%; text-align: center;">
        ${encouragement}
      </p>
    </td>
  </tr>
</table>

<!-- 吉祥物插圖 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 16px 0;">
      <img src="${EMAIL_ASSETS.mascot}" alt="島島阿學吉祥物" width="100" height="100"
        class="illustration" style="display: block; width: 100px; height: auto; max-width: 100px;">
    </td>
  </tr>
</table>

<!-- CTA -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding-top: 8px;">
      ${generateCtaButton({ text: '前往我的小島', url: safeSettingsUrl.replace('/settings/notifications', ''), color: 'orange' })}
    </td>
  </tr>
</table>

<!-- 設定連結 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding-top: 12px;">
      <a href="${safeSettingsUrl}" style="font-size: 13px; color: ${EMAIL_COLORS.textSecondary}; text-decoration: underline;">
        前往通知設定
      </a>
    </td>
  </tr>
</table>
`;

  const title = '你的本週學習週報';

  return `${generateEmailHead(title)}
${generateEmailWrapper({
    preheader: `${data.recipientName} 的本週學習週報（${data.weekStart}～${data.weekEnd}）。`,
    content: `
    ${generateBanner()}
    <tr>
      <td class="main-content" style="padding: 32px 40px;">
        ${content}
      </td>
    </tr>
    ${generateFooter(sanitizeUrl(data.unsubscribeUrl))}
  `,
  })}`;
}
