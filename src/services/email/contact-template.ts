/**
 * 聯絡郵件模板
 * 使用統一的 base-template 組件
 */

import {
  EMAIL_COLORS,
  generateAuthorSection,
  generateDivider,
  generateStandardEmail,
} from './base-template';
import { escapeHtml, sanitizeUrl } from '../../utils/sanitize';
import type { EmailTemplateContent, ContactEmailData } from '../../types/email';

/**
 * 產生聯絡郵件模板
 */
export const generateContactEmail = (data: ContactEmailData): EmailTemplateContent => {
  const { name, message, userInfo, activityTitle, url, userId, roleList, photoUrl } = data;
  const title = '有夥伴想聯繫你';

  // 安全處理
  const safeName = escapeHtml(name);
  const safeMessage = escapeHtml(message);
  const safeActivityTitle = activityTitle ? escapeHtml(activityTitle) : '';
  const safePhotoUrl = photoUrl ? sanitizeUrl(photoUrl) : 'https://daodao.so/images/email/avatar.png';
  const safeUrl = url ? sanitizeUrl(url) : '';
  const safeUserId = userId ? escapeHtml(userId) : '';
  const safeRole = roleList?.[0] ? escapeHtml(roleList[0]) : '';

  // 處理聯絡方式
  const renderUserInfo = () => {
    if (!userInfo) return '';

    if (Array.isArray(userInfo)) {
      return userInfo.map(info => `
        <p style="margin: 0 0 8px 0; font-size: 14px; color: ${EMAIL_COLORS.textPrimary}; line-height: 150%;">
          ${escapeHtml(info || '')}
        </p>
      `).join('');
    }

    return `
      <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textPrimary}; line-height: 150%;">
        ${escapeHtml(userInfo)}
      </p>
    `;
  };

  const content = `
    <!-- Title -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%; text-align: center;">
            ${title}
          </h2>
        </td>
      </tr>
    </table>

    ${safeActivityTitle ? `
    <!-- Activity Title -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 16px; text-align: center;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 150%;">
            ${safeName} 來信詢問你發起的「${safeActivityTitle}」揪團活動
          </p>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- User Info Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding: 16px; background-color: ${EMAIL_COLORS.bgQuote}; border-radius: 12px; margin-bottom: 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="width: 60px; vertical-align: top;">
                <img src="${safePhotoUrl}" alt="${safeName}" width="50" height="50"
                  style="display: block; border-radius: 50%; object-fit: cover;">
              </td>
              <td style="vertical-align: middle; padding-left: 12px;">
                <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: ${EMAIL_COLORS.textPrimary};">
                  ${safeName}
                </p>
                ${safeRole ? `
                <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textSecondary};">
                  ${safeRole}
                </p>
                ` : ''}
              </td>
              ${safeUrl && safeUserId ? `
              <td style="vertical-align: middle; text-align: right;">
                <a href="${safeUrl}/partner/detail?id=${safeUserId}"
                   style="display: inline-block; padding: 8px 16px; font-size: 14px; color: ${EMAIL_COLORS.textPrimary}; text-decoration: none; border: 1px solid ${EMAIL_COLORS.brandCyan}; border-radius: 20px;">
                  查看檔案
                </a>
              </td>
              ` : ''}
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${safeUrl && safeUserId ? `
    <!-- Tip -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding: 8px 0 16px 0;">
          <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.textSecondary}; line-height: 150%;">
            建議點開「查看檔案」，多了解夥伴後再決定是否要聯繫對方唷！
          </p>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Message -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding: 16px 0;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 175%; white-space: pre-wrap;">
            ${safeMessage}
          </p>
        </td>
      </tr>
    </table>

    ${generateDivider()}

    <!-- Contact Methods -->
    ${userInfo ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 12px;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: ${EMAIL_COLORS.textPrimary}; line-height: 150%;">
            📬 歡迎用以下的方式聯繫我
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          ${renderUserInfo()}
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Discord Info -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 12px;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: ${EMAIL_COLORS.textPrimary}; line-height: 150%;">
            💬 試試 Discord 即時與夥伴交流
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 24px;">
          <a href="https://daodaoedu.notion.site/Discord-bc406c730c814ce78c3ef446a2d326ec"
             target="_blank"
             style="font-size: 14px; color: ${EMAIL_COLORS.brandCyan}; text-decoration: underline;">
            查看 Discord 使用方式簡介
          </a>
        </td>
      </tr>
    </table>

    ${generateDivider()}
    ${generateAuthorSection()}
  `;

  const subject = safeActivityTitle
    ? `【島島阿學】有夥伴想聯繫你關於「${activityTitle}」活動`
    : '【島島阿學】有夥伴想聯繫你';

  return generateStandardEmail({
    title,
    subject,
    preheader: `${safeName} 想與你聯繫${safeActivityTitle ? `關於「${safeActivityTitle}」活動` : ''}`,
    content,
  });
};
