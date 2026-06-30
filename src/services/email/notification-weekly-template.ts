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
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface WeeklyDigestPopularPractice {
  title: string;
  url: string;
}

export interface WeeklyDigestPartnerActivity {
  name: string;
  practiceTitle: string;
  url: string;
}

export interface WeeklyDigestData {
  recipientName: string;
  /** e.g. "3/10" */
  weekStart: string;
  /** e.g. "3/16" */
  weekEnd: string;
  stats: WeeklyDigestStats;
  practiceProgress: WeeklyDigestPractice[];
  /** 學習夥伴本週正在進行的實踐（最多 3 筆） */
  partnerActivities?: WeeklyDigestPartnerActivity[];
  /** 本週熱門主題實踐（共鳴數＋留言數最高，最多 2 筆） */
  popularPractices?: WeeklyDigestPopularPractice[];
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
  const statusIcon =
    practice.status === 'completed' ? '✅' :
    practice.status === 'in_progress' ? '🌱' : '💤';
  const statusLabel =
    practice.status === 'completed' ? '已完成' :
    practice.status === 'in_progress' ? `已打卡 ${practice.checkInCount} 次` :
    '這週你忙於其他挑戰，下週想試試重新開始嗎？';
  const statusColor =
    practice.status === 'completed' ? EMAIL_COLORS.brandCyan : EMAIL_COLORS.textSecondary;

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

/**
 * 產生學習夥伴動態列
 */
function generatePartnerRow(partner: WeeklyDigestPartnerActivity): string {
  const safeName  = escapeHtml(partner.name);
  const safeTitle = escapeHtml(partner.practiceTitle);
  const safeUrl   = sanitizeUrl(partner.url);

  return `
<tr>
  <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.divider};">
    <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.5;">
      <strong>${safeName}</strong> 正在探索《${safeTitle}》
    </p>
    <p style="margin: 4px 0 0 0;">
      <a href="${safeUrl}" style="font-size: 13px; color: ${EMAIL_COLORS.brandOrange}; text-decoration: underline;">去為他加油 &rarr;</a>
    </p>
  </td>
</tr>`;
}

// ─── 主要輸出函式 ───────────────────────────────────────────────────────────────

/**
 * 產生週報 Email 主旨
 */
export function generateWeeklyDigestSubject(data: WeeklyDigestData): string {
  const { recipientName: name, stats, practiceProgress } = data;
  const hasProgress = practiceProgress.some(p => p.status !== 'not_started');
  const hasInteraction = stats.reactions + stats.comments + stats.newFollowers + stats.connectRequests > 0;

  if (!hasProgress && hasInteraction) {
    return `【島島阿學】${name}，這週有人看見了你的學習`;
  }
  return `【島島阿學】${name}，島島陪你回顧這一週 🌿`;
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
<!-- 本週影響力 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 8px;">
      <h3 style="margin: 0; font-size: 17px; font-weight: 600; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
        本週影響力 ✨
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
        你這週的學習足跡 🌱
      </h3>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
  ${data.practiceProgress.map(generatePracticeRow).join('')}
</table>` : '';

  // 學習夥伴區塊（若有）
  const partnerSection = data.partnerActivities && data.partnerActivities.length > 0 ? `
<!-- 學習夥伴 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 8px;">
      <h3 style="margin: 0; font-size: 17px; font-weight: 600; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
        你的學習夥伴這週也在前進 🤝
      </h3>
    </td>
  </tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
  ${data.partnerActivities.map(generatePartnerRow).join('')}
</table>` : '';

  // 鼓勵文案
  const encouragement = data.practiceProgress.some(p => p.status === 'completed')
    ? '你完成了一段旅程，這份堅持是送給自己最好的禮物！'
    : data.practiceProgress.some(p => p.status === 'in_progress')
    ? '持續累積，每一次打卡都是你探索自我的足跡。'
    : '新的一週，要不要開啟一段新的探索旅程？';

  // 熱門主題實踐區塊（最多 2 筆）
  const popularSection = data.popularPractices && data.popularPractices.length > 0 ? `
<!-- 熱門主題實踐 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 8px; padding-top: 8px;">
      <h3 style="margin: 0; font-size: 17px; font-weight: 600; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
        看看本週熱門主題實踐！
      </h3>
    </td>
  </tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
  ${data.popularPractices.map(p => `
  <tr>
    <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.divider};">
      <a href="${sanitizeUrl(p.url)}" style="font-size: 14px; font-weight: 600; color: ${EMAIL_COLORS.brandCyan}; text-decoration: none;">
        ${escapeHtml(p.title)} →
      </a>
    </td>
  </tr>`).join('')}
</table>` : '';

  const content = `
<!-- 問候語 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 8px;">
      <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%; mso-line-height-rule: exactly;">
        ${safeName}，島島陪你回顧這一週 🌿
      </h2>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 160%;">
        ${data.weekStart}～${data.weekEnd}
      </p>
    </td>
  </tr>
</table>

${statsSection}

${practiceSection}

${partnerSection}

${popularSection}

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
    preheader: `島島陪 ${data.recipientName} 回顧這一週（${data.weekStart}～${data.weekEnd}）。`,
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
