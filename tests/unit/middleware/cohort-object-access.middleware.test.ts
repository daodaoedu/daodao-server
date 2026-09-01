import type { NextFunction, Request, Response } from 'express';
import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { requireCohortCheckinAccess } from '@/middleware/cohort-object-access.middleware';
import { ForbiddenError } from '@/middleware/error.middleware';

describe('requireCohortCheckinAccess IDOR guard', () => {
  const response = {} as Response;
  const request = { user: { id: 42 }, params: { programId: '2', cohortId: '8', checkinId: '10' } } as unknown as Request;
  it('allows only when checkin, practice, cohort and actor relationship all match', async () => {
    prismaMock.practice_checkins.findFirst.mockResolvedValue({
      id: 10,
      user_id: 77,
      practices: {
        cohorts: {
          cohort_enrollments: [{ role: 'assistant' }],
          program: { organization: { organization_members: [] } }
        }
      }
    } as never);
    const next = jest.fn() as NextFunction;
    await requireCohortCheckinAccess(request, response, next);
    expect(prismaMock.practice_checkins.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 10, practices: expect.objectContaining({ cohort_id: 8, cohorts: { program_id: 2 } }) })
    }));
    expect(next).toHaveBeenCalledWith();
  });
  it.each([
    ['cohortId', '88'], ['programId', '99'], ['checkinId', '100']
  ] as const)('rejects a swapped %s', async (field, value) => {
    prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
    const next = jest.fn() as NextFunction;
    await requireCohortCheckinAccess({ ...request, params: { ...request.params, [field]: value } } as Request, response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('matches the external practice id used by production practice routes', async () => {
    prismaMock.practice_checkins.findFirst.mockResolvedValue({
      id: 10,
      user_id: 42,
      practices: { cohorts: null }
    } as never);
    const next = jest.fn() as NextFunction;
    await requireCohortCheckinAccess({
      user: { id: 42 },
      params: { id: '550e8400-e29b-41d4-a716-446655440000', checkInId: '10' }
    } as unknown as Request, response, next);
    expect(prismaMock.practice_checkins.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 10,
        practices: { external_id: '550e8400-e29b-41d4-a716-446655440000' }
      })
    }));
    expect(next).toHaveBeenCalledWith();
  });
});
