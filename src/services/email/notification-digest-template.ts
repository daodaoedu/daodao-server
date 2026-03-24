/**
 * 通知摘要 Email 模板
 * 彙整 P1（重要連結與討論）與 P2（共鳴回饋）事件，每4小時批次發送
 */

import {
  EMAIL_COLORS,
  generateEmailHead,
  generateEmailWrapper,
  generateBanner,
  generateFooter,
  generateCtaButton,
  generateDivider,
} from './base-template';
import { escapeHtml, sanitizeUrl } from '../../utils/sanitize';

// ─── 型別定義 ──────────────────────────────────────────────────────────────────

export interface NotificationDigestP1Event {
  type: string;
  actorName: string;
  entityTitle?: string;
  content?: string;
  connectMessage?: string;
  url: string;
}

export interface NotificationDigestP2Event {
  type: string;
  actorName: string;
  count: number;
  entityTitle?: string;
}

export interface NotificationDigestData {
  recipientName: string;
  p1Events: NotificationDigestP1Event[];
  p2Events: NotificationDigestP2Event[];
  unsubscribeUrl: string;
  settingsUrl: string;
  homeUrl: string;
}

// ─── 工具函式 ──────────────────────────────────────────────────────────────────

/**
 * 將事件 type 轉換為易讀的中文標籤
 */
function getEventLabel(type: string): string {
  const labels: Record<string, string> = {
    Connect:                      '想與你連結',
    ConnectAccepted:              '接受了你的連結邀請',
    UserFollowed:                 '開始追蹤你',
    PracticeFollowed:             '追蹤了你的主題實踐',
    comment:                      '在你的內容留言',
    reaction:                     '對你的內容按了共鳴',
    PracticeCreated:              '建立了新的主題實踐',
    BuddyRequest:                 '想成為你的學習夥伴',
    BuddyRequestFollower:         '想成為學習夥伴（追蹤通知）',
    BuddyAccepted:                '接受了你的夥伴邀請',
    'update-practice-checkin':    '更新了實踐打卡',
    'update-practice-finish':     '完成了主題實踐',
  };
  return labels[type] ?? type;
}

/**
 * 產生單一 P1 事件卡片
 */
function generateP1EventCard(event: NotificationDigestP1Event): string {
  const safeName    = escapeHtml(event.actorName);
  const safeTitle   = event.entityTitle ? escapeHtml(event.entityTitle) : '';
  const safeContent = event.content     ? escapeHtml(event.content)     : '';
  const safeMsg     = event.connectMessage ? escapeHtml(event.connectMessage) : '';
  const safeUrl     = sanitizeUrl(event.url);
  const label       = getEventLabel(event.type);

  const subtitle = safeTitle
    ? `<span style="color: ${EMAIL_COLORS.textSecondary};">《${safeTitle}》</span>`
    : '';

  const preview = safeContent
    ? `<p style="margin: 6px 0 0 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.5; font-style: italic;">「${safeContent}」</p>`
    : safeMsg
    ? `<p style="margin: 6px 0 0 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.5; font-style: italic;">「${safeMsg}」</p>`
    : '';

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
  <tr>
    <td style="border: 1px solid ${EMAIL_COLORS.divider}; border-left: 3px solid ${EMAIL_COLORS.brandCyan}; border-radius: 6px; padding: 14px 16px; background-color: ${EMAIL_COLORS.bgContent};">
      <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.5;">
        <strong>${safeName}</strong> ${label} ${subtitle}
      </p>
      ${preview}
      <p style="margin: 10px 0 0 0;">
        <a href="${safeUrl}" style="font-size: 13px; color: ${EMAIL_COLORS.brandCyan}; text-decoration: underline;">前往查看 &rarr;</a>
      </p>
    </td>
  </tr>
</table>`;
}

/**
 * 產生 P2 摘要列表（聚合顯示共鳴數）
 */
function generateP2Summary(events: NotificationDigestP2Event[]): string {
  const rows = events.map(e => {
    const safeName  = escapeHtml(e.actorName);
    const safeTitle = e.entityTitle ? escapeHtml(e.entityTitle) : '';
    const label     = getEventLabel(e.type);

    const titlePart = safeTitle ? `《${safeTitle}》` : '';
    const countPart = e.count > 1
      ? `等 <strong>${e.count}</strong> 人`
      : '';

    return `
<tr>
  <td style="padding: 8px 0; border-bottom: 1px solid ${EMAIL_COLORS.divider};">
    <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.5;">
      <strong>${safeName}</strong>${countPart} ${label} ${titlePart}
    </p>
  </td>
</tr>`;
  }).join('');

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  ${rows}
</table>`;
}

// ─── 主要輸出函式 ───────────────────────────────────────────────────────────────

/**
 * 產生通知摘要 Email 主旨
 */
export function generateNotificationDigestSubject(data: NotificationDigestData): string {
  const total = data.p1Events.length + data.p2Events.length;
  const name  = data.recipientName;

  if (data.p1Events.length > 0 && data.p2Events.length > 0) {
    return `【島島阿學】${name}，你有 ${total} 則新動態等你查看`;
  }
  if (data.p1Events.length > 0) {
    return `【島島阿學】${name}，你有 ${data.p1Events.length} 則新訊息`;
  }
  return `【島島阿學】${name}，有人對你的內容送出了共鳴`;
}

/**
 * 產生通知摘要 Email HTML
 */
export function generateNotificationDigestHtml(data: NotificationDigestData): string {
  const safeName       = escapeHtml(data.recipientName);
  const safeSettingsUrl = sanitizeUrl(data.settingsUrl);

  const p1Section = data.p1Events.length > 0 ? `
<!-- P1 區塊：重要連結與討論 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 8px;">
      <h3 style="margin: 0; font-size: 17px; font-weight: 600; color: ${EMAIL_COLORS.brandCyan}; line-height: 150%;">
        重要連結與討論
      </h3>
    </td>
  </tr>
</table>
${data.p1Events.map(generateP1EventCard).join('')}
` : '';

  const p2Section = data.p2Events.length > 0 ? `
<!-- P2 區塊：共鳴回饋 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-top: 8px; padding-bottom: 8px;">
      <h3 style="margin: 0; font-size: 17px; font-weight: 600; color: ${EMAIL_COLORS.brandOrange}; line-height: 150%;">
        共鳴回饋
      </h3>
    </td>
  </tr>
</table>
${generateP2Summary(data.p2Events)}
` : '';

  const divider = p1Section && p2Section ? `
<!-- 分隔線 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding: 16px 0;">
      <hr style="border: none; border-top: 1px solid ${EMAIL_COLORS.divider}; margin: 0;">
    </td>
  </tr>
</table>` : '';

  const content = `
<!-- 問候語 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 20px;">
      <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%; mso-line-height-rule: exactly;">
        ${safeName}，你的島嶼有新動態！
      </h2>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 24px;">
      <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
        有夥伴在你的學習旅程留下了足跡，快去看看吧！
      </p>
    </td>
  </tr>
</table>

${p1Section}
${divider}
${p2Section}

<!-- 前往通知設定 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-top: 24px; padding-bottom: 8px;" align="center">
      ${generateCtaButton({ text: '前往通知設定', url: safeSettingsUrl, color: 'cyan' })}
    </td>
  </tr>
</table>
`;

  const title = '你有新的島嶼動態';

  return `${generateEmailHead(title)}
${generateEmailWrapper({
    preheader: `${data.recipientName}，有夥伴在你的學習旅程留下了足跡。`,
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
