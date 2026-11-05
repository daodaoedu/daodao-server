import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
const bulkEnqueueEmails = jest.fn().mockResolvedValue(undefined);
jest.mock('@/queues/email.queue', () => ({
  bulkEnqueueEmails: (...args: unknown[]): unknown => bulkEnqueueEmails(...args)
}));

import { sendCohortFeedbackSurveys } from '@/services/cohort-feedback-survey.service';

const cohort = {
  id: 8,
  display_name: '夏季同行期',
  program: {
    organization: {
      name: '島島組織',
      organization_members: [{ user_id: 42 }]
    }
  },
  cohort_enrollments: [
    { email: 'Learner@Example.com', user_id: 77, user: { contacts: { email: 'other@example.com' } } },
    { email: 'learner@example.com', user_id: 77, user: { contacts: { email: 'other@example.com' } } },
    { email: null, user_id: 78, user: { contacts: { email: 'second@example.com' } } }
  ]
};

describe('sendCohortFeedbackSurveys', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  beforeEach(() => {
    process.env.NODE_ENV = 'production'; // This suite preserves the unchanged legacy production flow.
    process.env.FRONTEND_URL = 'https://app.example.com';
  });

  afterEach(() => { process.env.NODE_ENV = originalNodeEnv; });

  it('creates an active existing-system survey with the required seen-checkin question and emails joined learners', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([cohort] as never);
    prismaMock.surveys.findFirst.mockResolvedValue(null);
    prismaMock.surveys.create.mockResolvedValue({ external_id: 'feedback-id' } as never);
    const now = new Date('2026-07-21T16:30:00.000Z');

    await expect(sendCohortFeedbackSurveys(now)).resolves.toBe(1);
    expect(prismaMock.cohorts.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { end_date: { lte: new Date('2026-07-22T00:00:00.000Z') }, status: 'published' }
    }));
    expect(prismaMock.surveys.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'active',
        is_public: true,
        created_by: 42,
        tags: ['lighthouse', 'cohort-feedback', 'lighthouse:cohort-feedback:8'],
        questions: {
          create: expect.arrayContaining([
            expect.objectContaining({
              question_text: '打卡被看見的感受',
              question_type: 'scale',
              is_required: true
            })
          ])
        }
      })
    }));
    expect(bulkEnqueueEmails).toHaveBeenCalledWith([
      expect.objectContaining({
        to: 'learner@example.com',
        userId: 77,
        emailType: 'cohort_feedback_survey',
        html: expect.stringContaining('https://app.example.com/survey/r/feedback-id')
      }),
      expect.objectContaining({ to: 'second@example.com', userId: 78 })
    ]);
  });

  it('does not create or resend a survey when the cohort tag already exists', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([cohort] as never);
    prismaMock.surveys.findFirst.mockResolvedValue({ id: 99 } as never);

    await expect(sendCohortFeedbackSurveys(new Date('2026-07-21T16:30:00.000Z'))).resolves.toBe(0);
    expect(prismaMock.surveys.create).not.toHaveBeenCalled();
    expect(bulkEnqueueEmails).not.toHaveBeenCalled();
  });
});
