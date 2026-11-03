import { generateGroupChatMessageEmail as render } from '../group-chat-message-template';

const input = {
  recipientName: '  小島  ', groupName: '讀書群', senderName: '帶領人',
  chatUrl: 'https://dev.daodao.so/zh-TW/messages/123?tab=chat&from=email'
};

describe('group chat message email', () => {
  it('greets the recipient and preserves the chat destination safely', () => {
    const email = render(input);
    expect(email.html).toContain('Hello 小島,');
    expect(email.html).toContain('帶領人 在「讀書群」發布了新訊息');
    expect(email.html).toContain('href="https://dev.daodao.so/zh-TW/messages/123?tab=chat&amp;from=email"');
    expect(email.html).toContain('查看聊天室');
    expect(email.html).toContain('期待你加入討論！');
  });
  it.each([undefined, '', '  '])('uses the generic greeting for %s', recipientName => {
    expect(render({ ...input, recipientName }).html).toContain('<p>Hello,</p>');
  });
  it.each([[false, false], [false, true], [true, false], [true, true]])(
    'renders mention=%s and reply=%s independently', (mentionedRecipient, replyToRecipient) => {
      const html = render({ ...input, mentionedRecipient, replyToRecipient }).html;
      expect(html.includes('<p>並提到了你。</p>')).toBe(mentionedRecipient);
      expect(html.includes('<p>這則訊息回覆了你先前在聊天室中的訊息。</p>')).toBe(replyToRecipient);
      expect(html).not.toContain('<p></p>');
    });
  it('escapes all user supplied names and excludes message body', () => {
    const html = render({ ...input, recipientName: '<img src=x>', senderName: '<script>x</script>', groupName: 'A&B"', ...{ message: 'PRIVATE MESSAGE BODY' } }).html;
    expect(html).toContain('&lt;img src=x&gt;');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).toContain('A&amp;B&quot;');
    expect(html).not.toContain('<img src=x>');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('PRIVATE MESSAGE BODY');
  });
  it('does not allow the destination to inject an attribute', () => {
    const html = render({ ...input, chatUrl: 'https://example.org/" onmouseover="alert(1)' }).html;
    expect(html).not.toContain(' onmouseover="');
    expect(html).toContain('href="https://example.org/&quot; onmouseover=&quot;alert(1)"');
  });
  it.each(['javascript:alert(1)', 'data:text/html,test'])('blocks unsafe scheme %s', chatUrl => {
    const html = render({ ...input, chatUrl }).html;
    expect(html).not.toContain(chatUrl);
    expect(html).toContain('href="#"');
  });
});
