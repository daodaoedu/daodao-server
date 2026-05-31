/**
 * Admin 使用者管理控制器
 * 處理 Admin 使用者相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import { createSuccessResponse, createPaginatedResponse } from '../utils/response-helper';
import adminUserService from '../services/admin-user.service';
import { findUserPractices } from '../services/practice.service';
import type { SortField, SortOrder } from '../types/practice.types';
import {
  adminUserListQuerySchema,
  adminUserIdParamSchema,
  adminLoginHistoryQuerySchema,
  updateUserStatusSchema
} from '../validators/admin-user.validator';

/**
 * 取得 Admin 使用者列表
 * GET /admin/users
 */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = adminUserListQuerySchema.parse(req.query);

  const result = await adminUserService.getAdminUserList({
    search: query.search,
    roleId: query.roleId,
    isActive: query.isActive,
    isVerified: query.isVerified,
    personaType: query.personaType,
    badgeGranted: query.badgeGranted,
    userSource: query.userSource,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder
  });

  const response = createPaginatedResponse(
    result.users,
    {
      currentPage: result.pagination.currentPage,
      totalPages: result.pagination.totalPages,
      totalItems: result.pagination.totalCount,
      itemsPerPage: result.pagination.limit,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev
    }
  );

  res.json(response);
});

/**
 * 取得 Admin 使用者詳情
 * GET /admin/users/:userId
 */
export const getUserDetail = asyncHandler(async (req: Request, res: Response) => {
  const params = adminUserIdParamSchema.parse(req.params);

  const user = await adminUserService.getAdminUserDetail(params.userId);

  const response = createSuccessResponse(user);
  res.json(response);
});

/**
 * 取得使用者登入歷史
 * GET /admin/users/:userId/login-history
 */
export const getLoginHistory = asyncHandler(async (req: Request, res: Response) => {
  const params = adminUserIdParamSchema.parse(req.params);
  const query = adminLoginHistoryQuerySchema.parse(req.query);

  const result = await adminUserService.getUserLoginHistory(params.userId, {
    startDate: query.startDate,
    endDate: query.endDate,
    page: query.page,
    limit: query.limit
  });

  const response = createPaginatedResponse(
    result.records,
    {
      currentPage: result.pagination.currentPage,
      totalPages: result.pagination.totalPages,
      totalItems: result.pagination.totalCount,
      itemsPerPage: result.pagination.limit,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev
    }
  );

  res.json(response);
});

/**
 * 取得使用者活躍統計
 * GET /admin/users/:userId/activity-stats
 */
export const getActivityStats = asyncHandler(async (req: Request, res: Response) => {
  const params = adminUserIdParamSchema.parse(req.params);

  const stats = await adminUserService.getUserActivityStats(params.userId);

  const response = createSuccessResponse(stats);
  res.json(response);
});

/**
 * 取得使用者實踐列表
 * GET /admin/users/:userId/practices
 */
export const getUserPracticesList = asyncHandler(async (req: Request, res: Response) => {
  const params = adminUserIdParamSchema.parse(req.params);

  const result = await findUserPractices(params.userId, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: Math.min(Number(req.query.limit) || 20, 100),
    sortBy: (req.query.sort ?? req.query.sortBy) as SortField | undefined,
    sortOrder: (req.query.order ?? req.query.sortOrder) as SortOrder | undefined,
    status: req.query.status as string | undefined,
  });

  res.json(result);
});

/**
 * 取得使用者活動時間軸
 * GET /admin/users/:userId/activity-timeline
 */
export const getActivityTimeline = asyncHandler(async (req: Request, res: Response) => {
  const params = adminUserIdParamSchema.parse(req.params);
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const events = await adminUserService.getActivityTimeline(params.userId, limit);

  const response = createSuccessResponse(events);
  res.json(response);
});

/**
 * 更新使用者狀態（啟用/停用）
 * PUT /admin/users/:userId/status
 */
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const params = adminUserIdParamSchema.parse(req.params);
  const body = updateUserStatusSchema.parse(req.body);

  // 取得當前操作者的用戶 ID
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    throw new BadRequestError('無法識別當前用戶');
  }

  const result = await adminUserService.toggleUserStatus(
    params.userId,
    body.isActive,
    currentUserId
  );

  const response = createSuccessResponse(result);
  res.json(response);
});

export default {
  listUsers,
  getUserDetail,
  getLoginHistory,
  getActivityStats,
  getActivityTimeline,
  getUserPracticesList,
  updateStatus
};
