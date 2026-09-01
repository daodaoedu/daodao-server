import type { NextFunction, Request, Response } from 'express';
import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { enforceCohortContentLifecycle, enforcePracticeCohortContentLifecycle, getCohortContentState } from '@/middleware/cohort-content-lifecycle.middleware';
import { ConflictError, GoneError } from '@/middleware/error.middleware';

describe('cohort content 90-day lifecycle', () => {
  it.each([
    ['2026-07-22', '2026-07-22', 'writable'],
    ['2026-07-22', '2026-07-23', 'read_only'],
    ['2026-07-22', '2026-10-20', 'read_only'],
    ['2026-07-22', '2026-10-21', 'gone']
  ] as const)('end %s at %s is %s', (end, now, expected) => {
    expect(getCohortContentState(new Date(`${end}T00:00:00Z`), new Date(`${now}T12:00:00Z`))).toBe(expected);
  });
  it('allows reads but blocks writes during read-only retention', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-23T12:00:00Z'));
    prismaMock.cohorts.findUnique.mockResolvedValue({ end_date: new Date('2026-07-22T00:00:00Z') } as never);
    const readNext = jest.fn() as NextFunction;
    await enforceCohortContentLifecycle({ method: 'GET', params: { cohortId: '8' } } as unknown as Request, {} as Response, readNext);
    expect(readNext).toHaveBeenCalledWith();
    const writeNext = jest.fn() as NextFunction;
    await enforceCohortContentLifecycle({ method: 'POST', params: { cohortId: '8' } } as unknown as Request, {} as Response, writeNext);
    expect(writeNext).toHaveBeenCalledWith(expect.any(ConflictError));
    jest.useRealTimers();
  });
  it('returns Gone after the retention boundary', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-21T12:00:00Z'));
    prismaMock.cohorts.findUnique.mockResolvedValue({ end_date: new Date('2026-07-22T00:00:00Z') } as never);
    const next = jest.fn() as NextFunction;
    await enforceCohortContentLifecycle({ method: 'GET', params: { cohortId: '8' } } as unknown as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(GoneError));
    jest.useRealTimers();
  });

  it('blocks actual practice/check-in mutations when their cohort is read-only', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-23T12:00:00Z'));
    prismaMock.practices.findUnique.mockResolvedValue({
      cohorts: { end_date: new Date('2026-07-22T00:00:00Z') }
    } as never);
    const next = jest.fn() as NextFunction;
    await enforcePracticeCohortContentLifecycle({
      method: 'POST',
      params: { id: '550e8400-e29b-41d4-a716-446655440000' }
    } as unknown as Request, {} as Response, next);
    expect(prismaMock.practices.findUnique).toHaveBeenCalledWith({
      where: { external_id: '550e8400-e29b-41d4-a716-446655440000' },
      select: { cohorts: { select: { end_date: true } } }
    });
    expect(next).toHaveBeenCalledWith(expect.any(ConflictError));
    jest.useRealTimers();
  });

  it('does not change behavior for a personal practice', async () => {
    prismaMock.practices.findUnique.mockResolvedValue({ cohorts: null } as never);
    const next = jest.fn() as NextFunction;
    await enforcePracticeCohortContentLifecycle({ method: 'PUT', params: { id: 'personal-practice' } } as unknown as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});
