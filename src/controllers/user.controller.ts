/**
 * 用戶控制器 - 使用 Prisma
 * 處理用戶管理相關的請求
 */

import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import {
  UserQueryParams,
  CreateUserRequest,
  UpdateUserRequest
} from '../types/user.types';
import { AuthRequest } from '../types/auth.types';
import {
  NotFoundError
} from '../utils/error-handler';
import { asyncWrapper } from '../utils/error-handler';

/**
 * 取得所有用戶
 * GET /api/users
 */
export const getAllUsers = asyncWrapper(async (req: Request, res: Response) => {
  const params = req.query as UserQueryParams;
  const result = await userService.getAllUsers(params);
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * 獲取當前用戶
 * GET /api/users/me
 */
export const getMe = asyncWrapper(async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser._id) {
    const response = {
      success: true,
      data: null,
      message: "User not found"
    };
    res.status(200).json(response);
    return;
  }

  const user = await userService.getMe(currentUser._id);

  if (!user) {
    const response = {
      success: true,
      data: null,
      message: "User not found"
    };
    res.status(200).json(response);
    return;
  }

  const response = {
    success: true,
    data: user,
  };

  res.status(200).json(response);
});

/**
 * 獲取指定用戶
 * GET /api/users/:id
 */
export const getOneUser = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await userService.getOneUser(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const response = {
    success: true,
    data: user,
  };

  res.status(200).json(response);
});

/**
 * 創建用戶
 * POST /api/users
 */
export const createUser = asyncWrapper(async (req: AuthRequest, res: Response) => {
  const requestData = req.body as CreateUserRequest;
  const currentUser = req.user;

  if (!currentUser || !currentUser._id) {
    throw new Error('User information not found');
  }

  const result = await userService.createUser(requestData, currentUser._id);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: {
      user: result.user,
      token: result.token
    }
  });
});

/**
 * 更新用戶
 * PUT /api/users/:id
 */
export const updateUser = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestData = req.body as UpdateUserRequest;

  const updatedUser = await userService.updateUser(id, requestData);

  const response = {
    success: true,
    data: updatedUser,
  };

  res.status(200).json(response);
});

/**
 * 刪除當前用戶
 * DELETE /api/users/me
 */
export const deleteMe = asyncWrapper(async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || !currentUser._id) {
    throw new Error('User information not found');
  }

  await userService.deleteMe(currentUser._id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    data: {}
  });
});

/**
 * 刪除用戶（管理員功能）
 * DELETE /api/users/:id
 */
export const deleteUser = asyncWrapper(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);

  await userService.deleteUser(userId);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    data: {}
  });
});

export const userController = {
  getAllUsers,
  getMe,
  getOneUser,
  createUser,
  updateUser,
  deleteMe,
  deleteUser
};

export default userController;