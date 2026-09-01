import { generateCohortWeeklyDigestEmail } from '@/services/email/cohort-weekly-digest-template';

describe('generateCohortWeeklyDigestEmail', () => {
  it('escapes organization, cohort, and learner names in the standard template', () => {
    const email = generateCohortWeeklyDigestEmail({
      organizationName: '<script>組織</script>',
      cohortName: '<b>期</b>',
      checkinCount: 2,
      pendingResponseCount: 1,
      needsAttention: [{ name: '<img src=x>', url: 'https://app.example.com/focus?userId=7' }],
      dashboardUrl: 'https://app.example.com/lighthouse'
    });
    expect(email.html).toContain('&lt;script&gt;組織&lt;/script&gt;');
    expect(email.html).toContain('&lt;b&gt;期&lt;/b&gt;');
    expect(email.html).toContain('&lt;img src=x&gt;');
    expect(email.html).not.toContain('<script>');
  });
});
