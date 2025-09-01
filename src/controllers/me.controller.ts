/**
 * Me controller
 * Handles HTTP requests for /api/v1/me endpoints
 * Personal user data management
 */

import { Request, Response } from 'express';
import { meService } from '../services/me.service';
import {
  practiceQuerySchema,
  practiceStatsQuerySchema,
  resourcesQuerySchema,
  preferencesQuerySchema,
  updatePreferencesSchema
} from '../validators/me.validators';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * GET /api/v1/me/practices
 * 獲取我的實踐記錄
 */
export const getMyPractices = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser || !currentUser.id) {
    throw new Error('需要登入才能查看個人實踐記錄');
  }

  const params = practiceQuerySchema.parse(req.query);
  const result = await meService.getMyPractices(currentUser.id, params);

  res.json(result);
});

/**
 * GET /api/v1/me/practice-stats
 * 獲取我的實踐統計
 */
export const getMyPracticeStats = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser || !currentUser.id) {
    throw new Error('需要登入才能查看實踐統計');
  }

  const params = practiceStatsQuerySchema.parse(req.query);
  const result = await meService.getMyPracticeStats(currentUser.id, params);

  res.json(result);
});

/**
 * GET /api/v1/me/resources
 * 獲取我的個人資源草稿
 */
export const getMyResources = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser || !currentUser.id) {
    throw new Error('需要登入才能查看個人資源');
  }

  const params = resourcesQuerySchema.parse(req.query);
  const result = await meService.getMyResources(currentUser.id, params);

  res.json(result);
});

/**
 * GET /api/v1/me/preferences
 * 獲取我的個人偏好設定
 */
export const getMyPreferences = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser || !currentUser.id) {
    throw new Error('需要登入才能查看個人偏好設定');
  }

  const params = preferencesQuerySchema.parse(req.query);
  const result = await meService.getMyPreferences(currentUser.id, params);

  res.json(result);
});

/**
 * PUT /api/v1/me/preferences
 * 更新我的個人偏好設定
 */
export const updateMyPreferences = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser || !currentUser.id) {
    throw new Error('需要登入才能更新個人偏好設定');
  }

  const requestData = updatePreferencesSchema.parse(req.body);
  const result = await meService.updateMyPreferences(currentUser.id, requestData);

  res.json(result);
});

// Export all controller functions
export default {
  getMyPractices,
  getMyPracticeStats,
  getMyResources,
  getMyPreferences,
  updateMyPreferences
};