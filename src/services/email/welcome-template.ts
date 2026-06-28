/**
 * 歡迎信模板
 */

import { getEmailConfig } from '../../config/email.config';
import {
  EMAIL_COLORS,
  generateEmailHead,
  generateEmailWrapper,
  generateBanner,
  generateFooter,
  generateAuthorSection,
  generateCtaButton,
  generateDivider,
} from './base-template';

import { escapeHtml, sanitizeUrl } from '../../utils/sanitize';
import type { EmailTemplateContent, WelcomeEmailData } from '../../types/email';

/**
 * 來源管道對應群組的映射表
 */
export const REFERRAL_GROUP_MAP: Record<string, 'social-media' | 'community' | 'default'> = {
  instagram: 'social-media',
  facebook: 'social-media',
  linkedin: 'social-media',
  discord: 'community',
  friend_referral: 'community',
};

/**
 * 根據 referralSource 取得對應的 referralGroup
 */
export const getReferralGroup = (referralSource?: string | null): 'social-media' | 'community' | 'default' => {
  if (!referralSource) return 'default';
  return REFERRAL_GROUP_MAP[referralSource] ?? 'default';
};

/**
 * 產生歡迎信模板（統一版本）
 */
export const generateWelcomeEmail = (data: WelcomeEmailData): EmailTemplateContent => {
  const { name, practiceUrl, unsubscribeUrl } = data;
  const config = getEmailConfig();

  const subject = '歡迎來到島島阿學！';
  const title = '歡迎來到島島阿學';
  const preheader = '歡迎加入島島阿學！以科技與社群，每個人都是知識的創造者與學習推動者。';

  const defaultCtaUrl = config.urls.frontend;
  const defaultUnsubscribeUrl = `${config.urls.frontend}/unsubscribe`;

  const safeName = escapeHtml(name);
  const safeCtaUrl = sanitizeUrl(practiceUrl || defaultCtaUrl);

  const content = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%; mso-line-height-rule: exactly;">
            Hello ${safeName}，
          </h2>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            歡迎來到島島阿學！
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 28px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            想學新東西但不確定有沒有興趣？一個人學習覺得孤單？<br>我們以科技與社群打造島島阿學，在這裡，每個人都是知識的創造者與學習推動者！
          </p>
        </td>
      </tr>
    </table>

    ${generateCtaButton({
      text: '進入島島阿學開始學習新生活',
      url: safeCtaUrl,
      color: 'orange',
    })}
  `;

  const html = `${generateEmailHead(title)}
${generateEmailWrapper({
  preheader,
  content: `
    ${generateBanner()}
    <tr>
      <td class="main-content" style="padding: 32px 40px;">
        ${content}
        ${generateDivider()}
        ${generateAuthorSection()}
      </td>
    </tr>
    ${generateFooter(unsubscribeUrl || defaultUnsubscribeUrl)}
  `,
})}`;

  const innerContent = `${content}\n${generateDivider()}\n${generateAuthorSection()}`;
  return { subject, html, content: innerContent, preheader };
};
