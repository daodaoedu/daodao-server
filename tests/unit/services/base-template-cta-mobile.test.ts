/**
 * Regression: CTA button should have bottom spacing above divider on mobile.
 *
 * Issue #227: On mobile, .cta-button-wrapper padding was reset to 0 !important,
 * which removed the 16px bottom gap between the CTA button and the divider line.
 */

import { generateCtaButton } from '@/services/email/base-template';

describe('generateCtaButton mobile layout', () => {
  it('cta-button-wrapper td has padding-bottom to create gap above divider', () => {
    const html = generateCtaButton({
      text: '前往我的實踐',
      url: 'https://app.daodao.so/practices/1',
      color: 'orange',
    });

    expect(html).toContain('padding-bottom: 16px');
  });

  it('mobile CSS preserves vertical padding on cta-button-wrapper', () => {
    const { generateEmailHead } = require('@/services/email/base-template');
    const head = generateEmailHead('test');

    // Should NOT wipe out all padding (padding: 0) on mobile
    // Should only clear horizontal padding
    expect(head).not.toMatch(/\.cta-button-wrapper\s*\{[^}]*\bpadding:\s*0\s*!important/);
  });

  it('mobile CSS uses padding-left/right 0 instead of padding 0 for cta-button-wrapper', () => {
    const { generateEmailHead } = require('@/services/email/base-template');
    const head = generateEmailHead('test');

    expect(head).toMatch(/\.cta-button-wrapper\s*\{[^}]*(padding-left|padding-right)/);
  });
});
