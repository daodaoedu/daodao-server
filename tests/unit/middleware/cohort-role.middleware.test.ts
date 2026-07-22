import type { NextFunction, Request, Response } from 'express';
import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { requireCohortRole } from '@/middleware/cohort-role.middleware';
import { ForbiddenError, UnauthorizedError } from '@/middleware/error.middleware';

describe('requireCohortRole', () => {
  const response = {} as Response;
  it.each(['owner', 'assistant'] as const)('allows joined %s coach role', async role => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ role } as never);
    const next = jest.fn() as NextFunction;
    await requireCohortRole('owner', 'assistant')({ user: { id: 42 }, params: { cohortId: '8' } } as unknown as Request, response, next);
    expect(next).toHaveBeenCalledWith();
  });
  it('allows the owning organization member for existing cohorts without a coach enrollment', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(null);
    prismaMock.cohorts.findFirst.mockResolvedValue({
      program: { organization: { organization_members: [{ role: 'owner' }] } }
    } as never);
    const next = jest.fn() as NextFunction;
    await requireCohortRole('owner', 'assistant')({ user: { id: 42 }, params: { cohortId: '8' } } as unknown as Request, response, next);
    expect(prismaMock.cohorts.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 8,
        program: { organization: { organization_members: { some: { user_id: 42 } } } }
      })
    }));
    expect(next).toHaveBeenCalledWith();
  });
  it('rejects joined member when coach role is required', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ role: 'member' } as never);
    const next = jest.fn() as NextFunction;
    await requireCohortRole('owner', 'assistant')({ user: { id: 42 }, params: { cohortId: '8' } } as unknown as Request, response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
  it('rejects non-member and unauthenticated requests', async () => {
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(null);
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    const nonMemberNext = jest.fn() as NextFunction;
    await requireCohortRole('member')({ user: { id: 42 }, params: { cohortId: '8' } } as unknown as Request, response, nonMemberNext);
    expect(nonMemberNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    const unauthNext = jest.fn() as NextFunction;
    await requireCohortRole('member')({ params: { cohortId: '8' } } as unknown as Request, response, unauthNext);
    expect(unauthNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
