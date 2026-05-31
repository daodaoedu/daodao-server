/**
 * 通知摘要 Email 模板
 *
 * 三個 section 依社交學習價值排序：
 * 1. partnerEvents   - 學習夥伴動態（問責感最強）
 * 2. interactionEvents - 有人與你互動（被看見的動力）
 * 3. activityEvents  - 你關注的人有新動態（探索、同儕效應）
 * 4. p2Events        - 共鳴回饋（reactions）
 */

import {
  EMAIL_COLORS,
  generateEmailHead,
  generateEmailWrapper,
  generateBanner,
  generateFooter,
  generateCtaButton,
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
  url?: string;
}

export interface NotificationDigestData {
  recipientName: string;
  /** 學習夥伴動態（PartnerCheckinActivity 等） */
  partnerEvents: NotificationDigestP1Event[];
  /** 有人直接與你互動（Connect、comment、follow 等） */
  interactionEvents: NotificationDigestP1Event[];
  /** 你追蹤的人有新動態（PracticeCheckinActivity 等） */
  activityEvents: NotificationDigestP1Event[];
  /** 共鳴回饋（reactions） */
  p2Events: NotificationDigestP2Event[];
  unsubscribeUrl: string;
  settingsUrl: string;
  homeUrl: string;
}

// ─── 工具函式 ──────────────────────────────────────────────────────────────────

function getEventLabel(type: string): string {
  const labels: Record<string, string> = {
    Connect:                   '想與你連結',
    ConnectAccepted:           '接受了你的連結邀請',
    UserFollowed:              '開始追蹤你',
    PracticeFollowed:          '追蹤了你的主題實踐',
    comment:                   '在你的內容留言',
    comment_reply:             '回覆了你的留言',
    reaction:                  '對你的內容按了共鳴',
    BuddyRequest:              '想成為你的學習夥伴',
    BuddyRequestFollower:      '想成為學習夥伴',
    BuddyAccepted:             '接受了你的夥伴邀請',
    'wish.linked':             '採納了你的許願，已納入路線圖',
    'roadmap.shipped':         '完成了你支持的項目',
    // 學習夥伴動態
    PartnerCheckinActivity:    '完成了一次打卡',
    PartnerUpdateActivity:     '更新了主題實踐',
    // 一般追蹤動態
    PracticeCreated:           '建立了新的主題實踐',
    UserFollowActivity:        '關注了新的對象',
    PracticeCheckinActivity:   '更新了實踐打卡',
    PracticeUpdateActivity:    '更新了主題實踐',
    ConnectRequestActivity:    '向他人發出連結邀請',
    'update-practice-checkin': '更新了實踐打卡',
    'update-practice-finish':  '完成了主題實踐',
  };
  return labels[type] ?? type;
}

/** 夥伴動態卡片（橘色邊框，強調問責感） */
function generatePartnerEventCard(event: NotificationDigestP1Event): string {
  const safeName  = escapeHtml(event.actorName);
  const safeTitle = event.entityTitle ? escapeHtml(event.entityTitle) : '';
  const safeUrl   = sanitizeUrl(event.url);
  const label     = getEventLabel(event.type);
  const subtitle  = safeTitle
    ? `<span style="color: ${EMAIL_COLORS.textSecondary};">《${safeTitle}》</span>`
    : '';

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
  <tr>
    <td style="border: 1px solid ${EMAIL_COLORS.divider}; border-left: 3px solid ${EMAIL_COLORS.brandOrange}; border-radius: 6px; padding: 14px 16px; background-color: #FFF8F0;">
      <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.5;">
        <strong>${safeName}</strong> ${label} ${subtitle}
      </p>
      <p style="margin: 10px 0 0 0;">
        <a href="${safeUrl}" style="font-size: 13px; color: ${EMAIL_COLORS.brandOrange}; text-decoration: underline;">去看看他的動態 &rarr;</a>
      </p>
    </td>
  </tr>
</table>`;
}

/** 互動通知卡片（青色邊框，強調被看見） */
function generateInteractionEventCard(event: NotificationDigestP1Event): string {
  const safeName    = escapeHtml(event.actorName);
  const safeTitle   = event.entityTitle ? escapeHtml(event.entityTitle) : '';
  const safeContent = event.content     ? escapeHtml(event.content)     : '';
  const safeMsg     = event.connectMessage ? escapeHtml(event.connectMessage) : '';
  const safeUrl     = sanitizeUrl(event.url);
  const label       = getEventLabel(event.type);
  const subtitle    = safeTitle
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

/** 一般追蹤動態列表（輕量樣式，鼓勵探索） */
function generateActivityList(events: NotificationDigestP1Event[]): string {
  const rows = events.map(e => {
    const safeName  = escapeHtml(e.actorName);
    const safeTitle = e.entityTitle ? escapeHtml(e.entityTitle) : '';
    const safeUrl   = sanitizeUrl(e.url);
    const label     = getEventLabel(e.type);
    const titlePart = safeTitle
      ? `<span style="color: ${EMAIL_COLORS.textSecondary};">《${safeTitle}》</span>`
      : '';

    return `
<tr>
  <td style="padding: 8px 0; border-bottom: 1px solid ${EMAIL_COLORS.divider};">
    <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.5;">
      <strong>${safeName}</strong> ${label} ${titlePart}
      &nbsp;<a href="${safeUrl}" style="font-size: 13px; color: ${EMAIL_COLORS.brandCyan}; text-decoration: underline;">查看 &rarr;</a>
    </p>
  </td>
</tr>`;
  }).join('');

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  ${rows}
</table>`;
}

/** P2 共鳴摘要列表 */
function generateP2Summary(events: NotificationDigestP2Event[]): string {
  const rows = events.map(e => {
    const safeName  = escapeHtml(e.actorName);
    const safeTitle = e.entityTitle ? escapeHtml(e.entityTitle) : '';
    const safeUrl   = e.url ? sanitizeUrl(e.url) : '';
    const countPart = e.count > 1 ? `等 <strong>${e.count}</strong> 人` : '';

    let description: string;
    if (e.type === 'reaction' && safeTitle) {
      description = `對《${safeTitle}》按了共鳴`;
    } else {
      const label     = getEventLabel(e.type);
      const titlePart = safeTitle ? ` 《${safeTitle}》` : '';
      description = `${label}${titlePart}`;
    }

    const ctaLink = safeUrl
      ? `&nbsp;<a href="${safeUrl}" style="font-size: 13px; color: ${EMAIL_COLORS.brandCyan}; text-decoration: underline;">查看 &rarr;</a>`
      : '';

    return `
<tr>
  <td style="padding: 8px 0; border-bottom: 1px solid ${EMAIL_COLORS.divider};">
    <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.5;">
      <strong>${safeName}</strong>${countPart} ${description}${ctaLink}
    </p>
  </td>
</tr>`;
  }).join('');

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  ${rows}
</table>`;
}

// ─── Section 產生器 ────────────────────────────────────────────────────────────

function buildSection(
  title: string,
  titleColor: string,
  description: string,
  body: string
): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
  <tr>
    <td style="padding-bottom: 4px;">
      <h3 style="margin: 0; font-size: 17px; font-weight: 600; color: ${titleColor}; line-height: 150%;">
        ${title}
      </h3>
    </td>
  </tr>
  <tr>
    <td style="padding-bottom: 12px;">
      <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.5;">
        ${description}
      </p>
    </td>
  </tr>
</table>
${body}`;
}

function buildDivider(): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding: 16px 0;">
      <hr style="border: none; border-top: 1px solid ${EMAIL_COLORS.divider}; margin: 0;">
    </td>
  </tr>
</table>`;
}

// ─── 主要輸出函式 ───────────────────────────────────────────────────────────────

export function generateNotificationDigestSubject(data: NotificationDigestData): string {
  const { recipientName: name, partnerEvents, interactionEvents, activityEvents, p2Events } = data;
  const total = partnerEvents.length + interactionEvents.length + activityEvents.length + p2Events.length;

  if (partnerEvents.length > 0 && interactionEvents.length === 0 && p2Events.length === 0) {
    return `【島島阿學】${name}，你的學習夥伴有新動態！`;
  }
  if (interactionEvents.length > 0 && partnerEvents.length === 0 && p2Events.length === 0) {
    return `【島島阿學】${name}，有人與你互動了`;
  }
  if (p2Events.length > 0 && partnerEvents.length === 0 && interactionEvents.length === 0) {
    return `【島島阿學】${name}，有人對你的內容送出了共鳴`;
  }
  return `【島島阿學】${name}，你有 ${total} 則新動態`;
}

export function generateNotificationDigestHtml(data: NotificationDigestData): string {
  const safeName        = escapeHtml(data.recipientName);
  const safeHomeUrl     = sanitizeUrl(data.homeUrl);
  const safeSettingsUrl = sanitizeUrl(data.settingsUrl);

  const hasPartner     = data.partnerEvents.length > 0;
  const hasInteraction = data.interactionEvents.length > 0;
  const hasActivity    = data.activityEvents.length > 0;
  const hasP2          = data.p2Events.length > 0;

  // 動態 header 文案
  let headerBody: string;
  if (hasPartner && !hasInteraction) {
    headerBody = '你的學習夥伴正在前進，去看看他們在做什麼，或許能給彼此一些動力！';
  } else if (hasInteraction && !hasPartner) {
    headerBody = '有人注意到你的學習旅程，快去看看吧！';
  } else if (hasPartner && hasInteraction) {
    headerBody = '你的島嶼熱鬧起來了！有夥伴與你互動，也有學習夥伴在前進。';
  } else {
    headerBody = '你的島嶼有新動態，快去看看吧！';
  }

  const sections: string[] = [];

  if (hasPartner) {
    sections.push(buildSection(
      '🤝 你的學習夥伴有動態',
      EMAIL_COLORS.brandOrange,
      '他們正在行動，你呢？互相打氣，一起前進！',
      data.partnerEvents.map(generatePartnerEventCard).join('')
    ));
  }

  if (hasInteraction) {
    if (sections.length > 0) sections.push(buildDivider());
    sections.push(buildSection(
      '💬 有人與你互動',
      EMAIL_COLORS.brandCyan,
      '你的學習旅程正在被人看見，去回應他們吧！',
      data.interactionEvents.map(generateInteractionEventCard).join('')
    ));
  }

  if (hasActivity) {
    if (sections.length > 0) sections.push(buildDivider());
    sections.push(buildSection(
      '🌱 你關注的人有新動態',
      EMAIL_COLORS.textSecondary,
      '看看他們在做什麼，也許能給你一些靈感。',
      generateActivityList(data.activityEvents)
    ));
  }

  if (hasP2) {
    if (sections.length > 0) sections.push(buildDivider());
    sections.push(buildSection(
      '✨ 共鳴回饋',
      EMAIL_COLORS.brandOrange,
      '有人追蹤你、或對你的內容按了共鳴，他們正在關注你的學習旅程。',
      generateP2Summary(data.p2Events)
    ));
  }

  const content = `
<!-- 問候語 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 12px;">
      <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%; mso-line-height-rule: exactly;">
        ${safeName}，你的島嶼有新動態！
      </h2>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 28px;">
      <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
        ${escapeHtml(headerBody)}
      </p>
    </td>
  </tr>
</table>

${sections.join('')}

<!-- 查看更多 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-top: 28px; padding-bottom: 8px;" align="center">
      ${generateCtaButton({ text: '前往島島阿學', url: safeHomeUrl, color: 'cyan' })}
    </td>
  </tr>
</table>

<!-- 通知設定 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-top: 12px;" align="center">
      <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.textSecondary};">
        <a href="${safeSettingsUrl}" style="color: ${EMAIL_COLORS.textSecondary};">調整通知設定</a>
      </p>
    </td>
  </tr>
</table>
`;

  return `${generateEmailHead('你有新的島嶼動態')}
${generateEmailWrapper({
    preheader: `${data.recipientName}，${headerBody}`,
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
