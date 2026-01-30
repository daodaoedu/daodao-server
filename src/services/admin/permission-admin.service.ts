/**
 * 權限管理服務
 * 處理權限 CRUD 操作
 */

import { prisma } from '../database/prisma.service';
import type { permissions } from '../../../generated/prisma';
import type {
  CreatePermissionInput,
  UpdatePermissionInput
} from '../../validators/admin.validators';

/**
 * 格式化權限資料
 */
const formatPermission = (permission: permissions): {
  id: number;
  name: string;
  description: string | null;
} => ({
  id: permission.id,
  name: permission.name,
  description: permission.description
});

/**
 * 獲取所有權限
 */
export const getAllPermissions = async (): Promise<ReturnType<typeof formatPermission>[]> => {
  const permissions = await prisma.permissions.findMany({
    orderBy: { id: 'asc' }
  });
  return permissions.map(formatPermission);
};

/**
 * 根據 ID 獲取權限
 */
export const getPermissionById = async (
  id: number
): Promise<ReturnType<typeof formatPermission> | null> => {
  const permission = await prisma.permissions.findUnique({
    where: { id }
  });
  return permission ? formatPermission(permission) : null;
};

/**
 * 根據名稱獲取權限
 */
export const getPermissionByName = async (
  name: string
): Promise<ReturnType<typeof formatPermission> | null> => {
  const permission = await prisma.permissions.findUnique({
    where: { name }
  });
  return permission ? formatPermission(permission) : null;
};

/**
 * 創建權限
 */
export const createPermission = async (
  data: CreatePermissionInput
): Promise<ReturnType<typeof formatPermission>> => {
  // 檢查權限名稱是否已存在
  const existing = await prisma.permissions.findUnique({
    where: { name: data.name }
  });

  if (existing) {
    throw new Error('權限名稱已存在');
  }

  const permission = await prisma.permissions.create({
    data: {
      name: data.name,
      description: data.description ?? null
    }
  });
  return formatPermission(permission);
};

/**
 * 更新權限
 */
export const updatePermission = async (
  id: number,
  data: UpdatePermissionInput
): Promise<ReturnType<typeof formatPermission> | null> => {
  // 檢查權限是否存在
  const existing = await prisma.permissions.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  // 如果要更新名稱，檢查新名稱是否已被使用
  if (data.name && data.name !== existing.name) {
    const nameExists = await prisma.permissions.findUnique({
      where: { name: data.name }
    });
    if (nameExists) {
      throw new Error('權限名稱已存在');
    }
  }

  const permission = await prisma.permissions.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description })
    }
  });
  return formatPermission(permission);
};

/**
 * 刪除權限
 */
export const deletePermission = async (id: number): Promise<boolean> => {
  // 檢查權限是否存在
  const existing = await prisma.permissions.findUnique({ where: { id } });
  if (!existing) {
    return false;
  }

  // 檢查是否有角色使用此權限
  const rolesWithPermission = await prisma.role_permissions.count({
    where: { permission_id: id }
  });

  if (rolesWithPermission > 0) {
    throw new Error(`無法刪除權限：有 ${rolesWithPermission} 個角色正在使用此權限`);
  }

  // 檢查是否有用戶直接使用此權限
  const usersWithPermission = await prisma.user_permissions.count({
    where: { permission_id: id }
  });

  if (usersWithPermission > 0) {
    throw new Error(`無法刪除權限：有 ${usersWithPermission} 個用戶直接擁有此權限`);
  }

  // 刪除權限
  await prisma.permissions.delete({
    where: { id }
  });

  return true;
};

export default {
  getAllPermissions,
  getPermissionById,
  getPermissionByName,
  createPermission,
  updatePermission,
  deletePermission
};
