import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
import { cohortActivityService } from '../cohort-activity.service';

const suspendedMemberCohort = {
  id: 8,
  program: { organization: { status: 'suspended', timezone: 'Asia/Taipei', organization_members: [{ id: 1 }] } }
};

const activityReads = [
  ['list', (): Promise<unknown> => cohortActivityService.list(2, 8, 42, { hasText: false, limit: 50, offset: 0 })],
  ['detail', (): Promise<unknown> => cohortActivityService.get(2, 8, 42, 'checkin', '10')]
] as const;

describe('suspended organization activity access (#276 AC-09)', () => {
  it.each(activityReads)('refuses the %s before querying private activity content', async (_name, invoke) => {
    prismaMock.cohorts.findFirst.mockResolvedValue(suspendedMemberCohort as never);
    await expect(invoke()).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    expect(prismaMock.practice_checkins.findUnique).not.toHaveBeenCalled();
  });
});
