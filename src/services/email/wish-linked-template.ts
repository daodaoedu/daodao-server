/**
 * 「許願被採納」通知信模板
 *
 * 許願經後台歸併／促成為對外路線圖項目時，寄給許願者。
 * 收件地址由呼叫端決定（優先 wish.contact_email，無則帳號 email）。
 */

import { escapeHtml } from '../../utils/sanitize';
import type { EmailTemplateContent } from '../../types/email';
import { EMAIL_COLORS, generateCtaButton, generateStandardEmail } from './base-template';

export interface WishLinkedEmailData {
  /** 許願者稱呼 */
  recipientName: string;
  /** 對外項目標題 */
  itemTitle: string;
  /** 路線圖頁連結 */
  url: string;
  /** 取消訂閱連結 */
  unsubscribeUrl?: string;
}

export function generateWishLinkedEmail(data: WishLinkedEmailData): EmailTemplateContent {
  const name = escapeHtml(data.recipientName);
  const title = escapeHtml(data.itemTitle);

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
      ${name} 你好，
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
      謝謝你的許願！我們已經把它納入島島的產品路線圖：
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.brandCyan}; line-height: 1.6;">
      《${title}》
    </p>
    <p style="margin: 0 0 24px; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.6;">
      你可以到公開路線圖追蹤這個項目的進度；完成時我們也會再通知你。
    </p>
    ${generateCtaButton({ text: '查看路線圖', url: data.url, color: 'cyan' })}
  `;

  return generateStandardEmail({
    title: '許願已被採納',
    subject: '你的許願已被島島採納 🎉',
    preheader: `你的許願《${data.itemTitle}》已納入島島路線圖`,
    content,
    unsubscribeUrl: data.unsubscribeUrl,
  });
}
