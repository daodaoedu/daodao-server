import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { getCohortFeedbackMetadata, submitCohortFeedback } from '../cohort-feedback.service';

const mapping = (cohortDeleted: Date | null = null, programDeleted: Date | null = null) => ({
  cohort_id: 552, survey_id: 12,
  cohort: { deleted_at: cohortDeleted, status: 'archived', display_name: 'Historical cohort',
    program: { deleted_at: programDeleted, organization: { name: 'Organization' } } },
});
const deleted = new Date('2026-11-23T00:00:00Z');
const deletedCases = [['cohort', deleted, null], ['programme only', null, deleted], ['both', deleted, deleted]] as const;
const answers = { answers: [{ question_id: 1, rating_value: 4 }] };
const originalAppEnv = process.env.APP_ENV;
afterAll(() => { if (originalAppEnv === undefined) delete process.env.APP_ENV; else process.env.APP_ENV = originalAppEnv; });
beforeEach(() => {
  setupTransactionMock();
  process.env.APP_ENV = 'dev';
  prismaMock.$queryRaw.mockResolvedValue([{ ready: true }] as never);
  prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue(mapping() as never);
  prismaMock.cohorts.findFirst.mockResolvedValue({ id: 552 } as never);
  prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 9 } as never);
  prismaMock.cohort_feedback_completions.findUnique.mockResolvedValue(null);
  prismaMock.questions.findMany.mockResolvedValue([{ id: 1, position: 0, question_type: 'rating', is_required: true }] as never);
});

describe('deleted feedback public lifecycle', () => {
  it.each(deletedCases)(
    'hides deleted %s for guests and members', async (_label, cohortDeleted, programDeleted) => {
      prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue(mapping(cohortDeleted, programDeleted) as never);
      for (const userId of [null, 77]) {
        await expect(getCohortFeedbackMetadata(12, userId)).rejects.toMatchObject({ statusCode: 404 });
      }
      expect(prismaMock.cohort_feedback_completions.create).not.toHaveBeenCalled();
      expect(prismaMock.cohort_feedback_answers.createMany).not.toHaveBeenCalled();
    });
  it.each(deletedCases)(
    'rejects valid submissions for deleted %s before persisting history', async (_label, cohortDeleted, programDeleted) => {
      prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue(mapping(cohortDeleted, programDeleted) as never);
      for (const userId of [null, 77]) await expect(submitCohortFeedback(12, userId, answers)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.cohort_feedback_completions.create).not.toHaveBeenCalled();
      expect(prismaMock.cohort_feedback_answers.createMany).not.toHaveBeenCalled();
    });
  it.each(['published', 'archived'])('preserves %s feedback availability and valid submission', async (status) => {
    const feedback = mapping(); feedback.cohort.status = status;
    prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue(feedback as never);
    await expect(getCohortFeedbackMetadata(12, 77)).resolves.toMatchObject({ state: 'ready', cohort_name: 'Historical cohort' });
    await expect(submitCohortFeedback(12, 77, answers)).resolves.toMatchObject({ data: { completed: true } });
    expect(prismaMock.cohort_feedback_answers.createMany).toHaveBeenCalledTimes(1);
  });
  it('leaves generic surveys on their existing path', async () => {
    prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue(null);
    await expect(getCohortFeedbackMetadata(99, null)).resolves.toBeNull();
    await expect(submitCohortFeedback(99, 77, answers)).resolves.toBeNull();
  });
  it('rechecks deletion inside the submission transaction before persisting answers', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    await expect(submitCohortFeedback(12, 77, answers)).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.cohort_feedback_completions.create).not.toHaveBeenCalled();
    expect(prismaMock.cohort_feedback_answers.createMany).not.toHaveBeenCalled();
  });
});
