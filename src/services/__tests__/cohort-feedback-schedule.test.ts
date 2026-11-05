import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
const enqueue = jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined);
jest.mock('@/services/cohort-feedback-delivery.service', () => ({ enqueueCohortFeedbackSurvey: (cohortId: number): Promise<void> => enqueue(cohortId) }));
jest.mock('@/queues/email.queue', () => ({ bulkEnqueueEmails: jest.fn() }));
import { sendCohortFeedbackSurveys } from '../cohort-feedback-survey.service';
import { isCohortFeedbackEnabled, shuffleFeedbackTexts } from '../cohort-feedback.service';
import { cohortFeedbackQuerySchema } from '../../validators/cohort-feedback.validators';

const cohort = { id: 471, display_name: '期末回饋', program: { organization: { name: '組織', organization_members: [{ user_id: 3 }] } }, cohort_enrollments: [] };

describe('dev cohort feedback scheduling and boundaries', () => {
  const originalEnv = { node: process.env.NODE_ENV, app: process.env.APP_ENV };
  beforeEach(() => {
    prismaMock.$queryRaw.mockResolvedValue([{ ready: true }] as never);
    process.env.NODE_ENV = 'test'; process.env.APP_ENV = 'dev';
    prismaMock.cohorts.findMany.mockResolvedValue([cohort] as never);
    prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue(null);
    prismaMock.surveys.findFirst.mockResolvedValue(null);
    prismaMock.surveys.create.mockResolvedValue({ id: 99 } as never);
    setupTransactionMock();
  });
  afterEach(() => { process.env.NODE_ENV = originalEnv.node; process.env.APP_ENV = originalEnv.app; });

  it('defers dev scheduling before the feedback migration without creating a legacy substitute', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ ready: false }] as never);
    await expect(sendCohortFeedbackSurveys()).resolves.toBe(0);
    expect(prismaMock.cohorts.findMany).not.toHaveBeenCalled();
    expect(prismaMock.cohort_feedback_surveys.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.surveys.create).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('creates the four-question anonymous version atomically and hands off delivery after commit', async () => {
    await expect(sendCohortFeedbackSurveys(new Date('2026-11-05T15:30:00Z'))).resolves.toBe(1);
    expect(prismaMock.cohorts.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { end_date: { lt: new Date('2026-11-05T00:00:00Z') }, status: 'published', deleted_at: null } }));
    expect(prismaMock.surveys.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: '活動回饋', is_anonymous: true, questions: { create: [
      expect.objectContaining({ question_text: '整體來說，這個課程活動符合你的期待嗎？', question_type: 'rating', is_required: true }),
      expect.objectContaining({ question_type: 'text', is_required: false }),
      expect.objectContaining({ question_type: 'text', is_required: false }),
      expect.objectContaining({ question_type: 'text', is_required: false })
    ] } }) }));
    expect(prismaMock.cohort_feedback_surveys.create).toHaveBeenCalledWith({ data: { cohort_id: 471, survey_id: 99 } });
    expect(enqueue).toHaveBeenCalledWith(471);
  });

  it.each(['pending', 'queued', 'failed'])('resumes %s delivery without creating another questionnaire', async delivery_state => {
    prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue({ cohort_id: 471, survey_id: 99, delivery_state } as never);
    await expect(sendCohortFeedbackSurveys()).resolves.toBe(0);
    expect(prismaMock.surveys.create).not.toHaveBeenCalled();
    expect(enqueue).toHaveBeenCalledWith(471);
  });

  it('does not resend completed delivery', async () => {
    prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue({ delivery_state: 'sent' } as never);
    await sendCohortFeedbackSurveys();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('keeps the prior non-anonymous questionnaire unchanged', async () => {
    prismaMock.surveys.findFirst.mockResolvedValue({ id: 88 } as never);
    await sendCohortFeedbackSurveys();
    expect(prismaMock.surveys.create).not.toHaveBeenCalled();
    expect(prismaMock.surveys.update).not.toHaveBeenCalled();
    expect(prismaMock.cohort_feedback_surveys.create).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('refuses production even with dev flag and accepts only valid paging', () => {
    process.env.NODE_ENV = 'production'; expect(isCohortFeedbackEnabled()).toBe(false);
    expect(cohortFeedbackQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(cohortFeedbackQuerySchema.safeParse({ page: 1.1 }).success).toBe(false);
    expect(cohortFeedbackQuerySchema.safeParse({ status: 'unknown' }).success).toBe(false);
    expect(cohortFeedbackQuerySchema.parse({})).toEqual({ status: 'all', page: 1 });
  });

  it.each(['prod', 'production'])('refuses the %s NODE_ENV alias even with APP_ENV dev', nodeEnv => {
    process.env.NODE_ENV = nodeEnv; process.env.APP_ENV = 'dev';
    expect(isCohortFeedbackEnabled()).toBe(false);
  });

  it('shuffle preserves duplicate text answers without mutating its input', () => {
    const values = ['中文', 'ABC', '中文'];
    expect(shuffleFeedbackTexts(values).sort()).toEqual(['ABC', '中文', '中文']);
    expect(values).toEqual(['中文', 'ABC', '中文']);
  });
});
