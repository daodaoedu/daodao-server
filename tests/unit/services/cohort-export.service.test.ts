import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { cohortExportService } from '@/services/cohort-export.service';

describe('cohortExportService', () => {
  it('persists learner-controlled export opt-in', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 9 } as never);
    prismaMock.cohort_enrollments.update.mockResolvedValue({ id: 9 } as never);
    const now = new Date('2026-07-22T00:00:00Z');
    await expect(cohortExportService.setConsent(8, 42, true, now)).resolves.toEqual({ cohortId: 8, consent: true, optedInAt: now });
    expect(prismaMock.cohort_enrollments.update).toHaveBeenCalledWith({ where: { id: 9 }, data: { export_opt_in: true, export_opted_in_at: now } });
  });
  it('exports only opt-in learners with nickname/checkins/reflection and audits scope without email', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([{
      email: 'private@example.com',
      user: { nickname: '小島', practices: [{ title: '每日反思', reflection: '心得內容', practice_checkins: [{ note: '今天完成了' }] }] }
    }] as never);
    const result = await cohortExportService.exportOutcome(2, 8, 42, new Date('2026-07-22T00:00:00Z'));
    expect(result.learners).toEqual([{ nickname: '小島', practices: [{ title: '每日反思', checkinSummary: ['今天完成了'], reflectionExcerpt: '心得內容' }] }]);
    expect(JSON.stringify(result)).not.toContain('private@example.com');
    expect(prismaMock.cohort_enrollments.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { cohort_id: 8, export_opt_in: true, user_id: { not: null } } }));
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining([
      42,
      'lighthouse.cohort_outcome_exported',
      '8',
      JSON.stringify({ scope: 'opt_in_learners', optInCount: 1 })
    ]));
    expect(String(prismaMock.$executeRaw.mock.calls[0][0])).toContain("'cohort'");
  });
  it('returns an empty export when nobody opted in while still auditing', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 8 } as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([]);
    await expect(cohortExportService.exportOutcome(2, 8, 42)).resolves.toEqual(expect.objectContaining({ learners: [] }));
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
