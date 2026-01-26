/**
 * Email 模板基礎組件
 * 基於 Figma 設計系統
 * @see docs/email/system-email-template-spec.md
 */

import { sanitizeUrl } from '../../utils/sanitize';
import type { EmailTemplateContent } from '../../types/email';

/**
 * 郵件色彩常數（基於 Figma 設計系統）
 */
export const EMAIL_COLORS = {
  bgOuter: '#F5FFFD',       // Very Light Blue - 外層背景
  bgContent: '#FFFFFF',     // White - 內容區背景
  bgFooter: '#F4F6F6',      // Very Light Gray - Footer 背景
  bgQuote: '#F5FFFD',       // Very Light Blue - 引言區塊背景
  textHeading: '#0D3036',   // BG Dark - 主標題 (h2)
  textPrimary: '#295E5C',   // Text Dark - 主要文字
  textSecondary: '#9FB5B8', // Light Gray - 次要文字
  brandCyan: '#16B9B3',     // Logo Cyan - 品牌主色/CTA
  brandOrange: '#FFA10B',   // Logo Orange - 橘色 CTA
  ctaText: '#0D3036',       // BG Dark - CTA 按鈕文字（深色）
  divider: '#E0E0E0',       // 分隔線
} as const;

/**
 * 郵件資源連結
 */
export const EMAIL_ASSETS = {
  logo: 'https://daodao.so/images/emails/logo.png',
  banner: 'https://daodao.so/images/emails/banner.png',
  mascot: 'https://daodao.so/images/emails/joyride.png',
  arrow: 'https://daodao.so/images/emails/arrow-right-outline.png',
  threads: 'https://daodao.so/images/emails/threads.png',
  facebook: 'https://daodao.so/images/emails/facebook.png',
  instagram: 'https://daodao.so/images/emails/instagram.png',
  linkedin: 'https://daodao.so/images/emails/linkedin.png',
} as const;

/**
 * 社群連結
 */
export const SOCIAL_LINKS = {
  threads: 'https://www.threads.net/@daodao_learn',
  facebook: 'https://www.facebook.com/daodaoedu/',
  instagram: 'https://www.instagram.com/daodao_learn/',
  linkedin: 'https://www.linkedin.com/company/daodaolearn/',
} as const;

/**
 * 產生 Email Head（含 Outlook 相容性）
 */
export const generateEmailHead = (title: string): string => `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }

    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      border-collapse: collapse;
    }

    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      -webkit-font-smoothing: antialiased;
    }

    #outlook a { padding: 0; }

    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
      line-height: 100%;
    }

    @media screen and (max-width: 599px) {
      .wrapper { width: 100% !important; padding: 0 !important; }
      .main-content { width: 100% !important; padding: 28px 24px !important; }
      .text-block { padding: 0 !important; }
      .quote-block { margin-left: 0 !important; margin-right: 0 !important; }
      .cta-button-wrapper { padding: 0 !important; }
      .cta-button {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
      .illustration { width: 140px !important; height: auto !important; }
      .footer-content { padding: 24px 24px !important; }
      .mobile-padding { padding-left: 24px !important; padding-right: 24px !important; }
      h2 { font-size: 22px !important; }
      h3 { font-size: 17px !important; }
    }

    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #F5FFFD !important; }
      .content-bg { background-color: #FFFFFF !important; }
      h2, h3, p, td { color: #295E5C !important; }
    }

    [data-ogsc] .email-bg { background-color: #F5FFFD !important; }
    [data-ogsc] .content-bg { background-color: #FFFFFF !important; }
  </style>
</head>`;

/**
 * 產生 Email 外層包裝
 */
export const generateEmailWrapper = (options: {
  content: string;
  preheader?: string;
}): string => {
  const { content, preheader } = options;

  const preheaderHtml = preheader
    ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
        ${preheader}
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
      </div>`
    : '';

  return `
<body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.bgOuter}; font-family: 'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', Arial, sans-serif;">
  ${preheaderHtml}
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${EMAIL_COLORS.bgOuter};" class="email-bg">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="wrapper content-bg"
          style="max-width: 600px; background-color: ${EMAIL_COLORS.bgContent}; border-radius: 0;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * 產生 Banner 區塊
 */
export const generateBanner = (): string => `
<tr>
  <td align="center" style="background-color: ${EMAIL_COLORS.bgOuter};">
    <!--[if mso]>
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: ${EMAIL_COLORS.bgOuter};">
      <tr>
        <td align="center">
    <![endif]-->
    <img src="${EMAIL_ASSETS.banner}" alt="DAO DAO 島島阿學" width="600" height="140"
      style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" class="banner-desktop">
    <!--[if mso]>
        </td>
      </tr>
    </table>
    <![endif]-->
  </td>
</tr>`;

/**
 * Footer 選項
 */
export interface FooterOptions {
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
}

/**
 * 產生 Footer 區塊
 */
export const generateFooter = (unsubscribeUrl?: string): string => {
  const currentYear = new Date().getFullYear();
  const showUnsubscribe = !!unsubscribeUrl;
  // 安全處理 URL
  const safeUnsubscribeUrl = unsubscribeUrl ? sanitizeUrl(unsubscribeUrl) : '';

  return `
<tr>
  <td class="footer-content" style="background-color: ${EMAIL_COLORS.bgFooter}; padding: 24px 40px; border-top: 1px solid ${EMAIL_COLORS.divider};">
    ${showUnsubscribe ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.textSecondary}; line-height: 150%;">
            此訊息由系統發送，請勿回覆此電子郵件。<br>
            不希望接收此類郵件，請<a href="${safeUnsubscribeUrl}" style="color: ${EMAIL_COLORS.textPrimary}; text-decoration: underline;">取消訂閱</a>。
          </p>
        </td>
      </tr>
    </table>
    ` : ''}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <img src="${EMAIL_ASSETS.logo}" alt="島島阿學" width="120" style="display: block; width: 120px; height: auto;">
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 0 8px;">
                <a href="${SOCIAL_LINKS.threads}" style="text-decoration: none;">
                  <img src="${EMAIL_ASSETS.threads}" alt="Threads" width="32" height="32" style="display: block; width: 32px; height: 32px;">
                </a>
              </td>
              <td style="padding: 0 8px;">
                <a href="${SOCIAL_LINKS.facebook}" style="text-decoration: none;">
                  <img src="${EMAIL_ASSETS.facebook}" alt="Facebook" width="32" height="32" style="display: block; width: 32px; height: 32px;">
                </a>
              </td>
              <td style="padding: 0 8px;">
                <a href="${SOCIAL_LINKS.instagram}" style="text-decoration: none;">
                  <img src="${EMAIL_ASSETS.instagram}" alt="Instagram" width="32" height="32" style="display: block; width: 32px; height: 32px;">
                </a>
              </td>
              <td style="padding: 0 8px;">
                <a href="${SOCIAL_LINKS.linkedin}" style="text-decoration: none;">
                  <img src="${EMAIL_ASSETS.linkedin}" alt="LinkedIn" width="32" height="32" style="display: block; width: 32px; height: 32px;">
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.textSecondary};">
            島島阿學 &copy; ${currentYear}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
};

/**
 * 產生作者區塊
 */
export const generateAuthorSection = (): string => `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center">
      <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary};">
        島島阿學團隊
      </p>
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary};">
        你的學習生活提案所
      </p>
      <p style="margin: 0; font-size: 13px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; font-style: italic;">
        Where personal growth meets collective wisdom!
      </p>
    </td>
  </tr>
</table>`;

/**
 * CTA 按鈕選項
 */
export interface CtaButtonOptions {
  text: string;
  url: string;
  color: 'cyan' | 'orange';
}

/**
 * 產生 CTA 按鈕
 */
export const generateCtaButton = (options: CtaButtonOptions): string => {
  const { text, color } = options;
  // 安全處理 URL
  const safeUrl = sanitizeUrl(options.url);
  const bgColor = color === 'orange' ? EMAIL_COLORS.brandOrange : EMAIL_COLORS.brandCyan;

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" class="cta-button-wrapper" style="padding-bottom: 16px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                   xmlns:w="urn:schemas-microsoft-com:office:word"
                   href="${safeUrl}"
                   style="height:48px;v-text-anchor:middle;width:280px;"
                   arcsize="50%"
                   stroke="f"
                   fillcolor="${bgColor}">
        <w:anchorlock/>
        <center style="color:${EMAIL_COLORS.ctaText};font-family:'Noto Sans TC','Microsoft JhengHei',Arial,sans-serif;font-size:16px;font-weight:600;">
          ${text} &gt;
        </center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="background-color: ${bgColor}; border-radius: 24px; mso-padding-alt: 0;">
            <a href="${safeUrl}" class="cta-button"
              style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.ctaText}; text-decoration: none; mso-hide: all;">
              ${text}
              <img src="${EMAIL_ASSETS.arrow}" alt=">" width="16" height="16"
                style="display: inline-block; vertical-align: middle; margin-left: 8px; margin-bottom: 3px;">
            </a>
          </td>
        </tr>
      </table>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
};

/**
 * 產生分隔線
 */
export const generateDivider = (): string => `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-bottom: 24px;">
      <hr style="border: none; border-top: 1px solid ${EMAIL_COLORS.divider}; margin: 0;">
    </td>
  </tr>
</table>`;

/**
 * 標準郵件選項
 */
export interface StandardEmailOptions {
  /** 郵件標題（顯示在瀏覽器標籤） */
  title: string;
  /** 郵件主旨 */
  subject: string;
  /** 預覽文字（郵件列表中顯示的摘要） */
  preheader: string;
  /** 郵件內容 HTML */
  content: string;
  /** 取消訂閱連結（可選） */
  unsubscribeUrl?: string;
}

/**
 * 產生標準郵件 HTML
 * 統一處理 head, wrapper, banner, footer
 * 減少各模板的重複程式碼
 */
export const generateStandardEmail = (options: StandardEmailOptions): EmailTemplateContent => {
  const { title, subject, preheader, content, unsubscribeUrl } = options;

  const html = `${generateEmailHead(title)}
${generateEmailWrapper({
    preheader,
    content: `
    ${generateBanner()}
    <tr>
      <td class="main-content" style="padding: 32px 40px;">
        ${content}
      </td>
    </tr>
    ${generateFooter(unsubscribeUrl)}
  `,
  })}`;

  return { subject, html };
};
