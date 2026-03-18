/**
 * 歡迎信模板
 * 根據用戶來源管道群組（referralGroup），產生不同版本的歡迎信
 * @see docs/email/implementation-guide.md
 * @see docs/email/Welcome Letter - 202601.md
 */

import { getEmailConfig } from '../../config/email.config';
import {
  EMAIL_COLORS,
  EMAIL_ASSETS,
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
 * 注意：此處的 key 必須與 onboarding 表單中 referral_source 欄位的允許值保持一致。
 * 若新增來源選項，需同步更新此映射表，否則新來源會 fallback 至 'default' 群組。
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
 * 產生歡迎信模板
 * 根據 referralGroup 決定使用哪個版本
 */
export const generateWelcomeEmail = (data: WelcomeEmailData): EmailTemplateContent => {
  const { name, referralGroup, practiceUrl, illustrationUrl, unsubscribeUrl } = data;
  const config = getEmailConfig();

  const subject = '【島島阿學】歡迎來到島島阿學！';
  const title = '歡迎來到島島阿學';

  // 預設值
  const defaultPracticeUrl = `${config.urls.frontend}/practices`;
  const defaultIllustrationUrl = EMAIL_ASSETS.mascot;
  const defaultUnsubscribeUrl = `${config.urls.frontend}/unsubscribe`;

  // 根據來源群組選擇內容
  let content: string;
  let preheader: string;

  switch (referralGroup) {
    case 'social-media':
      content = generateSocialMediaContent({
        name,
        practiceUrl: practiceUrl || defaultPracticeUrl,
        illustrationUrl: illustrationUrl || defaultIllustrationUrl,
      });
      preheader = '歡迎加入島島阿學！找到志同道合的學習夥伴，一起在這裡探索與成長。';
      break;
    case 'community':
      content = generateCommunityContent({
        name,
        practiceUrl: practiceUrl || defaultPracticeUrl,
        illustrationUrl: illustrationUrl || defaultIllustrationUrl,
      });
      preheader = '歡迎加入島島阿學！和學習夥伴一起走，學習之路更有力量。';
      break;
    default:
      content = generateDefaultContent({
        name,
        practiceUrl: practiceUrl || defaultPracticeUrl,
        illustrationUrl: illustrationUrl || defaultIllustrationUrl,
      });
      preheader = '歡迎加入島島阿學！了解自己的學習類型，開始主題實踐之旅。';
      break;
  }

  // 組合完整 HTML（使用低階 generateEmailHead + generateEmailWrapper 而非 generateStandardEmail，
  // 因為歡迎信需要在 wrapper 內嵌入 generateBanner()，此結構不符合 generateStandardEmail 的假設）
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

  return { subject, html };
};

/**
 * 社群媒體來源版本內容
 * 強調找到志同道合的學習夥伴
 */
const generateSocialMediaContent = (data: {
  name: string;
  practiceUrl: string;
  illustrationUrl: string;
}): string => {
  const safeName = escapeHtml(data.name);
  const safePracticeUrl = sanitizeUrl(data.practiceUrl);
  const safeIllustrationUrl = sanitizeUrl(data.illustrationUrl);

  return `
    <!-- Greeting (h2) -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%; mso-line-height-rule: exactly;">
            Hello ${safeName}，<br>歡迎來到島島阿學！
          </h2>
        </td>
      </tr>
    </table>

    <!-- Intro Paragraph -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 28px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            在社群媒體上認識我們，現在你也是這個充滿活力的學習社群的一員了！在這裡，你可以找到志同道合的學習夥伴，一起探索與成長。
          </p>
        </td>
      </tr>
    </table>

    <!-- Subtitle (h3) -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.brandCyan}; line-height: 150%; mso-line-height-rule: exactly;">
            「找到你的學習社群」
          </h3>
        </td>
      </tr>
    </table>

    <!-- Body -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 28px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            在社群媒體上認識我們，現在也歡迎你加入這個充滿活力的學習社群，和大家一起分享學習歷程。
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA Button (Orange) -->
    ${generateCtaButton({
      text: '開始探索社群',
      url: safePracticeUrl,
      color: 'orange',
    })}

    <!-- Illustration -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-top: 16px; padding-bottom: 32px;">
          <img src="${safeIllustrationUrl}" alt="島島阿學吉祥物 - 騎著紙飛機的黃色海星" width="160" height="160"
            class="illustration" style="display: block; width: 160px; height: auto; max-width: 160px;">
        </td>
      </tr>
    </table>

    <!-- Closing Text -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 16px;">
          <p style="margin: 0; font-size: 16px; font-weight: 500; color: ${EMAIL_COLORS.textPrimary}; line-height: 160%; font-style: italic; mso-line-height-rule: exactly;">
            在這裡，按照你喜歡的樣子，<br>慢慢走，比較快。
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 16px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 160%;">
            準備好開始美好的學習生活了嗎？
          </p>
        </td>
      </tr>
    </table>

    <!-- Discord Feedback -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; line-height: 160%;">
            若在功能使用上有任何問題和建議，歡迎至 <a href="https://discord.com/invite/8GnqSZZxp7" style="color: ${EMAIL_COLORS.brandCyan}; text-decoration: underline;">Discord</a> 的 <strong style="color: ${EMAIL_COLORS.textPrimary};">#島島網站回饋</strong> 頻道讓我們知道唷！
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * 社群/朋友介紹來源版本內容
 * 強調和學習夥伴一起走
 */
const generateCommunityContent = (data: {
  name: string;
  practiceUrl: string;
  illustrationUrl: string;
}): string => {
  const safeName = escapeHtml(data.name);
  const safePracticeUrl = sanitizeUrl(data.practiceUrl);
  const safeIllustrationUrl = sanitizeUrl(data.illustrationUrl);

  return `
    <!-- Greeting (h2) -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%; mso-line-height-rule: exactly;">
            Hello ${safeName}，<br>歡迎來到島島阿學！
          </h2>
        </td>
      </tr>
    </table>

    <!-- Intro Paragraph -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 28px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            學習這條路，有夥伴陪著走會更有力量。
          </p>
        </td>
      </tr>
    </table>

    <!-- Subtitle (h3) -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.brandCyan}; line-height: 150%; mso-line-height-rule: exactly;">
            「和學習夥伴一起走」
          </h3>
        </td>
      </tr>
    </table>

    <!-- Body -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 28px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            在這裡，你可以找到正在學習類似事物的夥伴，透過主題實踐一起探索、記錄成長歷程。
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA Button (Cyan) -->
    ${generateCtaButton({
      text: '探索主題實踐',
      url: safePracticeUrl,
      color: 'cyan',
    })}

    <!-- Illustration -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-top: 16px; padding-bottom: 32px;">
          <img src="${safeIllustrationUrl}" alt="島島阿學吉祥物 - 騎著紙飛機的黃色海星" width="160" height="160"
            class="illustration" style="display: block; width: 160px; height: auto; max-width: 160px;">
        </td>
      </tr>
    </table>

    <!-- Closing Text -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 16px;">
          <p style="margin: 0; font-size: 16px; font-weight: 500; color: ${EMAIL_COLORS.textPrimary}; line-height: 160%; font-style: italic; mso-line-height-rule: exactly;">
            在這裡，按照你喜歡的樣子，<br>慢慢走，比較快。
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 16px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 160%;">
            準備好開始美好的學習生活了嗎？
          </p>
        </td>
      </tr>
    </table>

    <!-- Discord Feedback -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; line-height: 160%;">
            若在功能使用上有任何問題和建議，歡迎至 <a href="https://discord.com/invite/8GnqSZZxp7" style="color: ${EMAIL_COLORS.brandCyan}; text-decoration: underline;">Discord</a> 的 <strong style="color: ${EMAIL_COLORS.textPrimary};">#島島網站回饋</strong> 頻道讓我們知道唷！
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * 預設版本內容（原 generateQuizPendingContent）
 * 較詳細引導，包含功能介紹
 */
const generateDefaultContent = (data: {
  name: string;
  practiceUrl: string;
  illustrationUrl: string;
}): string => {
  const safeName = escapeHtml(data.name);
  const safePracticeUrl = sanitizeUrl(data.practiceUrl);
  const safeIllustrationUrl = sanitizeUrl(data.illustrationUrl);

  return `
    <!-- Greeting (h2) -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%; mso-line-height-rule: exactly;">
            Hello ${safeName}，<br>歡迎來到島島阿學！
          </h2>
        </td>
      </tr>
    </table>

    <!-- Intro Paragraph -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            想學新東西但不確定有沒有興趣？一個人學習覺得孤單？
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 28px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            我們以科技與社群打造島島阿學，在這裡，每個人都是知識的創造者與學習推動者！
          </p>
        </td>
      </tr>
    </table>

    <!-- Subtitle (h3) -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.brandCyan}; line-height: 150%; mso-line-height-rule: exactly;">
            以下功能幫助你開始...
          </h3>
        </td>
      </tr>
    </table>

    <!-- Feature Card: Practice -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="border: 1px solid ${EMAIL_COLORS.divider}; border-radius: 8px; padding: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary};">
            主題實踐
          </p>
          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; line-height: 150%;">
            登入「我的小島」，用 7-30 天輕鬆探索新領域，也歡迎從我們的模板獲得靈感哦！
          </p>
          ${generateCtaButton({
            text: '挑選一個學習生活提案',
            url: safePracticeUrl,
            color: 'orange',
          })}
        </td>
      </tr>
    </table>

    <!-- Reminder -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; line-height: 160%;">
            還有，別忘了完成帳號設定和偏好設定，獲得更好的體驗...
          </p>
        </td>
      </tr>
    </table>

    <!-- Illustration -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img src="${safeIllustrationUrl}" alt="島島阿學吉祥物 - 騎著紙飛機的黃色海星" width="160" height="160"
            class="illustration" style="display: block; width: 160px; height: auto; max-width: 160px;">
        </td>
      </tr>
    </table>

    <!-- Closing Text -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 16px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 160%;">
            準備好開始美好的學習生活了嗎？
          </p>
        </td>
      </tr>
    </table>

    <!-- Discord Feedback -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; line-height: 160%;">
            若在功能使用上有任何問題和建議，歡迎至 <a href="https://discord.com/invite/8GnqSZZxp7" style="color: ${EMAIL_COLORS.brandCyan}; text-decoration: underline;">Discord</a> 的 <strong style="color: ${EMAIL_COLORS.textPrimary};">#島島網站回饋</strong> 頻道讓我們知道唷！
          </p>
        </td>
      </tr>
    </table>
  `;
};
