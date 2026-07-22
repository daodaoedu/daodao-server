import { escapeHtml } from '../../utils/sanitize';
import type { EmailTemplateContent } from '../../types/email';
import { generateCtaButton, generateStandardEmail } from './base-template';

export interface CohortWeeklyDigestInput {
  organizationName: string;
  cohortName: string;
  checkinCount: number;
  pendingResponseCount: number;
  needsAttention: Array<{ name: string; url: string }>;
  dashboardUrl: string;
}

export const generateCohortWeeklyDigestEmail = (input: CohortWeeklyDigestInput): EmailTemplateContent => {
  const organizationName = escapeHtml(input.organizationName);
  const cohortName = escapeHtml(input.cohortName);
  const attentionItems = input.needsAttention.length === 0
    ? '<li>目前沒有需要特別關心的學員</li>'
    : input.needsAttention.map(item => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a></li>`).join('');
  const subject = `${input.cohortName} 教練週報`;
  return generateStandardEmail({
    title: `${cohortName} 教練週報`,
    subject,
    preheader: `${organizationName} 本週期動態摘要`,
    content: `<p>${organizationName} 的「${cohortName}」本週摘要：</p><ul><li>本週打卡數：${input.checkinCount}</li><li>待回應打卡：${input.pendingResponseCount}</li></ul><p><strong>需關心名單</strong></p><ul>${attentionItems}</ul>${generateCtaButton({ text: '前往今日焦點', url: input.dashboardUrl, color: 'cyan' })}`
  });
};
