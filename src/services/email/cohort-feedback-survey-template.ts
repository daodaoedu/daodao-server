import { escapeHtml } from '../../utils/sanitize';
import type { EmailTemplateContent } from '../../types/email';
import { generateCtaButton, generateStandardEmail } from './base-template';

export interface CohortFeedbackSurveyEmailInput {
  organizationName: string;
  cohortName: string;
  surveyUrl: string;
}

export const generateCohortFeedbackSurveyEmail = (
  input: CohortFeedbackSurveyEmailInput
): EmailTemplateContent => {
  const organizationName = escapeHtml(input.organizationName);
  const cohortName = escapeHtml(input.cohortName);
  const subject = `${input.cohortName} 期末回饋問卷`;
  return generateStandardEmail({
    title: `${cohortName} 期末回饋`,
    subject,
    preheader: `邀請你分享在 ${organizationName} 這一期的參與感受`,
    content: `<p>謝謝你和 ${organizationName} 一起走完「${cohortName}」。</p><p>邀請你花幾分鐘分享這一期的感受，讓帶領者知道哪些陪伴真正有幫助，也讓下一期做得更好。</p>${generateCtaButton({ text: '填寫回饋問卷', url: input.surveyUrl, color: 'cyan' })}`
  });
};
