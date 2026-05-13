/**
 * Reaction Notification Email 模板
 *
 * 當實踐收到共鳴（reaction）時，1小時後彙整發送給實踐擁有者的通知信。
 */

import {
  EMAIL_COLORS,
  EMAIL_ASSETS,
  generateStandardEmail,
  generateCtaButton,
} from './base-template';
import { escapeHtml, sanitizeUrl } from '../../utils/sanitize';
import type { EmailTemplateContent } from '../../types/email';

// ─── 型別定義 ──────────────────────────────────────────────────────────────────

export interface ReactionNotificationData {
  recipientName: string;
  practiceTitle: string;
  reactionCount: number;
  practiceUrl: string;
  unsubscribeUrl: string;
  reactionType?: string;
}

const REACTION_EMOJI_MAP: Record<string, string> = {
  encourage: '🥰',
  touched: '💓',
  fire: '🔥',
  useful: '👍🏻',
  sameHere: '😳',
  curious: '🧐',
};

function getReactionEmoji(reactionType: string | undefined): string {
  return (reactionType && REACTION_EMOJI_MAP[reactionType]) ?? '🎉';
}

// ─── 主要輸出函式 ───────────────────────────────────────────────────────────────

/**
 * 產生 reaction 通知 Email
 */
export function generateReactionNotificationEmail(data: ReactionNotificationData): EmailTemplateContent {
  const safeName         = escapeHtml(data.recipientName);
  const safeTitle        = escapeHtml(data.practiceTitle);
  const safePracticeUrl  = sanitizeUrl(data.practiceUrl);
  const reactionEmoji    = getReactionEmoji(data.reactionType);

  const subject = `「${data.practiceTitle}」獲得了 ${data.reactionCount} 個鼓勵！`;

  const content = `
<!-- 問候語 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 8px;">
      <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%; mso-line-height-rule: exactly;">
        ${safeName}，你的實踐獲得大家的鼓勵了！
      </h2>
    </td>
  </tr>
</table>

<!-- 說明文字 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 24px;">
      <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 170%;">
        你的實踐「<strong>${safeTitle}</strong>」獲得了 <strong style="color: ${EMAIL_COLORS.brandCyan};">${data.reactionCount}</strong> 人的鼓勵 ${reactionEmoji}
      </p>
      <p style="margin: 8px 0 0 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 170%;">
        繼續加油，你的每一步都在感染著更多人！
      </p>
    </td>
  </tr>
</table>

<!-- 統計卡片 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"
  style="border: 1px solid ${EMAIL_COLORS.divider}; border-radius: 8px; background-color: ${EMAIL_COLORS.bgOuter}; margin-bottom: 24px;">
  <tr>
    <td align="center" style="padding: 20px;">
      <p style="margin: 0; font-size: 40px; font-weight: 700; color: ${EMAIL_COLORS.brandCyan}; line-height: 1.2;">${data.reactionCount}</p>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.4;">共鳴鼓勵數</p>
    </td>
  </tr>
</table>

<!-- 吉祥物插圖 -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 8px 0 16px 0;">
      <img src="${EMAIL_ASSETS.mascot}" alt="島島阿學吉祥物" width="100" height="100"
        class="illustration" style="display: block; width: 100px; height: auto; max-width: 100px;">
    </td>
  </tr>
</table>

<!-- CTA -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding-top: 8px;">
      ${generateCtaButton({ text: '查看我的實踐', url: safePracticeUrl, color: 'orange' })}
    </td>
  </tr>
</table>
`;

  return generateStandardEmail({
    title: `你的實踐「${data.practiceTitle}」獲得鼓勵`,
    subject,
    preheader: `你的實踐「${data.practiceTitle}」已獲得 ${data.reactionCount} 個鼓勵，快去看看吧！`,
    content,
    unsubscribeUrl: data.unsubscribeUrl,
  });
}
