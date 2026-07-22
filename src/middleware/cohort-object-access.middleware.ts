import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { prisma } from '../services/database/prisma.service';
import { ForbiddenError, UnauthorizedError } from './error.middleware';

export const requireCohortCheckinAccess: RequestHandler = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const cohortId = req.params.cohortId === undefined ? undefined : Number(req.params.cohortId);
    const programId = req.params.programId === undefined ? undefined : Number(req.params.programId);
    const practiceExternalId = req.params.practiceId ?? req.params.id;
    const checkInId = Number(req.params.checkInId ?? req.params.checkinId);
    if (!Number.isInteger(checkInId) || checkInId <= 0) throw new ForbiddenError('無效的資源 ID');
    if (cohortId !== undefined && (!Number.isInteger(cohortId) || cohortId <= 0)) throw new ForbiddenError('無效的資源 ID');
    if (programId !== undefined && (!Number.isInteger(programId) || programId <= 0)) throw new ForbiddenError('無效的資源 ID');
    const checkin = await prisma.practice_checkins.findFirst({
      where: {
        id: checkInId,
        practices: practiceExternalId !== undefined
          ? { external_id: practiceExternalId }
          : {
              cohort_id: cohortId,
              cohorts: programId === undefined ? undefined : { program_id: programId }
            }
      },
      select: {
        id: true,
        user_id: true,
        practices: {
          select: {
            cohorts: {
              select: {
                cohort_enrollments: {
                  where: { user_id: req.user.id, status: 'joined' },
                  select: { role: true }
                },
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
            }
          }
        }
      }
    });
    const cohort = checkin?.practices.cohorts;
    const hasCohortAccess = Boolean(
      cohort?.cohort_enrollments.length ||
      cohort?.program.organization.organization_members.length
    );
    if (!checkin || (checkin.user_id !== req.user.id && !hasCohortAccess)) {
      throw new ForbiddenError('無權限存取此期打卡');
    }
    next();
  } catch (error) {
    next(error);
  }
};
