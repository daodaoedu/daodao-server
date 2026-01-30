/**
 * 角色管理服務
 * 處理角色 CRUD、角色權限關聯、用戶角色指派
 */

import { prisma } from '../database/prisma.service';
import type { roles, permissions } from '../../../generated/prisma';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  RoleWithPermissions
} from '../../validators/admin.validators';

/**
 * 格式化角色資料
 */
const formatRole = (role: roles): {
  id: number;
  name: string;
  description: string | null;
} => ({
  id: role.id,
  name: role.name,
  description: role.description
});

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
 * 獲取所有角色
 */
export const getAllRoles = async (): Promise<ReturnType<typeof formatRole>[]> => {
  const roles = await prisma.roles.findMany({
    orderBy: { id: 'asc' }
  });
  return roles.map(formatRole);
};

/**
 * 根據 ID 獲取角色
 */
export const getRoleById = async (id: number): Promise<ReturnType<typeof formatRole> | null> => {
  const role = await prisma.roles.findUnique({
    where: { id }
  });
  return role ? formatRole(role) : null;
};

/**
 * 獲取角色及其權限
 */
export const getRoleWithPermissions = async (id: number): Promise<RoleWithPermissions | null> => {
  const role = await prisma.roles.findUnique({
    where: { id },
    include: {
      role_permissions: {
        include: {
          permissions: true
        }
      }
    }
  });

  if (!role) {
    return null;
  }

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.role_permissions.map(rp => formatPermission(rp.permissions))
  };
};

/**
 * 創建角色
 */
export const createRole = async (data: CreateRoleInput): Promise<ReturnType<typeof formatRole>> => {
  const role = await prisma.roles.create({
    data: {
      name: data.name,
      description: data.description ?? null
    }
  });
  return formatRole(role);
};

/**
 * 更新角色
 */
export const updateRole = async (
  id: number,
  data: UpdateRoleInput
): Promise<ReturnType<typeof formatRole> | null> => {
  // 檢查角色是否存在
  const existing = await prisma.roles.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const role = await prisma.roles.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description })
    }
  });
  return formatRole(role);
};

/**
 * 刪除角色
 */
export const deleteRole = async (id: number): Promise<boolean> => {
  // 檢查角色是否存在
  const existing = await prisma.roles.findUnique({ where: { id } });
  if (!existing) {
    return false;
  }

  // 檢查是否有用戶使用此角色
  const usersWithRole = await prisma.users.count({
    where: { role_id: id }
  });

  if (usersWithRole > 0) {
    throw new Error(`無法刪除角色：有 ${usersWithRole} 個用戶正在使用此角色`);
  }

  // 刪除角色的權限關聯
  await prisma.role_permissions.deleteMany({
    where: { role_id: id }
  });

  // 刪除角色
  await prisma.roles.delete({
    where: { id }
  });

  return true;
};

/**
 * 為角色新增權限
 */
export const addPermissionToRole = async (
  roleId: number,
  permissionId: number
): Promise<boolean> => {
  // 檢查角色和權限是否存在
  const [role, permission] = await Promise.all([
    prisma.roles.findUnique({ where: { id: roleId } }),
    prisma.permissions.findUnique({ where: { id: permissionId } })
  ]);

  if (!role) {
    throw new Error('角色不存在');
  }
  if (!permission) {
    throw new Error('權限不存在');
  }

  // 檢查關聯是否已存在
  const existing = await prisma.role_permissions.findUnique({
    where: {
      role_id_permission_id: {
        role_id: roleId,
        permission_id: permissionId
      }
    }
  });

  if (existing) {
    return false; // 已存在，返回 false
  }

  await prisma.role_permissions.create({
    data: {
      role_id: roleId,
      permission_id: permissionId
    }
  });

  return true;
};

/**
 * 移除角色權限
 */
export const removePermissionFromRole = async (
  roleId: number,
  permissionId: number
): Promise<boolean> => {
  // 檢查關聯是否存在
  const existing = await prisma.role_permissions.findUnique({
    where: {
      role_id_permission_id: {
        role_id: roleId,
        permission_id: permissionId
      }
    }
  });

  if (!existing) {
    return false;
  }

  await prisma.role_permissions.delete({
    where: {
      role_id_permission_id: {
        role_id: roleId,
        permission_id: permissionId
      }
    }
  });

  return true;
};

/**
 * 獲取用戶角色
 */
export const getUserRole = async (userId: number): Promise<{
  userId: number;
  role: ReturnType<typeof formatRole> | null;
}> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      roles: true
    }
  });

  if (!user) {
    throw new Error('用戶不存在');
  }

  return {
    userId: user.id,
    role: user.roles ? formatRole(user.roles) : null
  };
};

/**
 * 更新用戶角色
 */
export const updateUserRole = async (
  userId: number,
  roleId: number
): Promise<boolean> => {
  // 檢查用戶是否存在
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('用戶不存在');
  }

  // 檢查角色是否存在
  const role = await prisma.roles.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new Error('角色不存在');
  }

  await prisma.users.update({
    where: { id: userId },
    data: { role_id: roleId }
  });

  return true;
};

export default {
  getAllRoles,
  getRoleById,
  getRoleWithPermissions,
  createRole,
  updateRole,
  deleteRole,
  addPermissionToRole,
  removePermissionFromRole,
  getUserRole,
  updateUserRole
};
