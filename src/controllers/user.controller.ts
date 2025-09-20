/**
 * 用戶控制器 - 使用 Prisma
 * 處理用戶管理相關的請求
 */

import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import {
  UserQueryParams,
  CreateUserRequest,
  UpdateUserRequest,
  SetCustomIdRequest
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
  availablePreferencesResponseSchema
} from '../validators/user.validators';
import {
  NotFoundError
} from '../middleware/error.middleware';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * 取得所有用戶
 * GET /api/users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as UserQueryParams;
  const result = await userService.getAllUsers(params);
  
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

  if (!currentUser || !currentUser._id) {
    throw new NotFoundError('User not found');
  }

  const user = await userService.getMe(currentUser._id);

  if (!user) {
    throw new NotFoundError('User not found');
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

  const user = await userService.getOneUser(id);

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
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const requestData = req.body as CreateUserRequest;
  const currentUser = req.user;

  if (!currentUser || !currentUser._id) {
    throw new NotFoundError('User information not found');
  }

  const result = await userService.createUser(requestData, currentUser._id);

  // 驗證響應格式確保符合 OpenAPI schema
  const validatedResponse = createUserResponseSchema.parse(result);

  res.status(201).json(validatedResponse);
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
 * 刪除當前用戶
 * DELETE /api/users/me
 */
export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser._id) {
    throw new NotFoundError('User information not found');
  }

  const result = await userService.deleteMe(currentUser._id);

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

export const userController = {
  getAllUsers,
  getMe,
  getOneUser,
  createUser,
  updateUser,
  deleteMe,
  deleteUser,
  checkCustomIdAvailability,
  setCustomId,
  removeCustomId,
  getUserByCustomId,
  getUserPreferences,
  updateUserPreferences,
  getAvailablePreferences
};

export default userController;