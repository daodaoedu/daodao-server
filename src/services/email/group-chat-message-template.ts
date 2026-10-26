import { escapeHtml } from '../../utils/sanitize';
import type { EmailTemplateContent } from '../../types/email';
import { generateCtaButton, generateStandardEmail } from './base-template';

export interface GroupChatMessageEmailInput {
  recipientName?: string;
  groupName: string;
  senderName: string;
  chatUrl: string;
}

export const generateGroupChatMessageEmail = (
  input: GroupChatMessageEmailInput
): EmailTemplateContent => {
  const recipientName = input.recipientName?.trim();
  const greeting = recipientName ? `${escapeHtml(recipientName)}，你好：` : '你好：';
  const groupName = escapeHtml(input.groupName);
  const senderName = escapeHtml(input.senderName);
  const subject = `${input.groupName} 有新訊息`;

  return generateStandardEmail({
    title: `${groupName} 有新訊息`,
    subject,
    preheader: `${input.senderName} 在「${input.groupName}」聊天室發送了新訊息`,
    content: `<p>${greeting}</p><p>${senderName} 在「${groupName}」聊天室有新訊息，邀請你前往查看並加入討論！</p>${generateCtaButton({ text: '查看聊天室', url: input.chatUrl, color: 'cyan' })}`
  });
};
