/**
 * 「團隊回覆了你的錯誤回報」通知信模板（daodao#451 AC-01）
 *
 * 管理者在後台回覆錯誤回報後寄給回報者；收件地址由呼叫端從該筆回報的 user 查出，
 * 不接受管理者或前端指定（AC-06）。
 * 回報描述與回覆內容都是使用者／管理者輸入，一律 escapeHtml 後以純文字呈現。
 */

import { escapeHtml } from '../../utils/sanitize';
import type { EmailTemplateContent } from '../../types/email';
import { EMAIL_COLORS, generateCtaButton, generateStandardEmail } from './base-template';

export interface FeedbackReplyEmailData {
  /** 回報者稱呼 */
  recipientName: string;
  /** 原回報描述 */
  reportContent: string;
  /** 團隊回覆內容 */
  replyContent: string;
  /** 「我的回報」頁連結 */
  myReportsUrl: string;
}

/** 原回報摘要的長度上限（字元），超過以「…」截斷 */
export const REPORT_SUMMARY_MAX_LENGTH = 200;

export const summarizeReport = (content: string): string => {
  const normalized = content.replace(/\s+/g, ' ').trim();
  return normalized.length > REPORT_SUMMARY_MAX_LENGTH
    ? `${normalized.slice(0, REPORT_SUMMARY_MAX_LENGTH)}…`
    : normalized;
};

const multiline = (value: string): string => escapeHtml(value).replace(/\r?\n/g, '<br>');

export function generateFeedbackReplyEmail(data: FeedbackReplyEmailData): EmailTemplateContent {
  const name = escapeHtml(data.recipientName);
  const summary = escapeHtml(summarizeReport(data.reportContent));

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
      ${name} 你好，
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
      謝謝你回報問題，島島團隊已經回覆了：
    </p>
    <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: ${EMAIL_COLORS.textSecondary};">你的回報</p>
    <p style="margin: 0 0 20px; padding: 12px 16px; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.6; background: #f5f5f5; border-radius: 8px;">
      ${summary}
    </p>
    <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: ${EMAIL_COLORS.textSecondary};">團隊回覆</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
      ${multiline(data.replyContent)}
    </p>
    ${generateCtaButton({ text: '查看我的回報', url: data.myReportsUrl, color: 'cyan' })}
  `;

  return generateStandardEmail({
    title: '團隊回覆了你的錯誤回報',
    subject: '島島團隊回覆了你的錯誤回報',
    preheader: escapeHtml(summarizeReport(data.replyContent)),
    content,
  });
}
