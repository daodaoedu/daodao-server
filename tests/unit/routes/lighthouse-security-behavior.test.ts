import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/database/redis.service', () => ({
  __esModule: true,
  default: {},
  redis: {},
  redisDisconnect: jest.fn()
}));

import organizationRoutes from '@/routes/organization.routes';
import practiceRoutes from '@/routes/practice.routes';
import { requireCohortCoach } from '@/middleware/cohort-role.middleware';
import { requireCohortCheckinAccess } from '@/middleware/cohort-object-access.middleware';
import { enforceCohortContentLifecycle, enforcePracticeCohortContentLifecycle } from '@/middleware/cohort-content-lifecycle.middleware';
import { ForbiddenError } from '@/middleware/error.middleware';

interface RouterLayer {
  handle: RequestHandler;
  route?: {
    path: string;
    stack: Array<{ handle: RequestHandler }>;
  };
}

const stack = (organizationRoutes as unknown as { stack: RouterLayer[] }).stack;
const routeHandlers = (path: string): RequestHandler[] => {
  const layer = stack.find(candidate => candidate.route?.path === path);
  if (!layer?.route) throw new Error(`Missing route ${path}`);
  return layer.route.stack.map(candidate => candidate.handle);
};
const practiceStack = (practiceRoutes as unknown as { stack: RouterLayer[] }).stack;

describe('Lighthouse security middleware on production routes', () => {
  const response = {} as Response;

  it('registers the real cohort coach guard and rejects a non-coach', async () => {
    const registeredGuard = stack.find(layer => layer.handle === requireCohortCoach);
    expect(registeredGuard).toBeDefined();
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(null);
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    const next = jest.fn() as NextFunction;

    await registeredGuard?.handle({ user: { id: 42 }, params: { cohortId: '8' } } as unknown as Request, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('allows an enrolled cohort owner through the registered coach guard', async () => {
    const registeredGuard = stack.find(layer => layer.handle === requireCohortCoach);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ role: 'owner' } as never);
    const next = jest.fn() as NextFunction;

    await registeredGuard?.handle({ user: { id: 42 }, params: { cohortId: '8' } } as unknown as Request, response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('runs object access before lifecycle and rejects a cross-cohort encouragement target', async () => {
    const handlers = routeHandlers('/programs/:programId/cohorts/:cohortId/checkins/:checkinId/encouragement-draft');
    const accessIndex = handlers.indexOf(requireCohortCheckinAccess);
    const lifecycleIndex = handlers.indexOf(enforceCohortContentLifecycle);
    expect(accessIndex).toBeGreaterThan(-1);
    expect(lifecycleIndex).toBeGreaterThan(accessIndex);
    prismaMock.practice_checkins.findFirst.mockResolvedValue(null);
    const next = jest.fn() as NextFunction;

    await handlers[accessIndex]({
      user: { id: 42 },
      params: { programId: '2', cohortId: '8', checkinId: '999' }
    } as unknown as Request, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it.each([
    ['/:id', 'put'],
    ['/:id', 'delete'],
    ['/:id/checkins', 'post'],
    ['/:id/checkins/:checkInId', 'put'],
    ['/:id/checkins/:checkInId', 'delete']
  ] as const)('registers practice lifecycle enforcement on %s %s mutations', (path, method) => {
    const layer = practiceStack.find(candidate => {
      const route = candidate.route as (RouterLayer['route'] & { methods?: Record<string, boolean> }) | undefined;
      return route?.path === path && route.methods?.[method];
    });
    expect(layer?.route?.stack.map(candidate => candidate.handle)).toContain(enforcePracticeCohortContentLifecycle);
  });
});
