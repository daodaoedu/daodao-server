/**
 * Onboarding Gate Middleware
 * 保護需要完成 Onboarding 的路由
 * 若 JWT 中 isTemporary === true，返回 403 Forbidden
 */

import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from './error.middleware';

/**
 * 要求 Onboarding 已完成才能存取
 * 未登入或臨時用戶（isTemporary === true）會收到 403 錯誤
 */
export const requireOnboardingComplete = (req: Request, res: Response, next: NextFunction): void => {
  // 只有已登入的臨時用戶才擋，未登入用戶交由各路由的 authenticate 處理
  if (req.user && req.isTemporary === true) {
    throw new ForbiddenError('請先完成 Onboarding 流程');
  }
  next();
};
