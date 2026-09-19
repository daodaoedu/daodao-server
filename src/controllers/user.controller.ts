/**
 * 用戶控制器 - 使用 Prisma
 * 處理用戶管理相關的請求
 */

import { Request, Response } from 'express';
import { validate as isUuid } from 'uuid';
import type { Prisma } from '../../generated/prisma';
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
  nameAvailabilityResponseSchema,
  setCustomIdResponseSchema,
  removeCustomIdResponseSchema,
  userPreferencesResponseSchema,
  updateUserPreferencesResponseSchema,
  availablePreferencesResponseSchema,
  loginHistoryResponseSchema,
  userActivityStatsResponseSchema,
  updateUserSchema
} from '../validators/user.validators';
import {
  NotFoundError,
  BadRequestError
} from '../middleware/error.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { setAuthCookie, clearAuthCookie, QUIZ_CLAIM_COOKIE_NAME, clearQuizClaimCookie } from '../utils/cookie-config';
import { createSuccessResponse } from '../utils/response-helper';
import { getUserIslandData } from '../services/user-island.service';
import { permissionService } from '../services/auth/permission.service';

/**
 * 取得所有用戶
 * GET /api/users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as UserQueryParams;
  const result = await userService.getAllUsers(params);

  // 非管理員不得取得 PII 欄位（email、birthDay、loginCount 等）
  const isAdmin = req.user ? await permissionService.isAdmin(req.user.id) : false;
  if (!isAdmin) {
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
      contactList: user.contactList ? { ...user.contactList, email: null, isSubscribeEmail: null } : null,
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
 * POST /api/users/me
 * 此端點用於將臨時用戶轉換為正式用戶
 * req.body 已由 parseFormData + validate middleware 處理完畢
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser.id) {
    throw new NotFoundError('用戶資訊不存在');
  }

  if (!currentUser.isTemp) {
    throw new NotFoundError('此端點僅供臨時用戶完成註冊使用');
  }

  // req.body 已由 parseFormData + validate(createUserSchema) middleware 解析並驗證
  const requestData = req.body as CreateUserRequest;
  const quizClaimToken = req.cookies?.[QUIZ_CLAIM_COOKIE_NAME] as string | undefined;
  const result = await userService.createUser(requestData, currentUser.id.toString(), { quizClaimToken });

  if (result.data?.token) {
    setAuthCookie(res, result.data.token);
  }

  if (result.quizClaimed) {
    clearQuizClaimCookie(res);
  }


  const validatedResponse = createUserResponseSchema.parse(result);
  res.status(201).json(validatedResponse);
});

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

  // 驗證請求資料（req.body 已由 parseFormData middleware 解析）
  const validation = updateUserSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new BadRequestError(`驗證失敗: ${errorMessage}`);
  }

  const requestData: UpdateUserWithAvatarRequest = {
    ...validation.data,
    avatarFile: req.file
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

/** Check name availability without confusing temporary and permanent user IDs. */
export const checkNameAvailability = asyncHandler(async (req: Request, res: Response) => {
  const name = req.query.name as string;
  const currentUserId = req.user && !req.isTemporary ? Number(req.user.id) : undefined;
  const result = await userService.checkNameAvailability(name, currentUserId);
  res.json(nameAvailabilityResponseSchema.parse(result));
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

  // external_id 為 UUID 欄位，identifier 非 UUID 時不可納入比對，
  // 否則 Prisma 會嘗試將 custom_id 字串 parse 成 UUID 而丟出例外（回傳 500）
  const orConditions: Prisma.usersWhereInput[] = [{ custom_id: identifier }];
  if (isUuid(identifier)) {
    orConditions.push({ external_id: identifier });
  }

  const user = await prisma.users.findFirst({
    where: {
      OR: orConditions
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

/**
 * 取得 3D 島嶼頁 islandData 聚合資料
 * GET /api/v1/users/:identifier/island
 * identifier 可為 custom_id（字母數字）或 external_id（UUID）
 * 無需強制登入；帶 JWT 則解析 viewerId 以計算 viewerRelation 與隱私過濾
 */
export const getUserIsland = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;
  const currentUser = req.user;

  const { prisma } = await import('../services/database/prisma.service');

  // external_id 為 UUID 欄位，identifier 非 UUID 時不可納入比對，
  // 否則 Prisma 會嘗試將 custom_id 字串 parse 成 UUID 而丟出例外（回傳 500）
  const orConditions: Prisma.usersWhereInput[] = [{ custom_id: identifier }];
  if (isUuid(identifier)) {
    orConditions.push({ external_id: identifier });
  }

  const user = await prisma.users.findFirst({
    where: { OR: orConditions },
    include: { contacts: true }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const islandData = await getUserIslandData(
    {
      id: user.id,
      external_id: user.external_id,
      custom_id: user.custom_id,
      nickname: user.nickname,
      photoUrl: user.contacts?.photo_url ?? null
    },
    currentUser?.id ?? null
  );

  res.json(createSuccessResponse(islandData));
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
  checkNameAvailability,
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
  getUserProfile,
  getUserIsland
};

export default userController;