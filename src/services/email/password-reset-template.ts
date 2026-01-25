/**
 * 密碼重設郵件模板
 * 使用統一的 base-template 組件
 */

import {
  EMAIL_COLORS,
  generateCtaButton,
  generateAuthorSection,
  generateDivider,
  generateStandardEmail,
} from './base-template';
import { escapeHtml, sanitizeUrl } from '../../utils/sanitize';
import type { EmailTemplateContent, PasswordResetEmailData } from '../../types/email';

/**
 * 產生密碼重設郵件模板
 */
export const generatePasswordResetEmail = (data: PasswordResetEmailData): EmailTemplateContent => {
  const { name, resetLink } = data;

  // 安全處理
  const safeName = name ? escapeHtml(name) : '';
  const safeResetLink = sanitizeUrl(resetLink);

  const greeting = safeName ? `${safeName}，您好！` : '您好！';

  const content = `
    <!-- Greeting -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
            ${greeting}
          </h2>
        </td>
      </tr>
    </table>

    <!-- Main Content -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 175%;">
            我們收到您的密碼重設請求。
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 175%;">
            請點擊以下按鈕來重設您的密碼：
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    ${generateCtaButton({
      text: '重設密碼',
      url: safeResetLink,
      color: 'cyan'
    })}

    <!-- Warning Info -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 175%;">
            如果您沒有要求重設密碼，請忽略此郵件。
          </p>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 175%;">
            此連結將在 24 小時後失效。
          </p>
          <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 175%;">
            如果您無法點擊按鈕，歡迎到 Discord 裡的 <strong style="color: ${EMAIL_COLORS.textPrimary};">#島島網站回饋</strong> 頻道讓我們知道唷！
          </p>
        </td>
      </tr>
    </table>

    ${generateDivider()}
    ${generateAuthorSection()}
  `;

  return generateStandardEmail({
    title: '密碼重設',
    subject: '【島島阿學】密碼重設',
    preheader: '您的密碼重設請求',
    content,
  });
};
