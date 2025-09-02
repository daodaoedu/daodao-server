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
  res.json(result);
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

  res.json(user);
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

  res.json(user);
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

  res.status(201).json(result);
});

/**
 * 更新用戶
 * PUT /api/users/:id
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestData = req.body as UpdateUserRequest;

  const result = await userService.updateUser(id, requestData);

  res.json(result);
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

  res.json(result);
});

/**
 * 刪除用戶（管理員功能）
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);

  const result = await userService.deleteUser(userId);

  res.json(result);
});

/**
 * 檢查自訂 ID 可用性
 * GET /api/users/custom-id/check/:customId
 */
export const checkCustomIdAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { customId } = req.params;

  const result = await userService.checkCustomIdAvailability(customId);

  res.json(result);
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

  res.json(result);
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

  res.json(result);
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

  res.json(result);
});

/**
 * 獲取當前用戶的偏好設定
 * GET /api/users/me/preferences
 */
export const getUserPreferences = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;

  if (!currentUser) {
    throw new NotFoundError('User not found');
  }

  const result = await userService.getUserPreferences(currentUser.id);

  res.json(result);
});

/**
 * 更新當前用戶的偏好設定
 * PUT /api/users/me/preferences
 */
export const updateUserPreferences = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;
  const preferences = req.body.preferences as Record<string, string[]>;

  if (!currentUser) {
    throw new NotFoundError('User not found');
  }

  const result = await userService.updateUserPreferences(currentUser.id, preferences);

  res.json(result);
});

/**
 * 獲取所有可用的偏好選項
 * GET /api/users/preferences/available
 */
export const getAvailablePreferences = asyncHandler(async (_req: Request, res: Response) => {
  const result = await userService.getAvailablePreferences();

  res.json(result);
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