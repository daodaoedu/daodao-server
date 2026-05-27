/**
 * Admin 信任等級控制器
 * 處理信任等級設定、用戶群組相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminTrustService from '../services/admin-trust.service';
import {
  updateTrustConfigSchema,
  overrideUserTrustLevelSchema,
  createUserGroupSchema,
  updateUserGroupSchema,
  trustLevelParamSchema,
  userIdParamSchema,
  groupIdParamSchema,
  paginationQuerySchema,
} from '../validators/admin-trust.validator';

/**
 * 取得所有信任等級設定
 * GET /admin/trust-levels
 */
const getTrustConfig = asyncHandler(async (_req: Request, res: Response) => {
  const config = await adminTrustService.getTrustConfig();
  res.json(createSuccessResponse(config));
});

/**
 * 更新指定信任等級設定
 * PUT /admin/trust-levels/:level
 */
const updateTrustConfig = asyncHandler(async (req: Request, res: Response) => {
  const { level } = trustLevelParamSchema.parse(req.params);
  const input = updateTrustConfigSchema.parse(req.body);
  const config = await adminTrustService.updateTrustConfig(level, input);
  res.json(createSuccessResponse(config));
});

/**
 * 取得信任等級用戶分布
 * GET /admin/trust-levels/distribution
 */
const getTrustDistribution = asyncHandler(async (_req: Request, res: Response) => {
  const distribution = await adminTrustService.getTrustDistribution();
  res.json(createSuccessResponse(distribution));
});

/**
 * 取得信任等級變更歷史
 * GET /admin/trust-levels/history
 */
const getTrustHistory = asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset } = paginationQuerySchema.parse(req.query);
  const history = await adminTrustService.getTrustHistory(limit, offset);
  res.json(createSuccessResponse(history));
});

/**
 * 覆寫用戶信任等級
 * PUT /admin/users/:userId/trust-level
 */
const overrideUserTrustLevel = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = userIdParamSchema.parse(req.params);
  const { level } = overrideUserTrustLevelSchema.parse(req.body);
  const change = await adminTrustService.overrideUserTrustLevel(userId, level);
  res.json(createSuccessResponse(change));
});

/**
 * 列出所有用戶群組
 * GET /admin/groups
 */
const listUserGroups = asyncHandler(async (_req: Request, res: Response) => {
  const groups = await adminTrustService.listUserGroups();
  res.json(createSuccessResponse(groups));
});

/**
 * 建立用戶群組
 * POST /admin/groups
 */
const createUserGroup = asyncHandler(async (req: Request, res: Response) => {
  const input = createUserGroupSchema.parse(req.body);
  const group = await adminTrustService.createUserGroup(input);
  res.status(201).json(createSuccessResponse(group));
});

/**
 * 更新用戶群組
 * PUT /admin/groups/:id
 */
const updateUserGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = groupIdParamSchema.parse(req.params);
  const input = updateUserGroupSchema.parse(req.body);
  const group = await adminTrustService.updateUserGroup(id, input);
  res.json(createSuccessResponse(group));
});

/**
 * 刪除用戶群組
 * DELETE /admin/groups/:id
 */
const deleteUserGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = groupIdParamSchema.parse(req.params);
  await adminTrustService.deleteUserGroup(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

/**
 * 取得群組權限列表
 * GET /admin/groups/:id/permissions
 */
const getGroupPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = groupIdParamSchema.parse(req.params);
  const permissions = await adminTrustService.getGroupPermissions(id);
  res.json(createSuccessResponse(permissions));
});

export default {
  getTrustConfig,
  updateTrustConfig,
  getTrustDistribution,
  getTrustHistory,
  overrideUserTrustLevel,
  listUserGroups,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  getGroupPermissions,
};
