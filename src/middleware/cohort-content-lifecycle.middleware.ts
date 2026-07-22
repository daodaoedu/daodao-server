import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { prisma } from '../services/database/prisma.service';
import { ConflictError, GoneError, NotFoundError } from './error.middleware';

export type CohortContentState = 'writable' | 'read_only' | 'gone';
export const getCohortContentState = (endDate: Date, now = new Date()): CohortContentState => {
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const goneAt = new Date(end);
  goneAt.setUTCDate(goneAt.getUTCDate() + 90);
  if (today > goneAt) return 'gone';
  if (today > end) return 'read_only';
  return 'writable';
};

const readMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
export const enforceCohortContentLifecycle: RequestHandler = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const cohortId = Number(req.params.cohortId);
    const cohort = await prisma.cohorts.findUnique({ where: { id: cohortId }, select: { end_date: true } });
    if (!cohort) throw new NotFoundError('找不到期');
    const state = getCohortContentState(cohort.end_date);
    if (state === 'gone') throw new GoneError('本期內容已超過結束後 90 天保留期限');
    if (state === 'read_only' && !readMethods.has(req.method)) throw new ConflictError('本期已結束，內容目前為唯讀');
    next();
  } catch (error) {
    next(error);
  }
};

export const enforcePracticeCohortContentLifecycle: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const practice = await prisma.practices.findUnique({
      where: { external_id: req.params.id },
      select: { cohorts: { select: { end_date: true } } }
    });
    if (!practice?.cohorts) {
      next();
      return;
    }
    const state = getCohortContentState(practice.cohorts.end_date);
    if (state === 'gone') throw new GoneError('本期內容已超過結束後 90 天保留期限');
    if (state === 'read_only' && !readMethods.has(req.method)) throw new ConflictError('本期已結束，內容目前為唯讀');
    next();
  } catch (error) {
    next(error);
  }
};
