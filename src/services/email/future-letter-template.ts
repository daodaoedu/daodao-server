import { escapeHtml } from '../../utils/sanitize';
import type { EmailTemplateContent } from '../../types/email';
import { generateCtaButton, generateStandardEmail } from './base-template';

export const FUTURE_LETTER_EMAIL_SUBJECT = '你寫給自己的信，今天寄到囉';

export interface FutureLetterEmailData {
  /** 收件者名稱 */
  recipientName: string;
  /** 開啟未來信的連結 */
  letterUrl: string;
  /** 取消訂閱連結 */
  unsubscribeUrl?: string;
}

/**
 * 產生未來信送達通知信。
 * 在預約日期送達時通知收件者，並提供開啟信件的連結。
 */
export function generateFutureLetterEmail(data: FutureLetterEmailData): EmailTemplateContent {
  const name = escapeHtml(data.recipientName);

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #295E5C; line-height: 1.6;">
      Hello ${name},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #295E5C; line-height: 1.6;">
      還記得你在那一天寫信給自己嗎？不論你現在是在低潮、迷茫、躊躇，或是正處於高峰，當時寫下的信，都是你和自己的深度連結！
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #295E5C; line-height: 1.6;">
      今天你的信寄到囉，現在就來看看你當時寫了什麼給自己。
    </p>
    ${generateCtaButton({ text: '看看寫給自己的信', url: data.letterUrl, color: 'cyan' })}
  `;

  return generateStandardEmail({
    title: '你寫給自己的信今天寄到了',
    subject: FUTURE_LETTER_EMAIL_SUBJECT,
    preheader: '今天是你約定的日子，來看看當時寫給自己的話。',
    content,
    unsubscribeUrl: data.unsubscribeUrl,
  });
}
