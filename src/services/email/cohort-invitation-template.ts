import { generateCtaButton, generateStandardEmail } from './base-template';

export const generateCohortInvitationEmail = (input: { organizationName: string; cohortName: string; inviteMessage: string | null; inviteUrl: string }) => {
  const subject = `${input.organizationName} 邀請你加入「${input.cohortName}」`;
  return generateStandardEmail({
    title: `邀請加入 ${input.cohortName}`,
    subject,
    preheader: `${input.organizationName} 邀請你一起持續行動`,
    content: `<p>${input.organizationName} 邀請你加入「${input.cohortName}」。</p>${input.inviteMessage ? `<p>${input.inviteMessage}</p>` : ''}<p>加入前，你會看到本期內容可見範圍的說明。</p>${generateCtaButton({ text: '查看邀請', url: input.inviteUrl, color: 'cyan' })}`
  });
};
