/**
 * Regression: reaction email template 根據 reactionType 產出對應 emoji
 *
 * 涵蓋範圍：
 * - 各已知 reactionType 對應正確 emoji
 * - 未知 / 缺少 reactionType 時 fallback 🎉
 */

import { generateReactionNotificationEmail } from '@/services/email/reaction-notification-template';

const BASE_DATA = {
  recipientName: '測試用戶',
  practiceTitle: '書摘記錄',
  reactionCount: 3,
  practiceUrl: 'https://app.daodao.so/practices/ext-1',
  unsubscribeUrl: 'https://app.daodao.so/unsubscribe',
};

describe('Regression: reaction email template 顯示正確 emoji', () => {
  const cases: Array<{ reactionType: string; emoji: string }> = [
    { reactionType: 'encourage', emoji: '🥰' },
    { reactionType: 'touched',   emoji: '💓' },
    { reactionType: 'fire',      emoji: '🔥' },
    { reactionType: 'useful',    emoji: '👍🏻' },
    { reactionType: 'sameHere',  emoji: '😳' },
    { reactionType: 'curious',   emoji: '🧐' },
  ];

  it.each(cases)(
    'reactionType=$reactionType 時 email 包含 emoji $emoji',
    ({ reactionType, emoji }) => {
      const { html } = generateReactionNotificationEmail({ ...BASE_DATA, reactionType });
      expect(html).toContain(emoji);
    },
  );

  it('未提供 reactionType 時 fallback 🎉', () => {
    const { html } = generateReactionNotificationEmail({ ...BASE_DATA });
    expect(html).toContain('🎉');
  });

  it('未知 reactionType 時 fallback 🎉', () => {
    const { html } = generateReactionNotificationEmail({ ...BASE_DATA, reactionType: 'unknown' });
    expect(html).toContain('🎉');
  });
});
