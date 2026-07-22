import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
const upsertCohortSnapshot = jest.fn().mockResolvedValue({ id: 1 });
const sendWeeklyCohortDigests = jest.fn().mockResolvedValue(3);
const sendCohortFeedbackSurveys = jest.fn().mockResolvedValue(2);
jest.mock('@/services/cohort-stat.service', () => ({
  startOfWeekUtc: (now: Date): Date => { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); const offset = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - offset); return d; },
  upsertCohortSnapshot: (...args: unknown[]): unknown => upsertCohortSnapshot(...args)
}));
jest.mock('@/services/cohort-weekly-digest.service', () => ({
  sendWeeklyCohortDigests: (...args: unknown[]): unknown => sendWeeklyCohortDigests(...args)
}));
jest.mock('@/services/cohort-feedback-survey.service', () => ({
  sendCohortFeedbackSurveys: (...args: unknown[]): unknown => sendCohortFeedbackSurveys(...args)
}));
import { processCohortStatJob } from '@/queues/cohort-stat.worker';
import { registerCohortStatJobs } from '@/queues/cohort-stat.queue';

describe('cohort weekly snapshot worker', () => {
  it('creates one weekly snapshot for every published cohort', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-20T00:10:00Z'));
    prismaMock.cohorts.findMany.mockResolvedValue([{ id: 8 }, { id: 9 }] as never);
    await expect(processCohortStatJob({ data: { kind: 'weekly' } } as never)).resolves.toBe(2);
    expect(upsertCohortSnapshot).toHaveBeenCalledTimes(2);
    expect(upsertCohortSnapshot).toHaveBeenCalledWith(8, 'weekly', new Date('2026-07-13T00:00:00Z'), new Date('2026-07-20T00:00:00Z'));
    jest.useRealTimers();
  });
  it('creates final snapshots on each cohort end date', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-21T16:20:00Z'));
    prismaMock.cohorts.findMany.mockResolvedValue([{ id: 8, start_date: new Date('2026-07-01T00:00:00Z'), end_date: new Date('2026-07-22T00:00:00Z') }] as never);
    await expect(processCohortStatJob({ data: { kind: 'final' } } as never)).resolves.toBe(1);
    expect(prismaMock.cohorts.findMany).toHaveBeenCalledWith({ where: { end_date: new Date('2026-07-22T00:00:00Z') }, select: { id: true, start_date: true, end_date: true } });
    expect(upsertCohortSnapshot).toHaveBeenCalledWith(8, 'final', new Date('2026-07-01T00:00:00Z'), new Date('2026-07-23T00:00:00Z'));
    jest.useRealTimers();
  });
  it('dispatches the weekly coach digest through the BullMQ worker', async () => {
    await expect(processCohortStatJob({ data: { kind: 'digest' } } as never)).resolves.toBe(3);
    expect(sendWeeklyCohortDigests).toHaveBeenCalledTimes(1);
  });
  it('dispatches cohort feedback surveys through the BullMQ worker', async () => {
    await expect(processCohortStatJob({ data: { kind: 'feedback' } } as never)).resolves.toBe(2);
    expect(sendCohortFeedbackSurveys).toHaveBeenCalledTimes(1);
  });
  it('registers the digest every Monday at 08:00 Asia/Taipei', async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    await registerCohortStatJobs({ add } as never);
    expect(add).toHaveBeenCalledWith('weekly-digest', { kind: 'digest' }, {
      repeat: { pattern: '0 8 * * 1', tz: 'Asia/Taipei' },
      jobId: 'cohort-weekly-digest'
    });
  });
  it('registers feedback delivery daily at 00:30 Asia/Taipei', async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    await registerCohortStatJobs({ add } as never);
    expect(add).toHaveBeenCalledWith('cohort-feedback-survey', { kind: 'feedback' }, {
      repeat: { pattern: '30 0 * * *', tz: 'Asia/Taipei' },
      jobId: 'cohort-feedback-survey'
    });
  });
});
