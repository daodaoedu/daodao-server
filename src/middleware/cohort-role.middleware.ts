import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { prisma } from '../services/database/prisma.service';
import { ForbiddenError, UnauthorizedError } from './error.middleware';

export type CohortRole = 'owner' | 'assistant' | 'member';

export const requireCohortRole = (...allowedRoles: CohortRole[]): RequestHandler => async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError('請先登入');
    const cohortId = Number(req.params.cohortId);
    if (!Number.isInteger(cohortId) || cohortId <= 0) throw new ForbiddenError('無效的期 ID');
    const enrollment = await prisma.cohort_enrollments.findFirst({
      where: { cohort_id: cohortId, user_id: req.user.id, status: 'joined' },
      select: { role: true }
    });
    if (enrollment && allowedRoles.includes(enrollment.role as CohortRole)) {
      next();
      return;
    }

    // Existing Lighthouse cohorts predate coach enrollments. Organization owners
    // are the canonical cohort owners and organization members act as assistants.
    const organizationMembership = await prisma.cohorts.findFirst({
      where: {
        id: cohortId,
        program: {
          organization: {
            organization_members: { some: { user_id: req.user.id } }
          }
        }
      },
      select: {
        program: {
          select: {
            organization: {
              select: {
                organization_members: {
                  where: { user_id: req.user.id },
                  select: { role: true }
                }
              }
            }
          }
        }
      }
    });
    const organizationRole = organizationMembership?.program.organization.organization_members[0]?.role;
    const effectiveRole: CohortRole | undefined = organizationRole === 'owner'
      ? 'owner'
      : organizationRole
        ? 'assistant'
        : undefined;
    if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
      throw new ForbiddenError('期角色權限不足');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const requireCohortCoach = requireCohortRole('owner', 'assistant');
