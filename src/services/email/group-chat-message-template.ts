import { escapeHtml } from '../../utils/sanitize';
import type { EmailTemplateContent } from '../../types/email';
import { generateCtaButton, generateStandardEmail } from './base-template';

export interface GroupChatMessageEmailInput {
  recipientName?: string;
  groupName: string;
  senderName: string;
  chatUrl: string;
  mentionedRecipient?: boolean;
  replyToRecipient?: boolean;
}

export const generateGroupChatMessageEmail = (
  input: GroupChatMessageEmailInput
): EmailTemplateContent => {
  const recipientName = input.recipientName?.trim();
  const greeting = recipientName
    ? `Hello ${escapeHtml(recipientName)},`
    : 'Hello,';
  const groupName = escapeHtml(input.groupName);
  const senderName = escapeHtml(input.senderName);
  const subject = `${input.groupName} 有新訊息`;
  const preheader = `${senderName} 在「${groupName}」發布了新訊息`;
  const mentionLine = input.mentionedRecipient
    ? '<p>並提到了你。</p>'
    : '';
  const replyLine = input.replyToRecipient
    ? '<p>這則訊息回覆了你先前在聊天室中的訊息。</p>'
    : '';

  return generateStandardEmail({
    title: `${groupName} 有新訊息`,
    subject,
    preheader,
    content: `<p>${greeting}</p><p>${senderName} 在「${groupName}」發布了新訊息</p>${mentionLine}${replyLine}${generateCtaButton({ text: '查看聊天室', url: input.chatUrl, color: 'cyan' })}<p>期待你加入討論！</p>`
  });
};
