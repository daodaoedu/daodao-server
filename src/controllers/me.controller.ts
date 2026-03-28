/**
 * Me controller
 * Handles HTTP requests for /api/v1/me endpoints
 * Personal user data management
 */

import { Request, Response } from 'express';
import { meService } from '../services/me.service';
import { asyncHandler } from '../middleware/error.middleware';
import type {
  MePracticesQueryParams,
  PracticeStatsQueryParams,
  ResourcesQueryParams,
  PreferencesQueryParams,
  UpdatePreferencesData,
  MyFootprintsQueryParams
} from '../validators/me.validators';
import {
  myPracticesApiResponseSchema,
  myPracticeStatsApiResponseSchema,
  myResourcesApiResponseSchema,
  myPreferencesApiResponseSchema,
  updatePreferencesApiResponseSchema,
  myFootprintsApiResponseSchema
} from '../validators/me.validators';

/**
 * GET /api/v1/me/practices
 * 獲取我的實踐記錄
 */
export const getMyPractices = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser || !currentUser.id) {
    throw new Error('需要登入才能查看個人實踐記錄');
  }

  // 查詢參數已經在 routes 層級驗證過
  const params = req.query as unknown as MePracticesQueryParams;
  const result = await meService.getMyPractices(currentUser.id, params);

  const validatedResponse = myPracticesApiResponseSchema.parse(result);
  res.json(validatedResponse);
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

  // 查詢參數已經在 routes 層級驗證過
  const params = req.query as unknown as PracticeStatsQueryParams;
  const result = await meService.getMyPracticeStats(currentUser.id, params);

  const validatedResponse = myPracticeStatsApiResponseSchema.parse(result);
  res.json(validatedResponse);
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

  // 查詢參數已經在 routes 層級驗證過
  const params = req.query as unknown as ResourcesQueryParams;
  const result = await meService.getMyResources(currentUser.id, params);

  const validatedResponse = myResourcesApiResponseSchema.parse(result);
  res.json(validatedResponse);
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

  // 查詢參數已經在 routes 層級驗證過
  const params = req.query as unknown as PreferencesQueryParams;
  const result = await meService.getMyPreferences(currentUser.id, params);

  const validatedResponse = myPreferencesApiResponseSchema.parse(result);
  res.json(validatedResponse);
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

  // 請求資料已經在 routes 層級驗證過
  const requestData = req.body as UpdatePreferencesData;
  const result = await meService.updateMyPreferences(currentUser.id, requestData);

  const validatedResponse = updatePreferencesApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * GET /api/v1/me/footprints
 * 獲取我的學習足跡（在實踐上留下的留言）
 */
export const getMyLearningFootprints = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser || !currentUser.id) {
    throw new Error('需要登入才能查看學習足跡');
  }

  const page = parseInt((req.query.page as string) || '1', 10) || 1;
  const limit = parseInt((req.query.limit as string) || '20', 10) || 20;

  const params: MyFootprintsQueryParams = { page, limit };
  const result = await meService.getMyLearningFootprints(currentUser.id, params);

  const validatedResponse = myFootprintsApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

// Export all controller functions
export default {
  getMyPractices,
  getMyPracticeStats,
  getMyResources,
  getMyPreferences,
  updateMyPreferences,
  getMyLearningFootprints
};