import { generateCtaButton, generateStandardEmail } from './base-template';

export const generateOrganizationOwnerEmail = (input: { organizationName: string; dashboardUrl: string }) => {
  const subject = `你已成為「${input.organizationName}」的管理者`;
  return generateStandardEmail({
    title: `歡迎加入 ${input.organizationName}`,
    subject,
    preheader: `你現在可以管理「${input.organizationName}」的燈塔計畫`,
    content: `<p>你已被加入為「${input.organizationName}」的管理者，可以建立與管理燈塔計畫。</p>${generateCtaButton({ text: '前往管理', url: input.dashboardUrl, color: 'cyan' })}`
  });
};
