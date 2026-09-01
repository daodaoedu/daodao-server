import { generateCohortFeedbackSurveyEmail } from '@/services/email/cohort-feedback-survey-template';

describe('generateCohortFeedbackSurveyEmail', () => {
  it('uses the standard template, links to the survey, and escapes names', () => {
    const email = generateCohortFeedbackSurveyEmail({
      organizationName: '<script>島島</script>',
      cohortName: '<b>夏季同行期</b>',
      surveyUrl: 'https://app.example.com/survey/r/feedback-id'
    });
    expect(email.subject).toBe('<b>夏季同行期</b> 期末回饋問卷');
    expect(email.html).toContain('&lt;script&gt;島島&lt;/script&gt;');
    expect(email.html).toContain('&lt;b&gt;夏季同行期&lt;/b&gt;');
    expect(email.html).toContain('https://app.example.com/survey/r/feedback-id');
    expect(email.html).not.toContain('<script>');
  });
});
