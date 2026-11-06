import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
import { cohortFeedService } from '../cohort-feed.service';
import { cohortOutcomeService } from '../cohort-outcome.service';

const suspendedCohort = {
  id: 8, display_name: '停權組織場次', start_date: new Date('2026-10-01'), end_date: new Date('2026-12-31'),
  program: { name: '系列', organization_id: 2, organization: { status: 'suspended', timezone: 'Asia/Taipei', organization_members: [{ id: 1 }] } }
};

describe('suspended organization coach access (#276)', () => {
  const outcomeActions = [
    ['read outcome', (): Promise<unknown> => cohortOutcomeService.get(2, 8, 42)],
    ['generate summary', (): Promise<unknown> => cohortOutcomeService.generateSummary(2, 8, 42, { mode: 'platform' }, null)],
    ['edit summary', (): Promise<unknown> => cohortOutcomeService.editSummary(2, 8, 42, { content: '新摘要' })],
    ['record PDF export', (): Promise<unknown> => cohortOutcomeService.recordReportExport(2, 8, 42, undefined)]
  ] as const;

  it.each(outcomeActions)('refuses to %s even when the actor remains a member', async (_name, invoke) => {
    prismaMock.cohorts.findFirst.mockResolvedValue(suspendedCohort as never);
    await expect(invoke()).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('refuses coach feed access before loading private checkins', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(suspendedCohort as never);
    await expect(cohortFeedService.get(8, 42, 20, 0, 2)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.practice_checkins.findMany).not.toHaveBeenCalled();
    expect(prismaMock.practice_checkins.count).not.toHaveBeenCalled();
  });
});
