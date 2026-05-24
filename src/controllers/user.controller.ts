/**
 * 用戶控制器 - 使用 Prisma
 * 處理用戶管理相關的請求
 */

import { Request, Response } from 'express';
import { userService, getCommonCirclesCount, getUserConnectionsCount } from '../services/user.service';
import { getRecentPracticeCount } from '../services/practice.service';
import {
  UserQueryParams,
  CreateUserRequest,
  UpdateUserRequest,
  SetCustomIdRequest,
  UpdateUserWithAvatarRequest
} from '../types/user.types';
import type {
  PreferencesQueryParams,
  UpdatePreferencesData
} from '../validators/me.validators';
import {
  createUserResponseSchema,
  userSuccessResponseSchema,
  usersListResponseSchema,
  updateUserResponseSchema,
  deleteUserResponseSchema,
  customIdAvailabilityResponseSchema,
  setCustomIdResponseSchema,
  removeCustomIdResponseSchema,
  userPreferencesResponseSchema,
  updateUserPreferencesResponseSchema,
  availablePreferencesResponseSchema,
  loginHistoryResponseSchema,
  userActivityStatsResponseSchema,
  updateUserSchema,
  createUserSchema
} from '../validators/user.validators';
import {
  NotFoundError,
  BadRequestError
} from '../middleware/error.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { setAuthCookie, clearAuthCookie } from '../utils/cookie-config';

/**
 * 取得所有用戶
 * GET /api/users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as UserQueryParams;
  const result = await userService.getAllUsers(params);

  // 未認證請求不得取得 PII 欄位（email、birthDay、loginCount 等）
  if (!req.user) {
    result.data = result.data.map(user => ({
      ...user,
      email: null,
      birthDay: null,
      isSubscribeEmail: false,
      loginCount: 0,
      lastLoginAt: null,
      lastActiveAt: null,
      profileViews: 0,
      referralSource: null,
      contactList: user.contactList ? { ...user.contactList, email: null } : null,
    }));
  }

  // 驗證響應格式
  const validatedResponse = usersListResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取當前用戶
 * GET /api/users/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  // 臨時用戶或未登入：返回 200 + null
  if (!currentUser || !currentUser._id) {
    res.status(200).json({
      success: true,
      data: null,
      timestamp: new Date().toISOString()
    });
    return;
  }

  const user = await userService.getMe(currentUser._id);

  // 查無用戶資料：返回 200 + null
  if (!user) {
    res.status(200).json({
      success: true,
      data: null,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 驗證響應格式
  const validatedResponse = userSuccessResponseSchema.parse(user);

  res.json(validatedResponse);
});

/**
 * 獲取指定用戶
 * GET /api/users/:id
 */
export const getOneUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user;

  // 傳遞當前用戶 ID 用於增加 profile_views（如果不是查看自己）
  const viewerId = currentUser?.id;
  const user = await userService.getOneUser(id, viewerId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // 驗證響應格式
  const validatedResponse = userSuccessResponseSchema.parse(user);

  res.json(validatedResponse);
});

/**
 * 創建用戶
 * POST /api/users
 * 此端點用於將臨時用戶轉換為正式用戶
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  // 檢查用戶是否為臨時用戶
  // 臨時用戶有 id (數字) 和 isTemp=true，但沒有 _id (UUID)
  if (!currentUser || !currentUser.id) {
    throw new NotFoundError('用戶資訊不存在');
  }

  if (!currentUser.isTemp) {
    throw new NotFoundError('此端點僅供臨時用戶完成註冊使用');
  }

  // FormData 需要先解析 JSON 欄位再驗證（與 updateMe 相同處理方式）
  const contentType = req.headers['content-type'] || '';
  const isFormData = contentType.includes('multipart/form-data');
  const parsedBody = isFormData
    ? parseFormDataBody(req.body)
    : req.body as CreateUserRequest;

  const validation = createUserSchema.safeParse(parsedBody);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new BadRequestError(`驗證失敗: ${errorMessage}`);
  }

  const requestData = validation.data as CreateUserRequest;

  // 將數字 id 轉換為字串傳遞給 service
  const result = await userService.createUser(requestData, currentUser.id.toString());

  // 設置新的 auth cookie
  if (result.data?.token) {
    setAuthCookie(res, result.data.token);
  }

  // 驗證響應格式確保符合 OpenAPI schema
  const validatedResponse = createUserResponseSchema.parse(result);

  res.status(201).json(validatedResponse);
});

/**
 * 解析 FormData 中的 JSON 欄位
 * FormData 會將所有值轉為字串，需要解析 JSON 欄位
 */
const parseFormDataBody = (body: Record<string, unknown>): UpdateUserRequest => {
  const result: Record<string, unknown> = {};

  // 需要解析為 JSON 的欄位
  const jsonFields = ['wantToDoList', 'tagList', 'positionList', 'interestList', 'preferences', 'contactList', 'professionalField'];

  // 需要解析為 boolean 的欄位
  const booleanFields = ['isOpenLocation', 'isOpenProfile', 'isSubscribeEmail', 'hideConnectionsCount'];

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (jsonFields.includes(key) && typeof value === 'string') {
      // 空字串代表未提供 JSON 欄位，跳過
      if (value === '') {
        continue;
      }
      try {
        result[key] = JSON.parse(value);
      } catch {
        // 如果解析失敗，保留原始值
        result[key] = value;
      }
    } else if (booleanFields.includes(key)) {
      result[key] = value === 'true' || value === true;
    } else if (value === '') {
      // 非 JSON 欄位的空字串，保留為空字串以便清除欄位
      result[key] = '';
    } else {
      result[key] = value;
    }
  }

  return result as UpdateUserRequest;
};

/**
 * 更新當前用戶
 * PUT /api/users/me
 * 支援 multipart/form-data（含 avatar 檔案）或 application/json
 */
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser._id) {
    throw new NotFoundError('User information not found');
  }

  // 檢查是否為 multipart/form-data（有檔案上傳）
  const avatarFile = req.file;

  // 解析表單資料（FormData 會將值轉為字串）
  const contentType = req.headers['content-type'] || '';
  const isFormData = contentType.includes('multipart/form-data');

  const parsedBody = isFormData
    ? parseFormDataBody(req.body)
    : req.body as UpdateUserRequest;

  // 驗證請求資料
  const validation = updateUserSchema.safeParse(parsedBody);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new BadRequestError(`驗證失敗: ${errorMessage}`);
  }

  const requestData: UpdateUserWithAvatarRequest = {
    ...validation.data,
    avatarFile
  };

  const result = await userService.updateUserWithAvatar(currentUser._id, requestData);

  // 驗證響應格式
  const validatedResponse = updateUserResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 更新用戶
 * PUT /api/users/:id
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestData = req.body as UpdateUserRequest;

  const result = await userService.updateUser(id, requestData);

  // 驗證響應格式
  const validatedResponse = updateUserResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 刪除當前用戶（軟刪除）
 * DELETE /api/users/me
 * 停用帳號、匿名化個人資料、清除認證 Cookie
 */
export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser._id) {
    throw new NotFoundError('User information not found');
  }

  const result = await userService.deleteMe(currentUser._id);

  // 清除認證 Cookie，讓用戶自動登出
  clearAuthCookie(res);

  // 驗證響應格式
  const validatedResponse = deleteUserResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 刪除用戶（管理員功能）
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);

  const result = await userService.deleteUser(userId);

  // 驗證響應格式
  const validatedResponse = deleteUserResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 檢查自訂 ID 可用性
 * GET /api/users/custom-id/check/:customId
 */
export const checkCustomIdAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { customId } = req.params;

  const result = await userService.checkCustomIdAvailability(customId);

  // 驗證響應格式
  const validatedResponse = customIdAvailabilityResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 設置當前用戶的自訂 ID
 * POST /api/users/me/custom-id
 */
export const setCustomId = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;
  const { customId } = req.body as SetCustomIdRequest;

  if (!currentUser) {
    throw new NotFoundError('User not found');
  }

  const result = await userService.setCustomId(currentUser.id, customId);

  // 驗證響應格式
  const validatedResponse = setCustomIdResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 移除當前用戶的自訂 ID
 * DELETE /api/users/me/custom-id
 */
export const removeCustomId = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser) {
    throw new NotFoundError('User not found');
  }

  const result = await userService.removeCustomId(currentUser.id);

  // 驗證響應格式
  const validatedResponse = removeCustomIdResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 透過自訂 ID 獲取用戶資訊
 * GET /api/users/custom-id/:customId
 */
export const getUserByCustomId = asyncHandler(async (req: Request, res: Response) => {
  const { customId } = req.params;

  const result = await userService.getUserByCustomId(customId);

  if (!result) {
    throw new NotFoundError('User not found');
  }

  // 驗證響應格式
  const validatedResponse = userSuccessResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取當前用戶的偏好設定
 * GET /api/users/me/preferences
 */
export const getUserPreferences = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser.id) {
    throw new Error('需要登入才能查看個人偏好設定');
  }

  // 查詢參數已經在 routes 層級驗證過
  const params = req.query as unknown as PreferencesQueryParams;
  const result = await userService.getUserPreferences(currentUser.id, params);

  // 驗證響應格式
  const validatedResponse = userPreferencesResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 更新當前用戶的偏好設定
 * PUT /api/users/me/preferences
 */
export const updateUserPreferences = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser.id) {
    throw new Error('需要登入才能更新個人偏好設定');
  }

  // 請求資料已經在 routes 層級驗證過
  const requestData = req.body as UpdatePreferencesData;
  const result = await userService.updateUserPreferences(currentUser.id, requestData);

  // 驗證響應格式
  const validatedResponse = updateUserPreferencesResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取所有可用的偏好選項
 * GET /api/users/preferences/available
 */
export const getAvailablePreferences = asyncHandler(async (_req: Request, res: Response) => {
  const result = await userService.getAvailablePreferences();

  // 驗證響應格式
  const validatedResponse = availablePreferencesResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取當前用戶的登入歷史
 * GET /api/users/me/login-history
 */
export const getLoginHistory = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser.id) {
    throw new NotFoundError('User not found');
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const result = await userService.getLoginHistory(currentUser.id, limit);

  // 驗證響應格式
  const validatedResponse = loginHistoryResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取當前用戶的活躍統計
 * GET /api/users/me/activity-stats
 */
export const getActivityStats = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser.id) {
    throw new NotFoundError('User not found');
  }

  const result = await userService.getUserActivityStats(currentUser.id);

  // 驗證響應格式
  const validatedResponse = userActivityStatsResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取設定頁完整度摘要
 * GET /api/v1/users/settings-summary
 */
export const getSettingsSummary = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser.id) {
    throw new NotFoundError('User not found');
  }

  const result = await userService.getSettingsSummary(currentUser.id);
  res.json(result);
});

/**
 * 取得 Profile 聚合資料
 * GET /api/v1/users/profile/:identifier
 * identifier 可為 custom_id（字母數字）或 external_id（UUID）
 * 無需強制登入，但若帶 JWT 則解析 viewerId 以計算 commonCirclesCount
 */
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;
  const currentUser = req.user;

  // 嘗試用 custom_id 或 external_id 查詢用戶
  const { prisma } = await import('../services/database/prisma.service');

  const user = await prisma.users.findFirst({
    where: {
      OR: [
        { custom_id: identifier },
        { external_id: identifier }
      ]
    },
    include: {
      contacts: true,
      user_activity_stats: true
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // 取得近 7 天實踐數
  const recentPracticeCount = await getRecentPracticeCount(user.id, 7);

  // 取得 connections 數
  const connectionsCount = await getUserConnectionsCount(user.id);

  const hideConnectionsCount = user.hide_connections_count ?? false;

  // 若有 viewerId 且不是自己，計算共同 circle 數
  const viewerIdNum = currentUser?.id ?? null;
  let commonCirclesCount: number | null = null;
  if (viewerIdNum !== null && viewerIdNum !== user.id) {
    commonCirclesCount = await getCommonCirclesCount(user.id, viewerIdNum);
  }

  res.json({
    success: true,
    data: {
      id: user.external_id ?? '',
      name: user.nickname ?? null,
      customId: user.custom_id ?? null,
      photoURL: user.contacts?.photo_url ?? null,
      headline: user.personal_slogan ?? null,
      educationStage: user.education_stage ?? null,
      recentPracticeCount,
      commonCirclesCount,
      hideConnectionsCount,
      connectionsCount: hideConnectionsCount ? null : connectionsCount,
      contactList: {
        instagram: user.contacts?.ig ?? null,
        discord: user.contacts?.discord ?? null,
        line: user.contacts?.line ?? null,
        facebook: user.contacts?.fb ?? null,
        threads: user.contacts?.threads ?? null,
        linkedin: user.contacts?.linkedin ?? null,
        github: user.contacts?.github ?? null,
        website: user.contacts?.website ?? null
      }
    },
    timestamp: new Date().toISOString()
  });
});

export const userController = {
  getAllUsers,
  getMe,
  getOneUser,
  createUser,
  updateMe,
  updateUser,
  deleteMe,
  deleteUser,
  checkCustomIdAvailability,
  setCustomId,
  removeCustomId,
  getUserByCustomId,
  getUserPreferences,
  updateUserPreferences,
  getAvailablePreferences,
  getLoginHistory,
  getActivityStats,
  getSettingsSummary,
  getUserProfile
};

export default userController;