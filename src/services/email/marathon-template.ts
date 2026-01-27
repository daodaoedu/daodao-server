/**
 * 馬拉松報名確認郵件模板
 * 使用統一的 base-template 組件
 */

import {
  EMAIL_COLORS,
  generateAuthorSection,
  generateDivider,
  generateStandardEmail,
} from './base-template';
import { escapeHtml } from '../../utils/sanitize';
import type { EmailTemplateContent, MarathonEmailData } from '../../types/email';

/**
 * 產生馬拉松報名確認郵件模板
 */
export const generateMarathonEmail = (data: MarathonEmailData): EmailTemplateContent => {
  const { name, marathonTitle, marathonDate, marathonDescription } = data;

  // 安全處理
  const safeName = escapeHtml(name);
  const safeMarathonTitle = escapeHtml(marathonTitle);
  const safeMarathonDate = marathonDate ? escapeHtml(marathonDate) : '';
  const safeMarathonDescription = marathonDescription ? escapeHtml(marathonDescription) : '';

  const content = `
    <!-- Greeting -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
            Dear ${safeName}，
          </h2>
        </td>
      </tr>
    </table>

    <!-- Main Content -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 175%;">
            感謝申請「島島盃 - 2025 春季學習馬拉松」!
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 175%;">
            我們收到你的申請了，計畫名稱是「<strong>${safeMarathonTitle}</strong>」
          </p>
          ${safeMarathonDate ? `
          <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 175%;">
            活動日期：${safeMarathonDate}
          </p>
          ` : ''}
          ${safeMarathonDescription ? `
          <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 175%;">
            活動說明：${safeMarathonDescription}
          </p>
          ` : ''}
          <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 175%;">
            在申請截止日前你都還可以登入修改你的計劃。
          </p>
        </td>
      </tr>
    </table>

    <!-- Contact Info -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 175%;">
            若有任何疑問歡迎 email 至 <a href="mailto:contact@daodao.so" style="color: ${EMAIL_COLORS.brandCyan}; text-decoration: none;">contact@daodao.so</a>
          </p>
        </td>
      </tr>
    </table>

    ${generateDivider()}
    ${generateAuthorSection()}
  `;

  return generateStandardEmail({
    title: '報名確認！',
    subject: '【島島阿學】馬拉松報名成功確認',
    preheader: `感謝申請「${safeMarathonTitle}」！我們已收到您的報名`,
    content,
  });
};
