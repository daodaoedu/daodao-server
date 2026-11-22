import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/managed-survey.service', () => ({ managedSurveyService: { public: jest.fn().mockResolvedValue(null) } }));
jest.mock('@/services/email/email.service', () => ({ emailService: {} }));
jest.mock('@/services/logging/logger.service', () => ({ loggerService: {} }));
import { FEEDBACK_PRIVACY_NOTICE, getCohortFeedbackMetadata } from '../cohort-feedback.service';
import { surveyService } from '../survey.service';
import { surveyResponseSchema } from '../../validators/survey.validators';

describe('public cohort feedback names (#552)', () => {
  const originalAppEnv = process.env.APP_ENV;
  afterAll(() => { process.env.APP_ENV = originalAppEnv; });
  beforeEach(() => {
    process.env.APP_ENV = 'dev';
    prismaMock.$queryRaw.mockResolvedValue([{ ready: true }] as never);
    prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue({
      cohort_id: 552,
      survey_id: 12,
      cohort: {
        display_name: '冬季閱讀場次',
        program: { organization: { name: '閱讀組織', organization_members: [{ user_id: 99 }] } },
        cohort_enrollments: [{ user_id: 99 }],
      },
      completions: [{ user_id: 99 }],
      answers: [{ answer_text: 'private answer' }],
    } as never);
  });

  it.each([
    [null, false, false, 'login_required'],
    [99, false, false, 'ineligible'],
    [99, true, false, 'ready'],
    [99, true, true, 'completed'],
  ] as const)('returns only display names and existing metadata for user %s in state %s/%s', async (userId, enrolled, completed, state) => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(enrolled ? { id: 1 } as never : null);
    prismaMock.cohort_feedback_completions.findUnique.mockResolvedValue(completed ? { user_id: 99 } as never : null);
    await expect(getCohortFeedbackMetadata(12, userId)).resolves.toEqual({
      state,
      privacy_notice: FEEDBACK_PRIVACY_NOTICE,
      organization_name: '閱讀組織',
      cohort_name: '冬季閱讀場次',
    });
  });

  it('does not add cohort metadata to a generic public survey', async () => {
    prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue(null);
    await expect(getCohortFeedbackMetadata(13, null)).resolves.toBeNull();
  });

  it('preserves both names in the public API response contract without private relations', async () => {
    prismaMock.surveys.findFirst.mockResolvedValue({
      id: 12, external_id: 'feedback-552', title: '活動回饋', description: null,
      status: 'active', is_anonymous: true, max_responses: null, tags: [], cover_url: null,
      created_by: 1, created_at: new Date('2026-11-01T00:00:00Z'), updated_at: new Date('2026-11-01T00:00:00Z'),
      end_time: null, questions: [],
    } as never);
    const response = await surveyService.getPublic('feedback-552');
    expect(response?.data).toHaveProperty('cohort_feedback', {
      state: 'login_required', privacy_notice: FEEDBACK_PRIVACY_NOTICE,
      organization_name: '閱讀組織', cohort_name: '冬季閱讀場次',
    });
    expect(surveyResponseSchema.parse(response?.data).cohort_feedback).toEqual({
      state: 'login_required', privacy_notice: FEEDBACK_PRIVACY_NOTICE,
      organization_name: '閱讀組織', cohort_name: '冬季閱讀場次',
    });
  });
});
