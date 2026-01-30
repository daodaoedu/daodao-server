/**
 * 管理員控制器
 * 處理角色與權限管理的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import roleService from '../services/admin/role.service';
import permissionAdminService from '../services/admin/permission-admin.service';
import {
  getRolesApiResponseSchema,
  getRoleWithPermissionsApiResponseSchema,
  mutateRoleApiResponseSchema,
  deleteRoleApiResponseSchema,
  getPermissionsApiResponseSchema,
  getPermissionApiResponseSchema,
  mutatePermissionApiResponseSchema,
  deletePermissionApiResponseSchema,
  rolePermissionApiResponseSchema,
  getUserRoleApiResponseSchema,
  updateUserRoleApiResponseSchema
} from '../validators/admin.validators';

// ===== 角色管理 =====

/**
 * 獲取所有角色
 * GET /admin/roles
 */
export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await roleService.getAllRoles();
  const result = createSuccessResponse(roles);
  const validatedResponse = getRolesApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 獲取單一角色（含權限）
 * GET /admin/roles/:id
 */
export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new BadRequestError('無效的角色 ID');
  }

  const role = await roleService.getRoleWithPermissions(id);
  if (!role) {
    throw new NotFoundError('角色不存在');
  }

  const result = createSuccessResponse(role);
  const validatedResponse = getRoleWithPermissionsApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 創建角色
 * POST /admin/roles
 */
export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  const role = await roleService.createRole({ name, description });
  const result = createSuccessResponse(role);
  const validatedResponse = mutateRoleApiResponseSchema.parse(result);
  res.status(201).json(validatedResponse);
});

/**
 * 更新角色
 * PUT /admin/roles/:id
 */
export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new BadRequestError('無效的角色 ID');
  }

  const { name, description } = req.body;
  const role = await roleService.updateRole(id, { name, description });

  if (!role) {
    throw new NotFoundError('角色不存在');
  }

  const result = createSuccessResponse(role);
  const validatedResponse = mutateRoleApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 刪除角色
 * DELETE /admin/roles/:id
 */
export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new BadRequestError('無效的角色 ID');
  }

  try {
    const deleted = await roleService.deleteRole(id);
    if (!deleted) {
      throw new NotFoundError('角色不存在');
    }

    const result = createSuccessResponse({ deleted: true });
    const validatedResponse = deleteRoleApiResponseSchema.parse(result);
    res.json(validatedResponse);
  } catch (error) {
    if (error instanceof Error && error.message.includes('無法刪除')) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
});

// ===== 權限管理 =====

/**
 * 獲取所有權限
 * GET /admin/permissions
 */
export const getAllPermissions = asyncHandler(async (req: Request, res: Response) => {
  const permissions = await permissionAdminService.getAllPermissions();
  const result = createSuccessResponse(permissions);
  const validatedResponse = getPermissionsApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 獲取單一權限
 * GET /admin/permissions/:id
 */
export const getPermissionById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new BadRequestError('無效的權限 ID');
  }

  const permission = await permissionAdminService.getPermissionById(id);
  if (!permission) {
    throw new NotFoundError('權限不存在');
  }

  const result = createSuccessResponse(permission);
  const validatedResponse = getPermissionApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 創建權限
 * POST /admin/permissions
 */
export const createPermission = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  try {
    const permission = await permissionAdminService.createPermission({ name, description });
    const result = createSuccessResponse(permission);
    const validatedResponse = mutatePermissionApiResponseSchema.parse(result);
    res.status(201).json(validatedResponse);
  } catch (error) {
    if (error instanceof Error && error.message === '權限名稱已存在') {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
});

/**
 * 更新權限
 * PUT /admin/permissions/:id
 */
export const updatePermission = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new BadRequestError('無效的權限 ID');
  }

  const { name, description } = req.body;

  try {
    const permission = await permissionAdminService.updatePermission(id, { name, description });
    if (!permission) {
      throw new NotFoundError('權限不存在');
    }

    const result = createSuccessResponse(permission);
    const validatedResponse = mutatePermissionApiResponseSchema.parse(result);
    res.json(validatedResponse);
  } catch (error) {
    if (error instanceof Error && error.message === '權限名稱已存在') {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
});

/**
 * 刪除權限
 * DELETE /admin/permissions/:id
 */
export const deletePermission = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new BadRequestError('無效的權限 ID');
  }

  try {
    const deleted = await permissionAdminService.deletePermission(id);
    if (!deleted) {
      throw new NotFoundError('權限不存在');
    }

    const result = createSuccessResponse({ deleted: true });
    const validatedResponse = deletePermissionApiResponseSchema.parse(result);
    res.json(validatedResponse);
  } catch (error) {
    if (error instanceof Error && error.message.includes('無法刪除')) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
});

// ===== 角色權限關聯 =====

/**
 * 為角色新增權限
 * POST /admin/roles/:roleId/permissions
 */
export const addRolePermission = asyncHandler(async (req: Request, res: Response) => {
  const roleId = parseInt(req.params.roleId, 10);
  if (isNaN(roleId)) {
    throw new BadRequestError('無效的角色 ID');
  }

  const { permissionId } = req.body;
  if (!permissionId || typeof permissionId !== 'number') {
    throw new BadRequestError('必須提供有效的權限 ID');
  }

  try {
    const added = await roleService.addPermissionToRole(roleId, permissionId);
    const result = createSuccessResponse({
      success: true
    }, {
      message: added ? '權限已成功新增到角色' : '權限已存在於該角色'
    });
    const validatedResponse = rolePermissionApiResponseSchema.parse(result);
    res.status(added ? 201 : 200).json(validatedResponse);
  } catch (error) {
    if (error instanceof Error && (error.message === '角色不存在' || error.message === '權限不存在')) {
      throw new NotFoundError(error.message);
    }
    throw error;
  }
});

/**
 * 移除角色權限
 * DELETE /admin/roles/:roleId/permissions/:permissionId
 */
export const removeRolePermission = asyncHandler(async (req: Request, res: Response) => {
  const roleId = parseInt(req.params.roleId, 10);
  const permissionId = parseInt(req.params.permissionId, 10);

  if (isNaN(roleId)) {
    throw new BadRequestError('無效的角色 ID');
  }
  if (isNaN(permissionId)) {
    throw new BadRequestError('無效的權限 ID');
  }

  const removed = await roleService.removePermissionFromRole(roleId, permissionId);
  if (!removed) {
    throw new NotFoundError('角色權限關聯不存在');
  }

  const result = createSuccessResponse({ success: true });
  const validatedResponse = rolePermissionApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

// ===== 用戶角色指派 =====

/**
 * 獲取用戶角色
 * GET /admin/users/:userId/role
 */
export const getUserRole = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    throw new BadRequestError('無效的用戶 ID');
  }

  try {
    const userRole = await roleService.getUserRole(userId);
    const result = createSuccessResponse(userRole);
    const validatedResponse = getUserRoleApiResponseSchema.parse(result);
    res.json(validatedResponse);
  } catch (error) {
    if (error instanceof Error && error.message === '用戶不存在') {
      throw new NotFoundError(error.message);
    }
    throw error;
  }
});

/**
 * 更新用戶角色
 * PUT /admin/users/:userId/role
 */
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    throw new BadRequestError('無效的用戶 ID');
  }

  const { roleId } = req.body;
  if (!roleId || typeof roleId !== 'number') {
    throw new BadRequestError('必須提供有效的角色 ID');
  }

  try {
    await roleService.updateUserRole(userId, roleId);
    const result = createSuccessResponse({ success: true });
    const validatedResponse = updateUserRoleApiResponseSchema.parse(result);
    res.json(validatedResponse);
  } catch (error) {
    if (error instanceof Error && (error.message === '用戶不存在' || error.message === '角色不存在')) {
      throw new NotFoundError(error.message);
    }
    throw error;
  }
});

export default {
  // 角色管理
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  // 權限管理
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  // 角色權限關聯
  addRolePermission,
  removeRolePermission,
  // 用戶角色
  getUserRole,
  updateUserRole
};
