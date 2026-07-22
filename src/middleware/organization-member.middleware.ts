/**
 * Lighthouse organization membership gate.
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { prisma } from '../services/database/prisma.service';
import { ForbiddenError, UnauthorizedError } from './error.middleware';

/**
 * Require the authenticated user to belong to at least one organization.
 *
 * This middleware only answers the Lighthouse entry-gate question. Routes that
 * operate on a specific organization, program, or cohort must additionally
 * perform object-level ownership checks.
 */
export const requireOrganizationMember: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('請先登入');
    }

    const membership = await prisma.organization_members.findFirst({
      where: { user_id: req.user.id },
      select: { id: true }
    });

    if (!membership) {
      throw new ForbiddenError('尚未開通燈塔組織成員資格');
    }

    next();
  } catch (error) {
    next(error);
  }
};
