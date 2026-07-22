import { prismaMock } from '@tests/utils/prisma-mock';
import { anonymizeCohortEnrollments } from '@/services/cohort-anonymization.service';

describe('anonymizeCohortEnrollments', () => {
  it('retains enrollment rows while clearing identity fields and leaves snapshots untouched', async () => {
    prismaMock.cohort_enrollments.updateMany.mockResolvedValue({ count: 2 });
    await expect(anonymizeCohortEnrollments(prismaMock, 42)).resolves.toBe(2);
    expect(prismaMock.cohort_enrollments.updateMany).toHaveBeenCalledWith({
      where: { user_id: 42 },
      data: { user_id: null, email: null, invite_token: null }
    });
    expect(prismaMock.cohort_enrollments.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.cohort_stat_snapshots.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.cohort_stat_snapshots.deleteMany).not.toHaveBeenCalled();
  });
});

