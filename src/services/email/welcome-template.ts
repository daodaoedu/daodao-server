/**
 * 歡迎信模板
 * 根據用戶是否完成學習類型測驗，產生不同版本的歡迎信
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
 * 產生歡迎信模板
 * 根據 hasCompletedQuiz 決定使用哪個版本
 */
export const generateWelcomeEmail = (data: WelcomeEmailData): EmailTemplateContent => {
  const { name, hasCompletedQuiz, practiceUrl, quizUrl, illustrationUrl, unsubscribeUrl } = data;
  const config = getEmailConfig();

  const subject = '【島島阿學】歡迎來到島島阿學！';
  const title = '歡迎來到島島阿學';

  // 預設值
  const defaultPracticeUrl = 'https://app.daodao.so/practices/create';
  const defaultQuizUrl = 'https://daodao.so/quiz';
  const defaultIllustrationUrl = EMAIL_ASSETS.mascot;
  const defaultUnsubscribeUrl = `${config.urls.frontend}/unsubscribe`;

  // 根據測驗狀態選擇內容
  const content = hasCompletedQuiz
    ? generateQuizCompletedContent({
        name,
        practiceUrl: practiceUrl || defaultPracticeUrl,
        illustrationUrl: illustrationUrl || defaultIllustrationUrl,
      })
    : generateQuizPendingContent({
        name,
        quizUrl: quizUrl || defaultQuizUrl,
        practiceUrl: practiceUrl || defaultPracticeUrl,
        illustrationUrl: illustrationUrl || defaultIllustrationUrl,
      });

  // 組合完整 HTML
  const preheader = hasCompletedQuiz
    ? '歡迎加入島島阿學！開始你的學習生活提案之旅，用 7-30 天輕鬆探索新領域。'
    : '歡迎加入島島阿學！了解自己的學習類型，開始主題實踐之旅。';

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
 * 已做測驗版本內容
 * 簡短引導，直接推薦「主題實踐」
 */
const generateQuizCompletedContent = (data: {
  name: string;
  practiceUrl: string;
  illustrationUrl: string;
}): string => {
  // 安全處理用戶輸入
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
            在這個資訊爆炸的時代，我們相信「學習」不該只是為了考取證書或完成課程，而是讓生活更豐富。
          </p>
        </td>
      </tr>
    </table>

    <!-- Transition Text -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 28px;">
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            為了讓你更輕鬆地展開這段旅程，以下是我們想邀請你做的暖身活動：
          </p>
        </td>
      </tr>
    </table>

    <!-- Subtitle (h3) -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.brandCyan}; line-height: 150%; mso-line-height-rule: exactly;">
            把「想做」變成「生活」
          </h3>
        </td>
      </tr>
    </table>

    <!-- Quote Block -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="quote-block">
      <tr>
        <td style="padding-top: 10px; padding-bottom: 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="border-left: 4px solid ${EMAIL_COLORS.brandCyan}; padding: 14px 18px; background-color: ${EMAIL_COLORS.bgQuote};">
                <p style="margin: 0; font-size: 15px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
                  不需要大目標。<br>
                  試著用我們的「主題實踐」模板，開啟一段 7 到 30 天的小旅程。無論是讀一本書還是練習一個新習慣，重點不在於完成，而在於開始。
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button (Orange) -->
    ${generateCtaButton({
      text: '挑選一個學習生活提案',
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
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
            準備好開始美好的學習生活了嗎？
          </p>
        </td>
      </tr>
    </table>

    <!-- Discord Feedback -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.6;">
            若在功能使用上有任何問題和建議，歡迎至 <a href="https://discord.com/invite/8GnqSZZxp7" style="color: ${EMAIL_COLORS.brandCyan}; text-decoration: underline;">Discord</a> 的 <strong style="color: ${EMAIL_COLORS.textPrimary};">#島島網站回饋</strong> 頻道讓我們知道唷！
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * 未做測驗版本內容
 * 較詳細引導，包含測驗連結和功能介紹
 */
const generateQuizPendingContent = (data: {
  name: string;
  quizUrl: string;
  practiceUrl: string;
  illustrationUrl: string;
}): string => {
  // 安全處理用戶輸入
  const safeName = escapeHtml(data.name);
  const safeQuizUrl = sanitizeUrl(data.quizUrl);
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

    <!-- Feature Card 1: Quiz -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
      <tr>
        <td style="border: 1px solid ${EMAIL_COLORS.divider}; border-radius: 8px; padding: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary};">
            了解自己的學習類型
          </p>
          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.5;">
            來做學習類型測驗，找到更適合的學習策略
          </p>
          ${generateCtaButton({
            text: '開始測驗',
            url: safeQuizUrl,
            color: 'cyan',
          })}
        </td>
      </tr>
    </table>

    <!-- Feature Card 2: Practice -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="border: 1px solid ${EMAIL_COLORS.divider}; border-radius: 8px; padding: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary};">
            主題實踐
          </p>
          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.5;">
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
          <p style="margin: 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.6;">
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
          <p style="margin: 0; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
            準備好開始美好的學習生活了嗎？
          </p>
        </td>
      </tr>
    </table>

    <!-- Discord Feedback -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.6;">
            若在功能使用上有任何問題和建議，歡迎至 <a href="https://discord.com/invite/8GnqSZZxp7" style="color: ${EMAIL_COLORS.brandCyan}; text-decoration: underline;">Discord</a> 的 <strong style="color: ${EMAIL_COLORS.textPrimary};">#島島網站回饋</strong> 頻道讓我們知道唷！
          </p>
        </td>
      </tr>
    </table>
  `;
};
