/**
 * 權限管理服務
 * 處理用戶權限和角色管理
 */

import { prisma } from '../database/prisma.service';
import type { users, roles, permissions } from '../../../generated/prisma';

/**
 * 權限服務類
 */
export class PermissionService {
  /**
   * 檢查用戶是否有特定權限
   */
  async hasPermission(
    userId: number, 
    resource: string, 
    action: string, 
    options?: { allowTemp?: boolean }
  ): Promise<boolean> {
    try {
      console.log('Checking permission for user:', userId, 'resource:', resource, 'action:', action);
      
      // 檢查是否為超級管理員
      if (await this.isSuperAdmin(userId)) {
        return true;
      }

      // 查找用戶的角色
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role_permissions: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return false;
      }

      // 檢查角色權限 - 根據權限名稱匹配
      const hasRolePermission = user.roles?.role_permissions?.some(
        rp => rp.permissions && rp.permissions.name === `${resource}:${action}`
      );

      if (hasRolePermission) {
        return true;
      }

      // 檢查用戶直接權限
      const userPermissions = await prisma.user_permissions.findMany({
        where: {
          user_id: userId
        },
        include: {
          permissions: true
        }
      });

      return userPermissions.some(up => up.permissions.name === `${resource}:${action}`);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * 檢查用戶是否有任一權限
   */
  async hasAnyPermission(
    userId: number, 
    permissions: Array<{ resource: string; action: string }>
  ): Promise<boolean> {
    try {
      for (const permission of permissions) {
        if (await this.hasPermission(userId, permission.resource, permission.action)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking any permission:', error);
      return false;
    }
  }

  /**
   * 檢查用戶是否有指定角色（不區分大小寫）
   */
  async hasRole(userId: number, roleName: string): Promise<boolean> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          roles: true
        }
      });

      return user?.roles?.name?.toLowerCase() === roleName.toLowerCase();
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  /**
   * 檢查用戶是否有任一角色
   */
  async hasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          roles: true
        }
      });

      return roleNames.includes(user?.roles?.name || '');
    } catch (error) {
      console.error('Error checking any role:', error);
      return false;
    }
  }

  /**
   * 獲取用戶的所有權限
   */
  async getUserPermissions(userId: number): Promise<permissions[]> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role_permissions: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return [];
      }

      // 提取所有權限並去重
      const permissionMap = new Map<number, permissions>();
      
      if (user.roles?.role_permissions) {
        user.roles.role_permissions.forEach(rp => {
          if (rp.permissions) {
            permissionMap.set(rp.permissions.id, rp.permissions);
          }
        });
      }

      // 獲取用戶直接權限
      const userPermissions = await prisma.user_permissions.findMany({
        where: {
          user_id: userId
        },
        include: {
          permissions: true
        }
      });

      userPermissions.forEach(up => {
        if (up.permissions) {
          permissionMap.set(up.permissions.id, up.permissions);
        }
      });

      return Array.from(permissionMap.values());
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * 獲取用戶的所有角色
   */
  async getUserRoles(userId: number): Promise<roles[]> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          roles: true
        }
      });

      return user?.roles ? [user.roles] : [];
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  /**
   * 為用戶分配角色 (簡化版本)
   */
  async assignRole(userId: number, roleId: number, grantedBy?: number): Promise<boolean> {
    try {
      // 簡化實現，直接更新用戶角色
      await prisma.users.update({
        where: { id: userId },
        data: { role_id: roleId }
      });
      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      return false;
    }
  }

  /**
   * 移除用戶角色 (簡化版本)
   */
  async removeRole(userId: number, roleId: number): Promise<boolean> {
    try {
      const defaultRole = await prisma.roles.findFirst({
        where: { name: { in: ['member', 'Member', 'user', 'User'] } },
        orderBy: { id: 'asc' }
      });

      if (!defaultRole) {
        console.error('Default role not found, cannot remove role');
        return false;
      }

      if (defaultRole.id === roleId) {
        console.warn('Cannot remove the default role');
        return false;
      }

      const result = await prisma.users.updateMany({
        where: { id: userId, role_id: roleId },
        data: { role_id: defaultRole.id }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error removing role:', error);
      return false;
    }
  }

  /**
   * 檢查資源擁有權
   * @deprecated 請使用 isResourceOwner 方法代替
   */
  async checkResourceOwnership(
    userId: number,
    resourceType: string,
    resourceId: number | string
  ): Promise<boolean> {
    // 直接調用新的 isResourceOwner 方法
    return this.isResourceOwner(userId, resourceType, resourceId);
  }

  /**
   * 檢查是否為超級管理員（不區分大小寫）
   */
  async isSuperAdmin(userId: number): Promise<boolean> {
    try {
      // hasRole 已經是不區分大小寫的比較
      return await this.hasRole(userId, 'superadmin');
    } catch (error) {
      console.error('Error checking super admin:', error);
      return false;
    }
  }

  /**
   * 檢查用戶是否擁有所有指定權限
   */
  async hasAllPermissions(
    userId: number,
    permissions: string[]
  ): Promise<boolean> {
    try {
      for (const permission of permissions) {
        const [resource, action] = permission.split(':');
        const hasPermission = await this.hasPermission(userId, resource, action);
        if (!hasPermission) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking all permissions:', error);
      return false;
    }
  }

  /**
   * 檢查用戶是否為管理員（Admin 或 SuperAdmin，不區分大小寫）
   */
  async isAdmin(userId: number): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId);
      return userRoles.some(role => {
        const name = role.name?.toLowerCase();
        return name === 'admin' || name === 'superadmin' || name === 'super_admin';
      });
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * 檢查用戶是否為資源擁有者
   */
  async isResourceOwner(
    userId: number,
    resourceType: string,
    resourceId: number | string
  ): Promise<boolean> {
    try {
      console.log('Checking resource ownership for user:', userId, 'resource:', resourceType, 'id:', resourceId);

      switch (resourceType) {
        case 'user': {
          // 對於用戶資源，檢查是否為用戶本人
          // resourceId 可能是 external_id (UUID) 或內部 id (數字)
          if (typeof resourceId === 'string') {
            // 如果是字符串（UUID），通過 external_id 查找
            const user = await prisma.users.findUnique({
              where: { external_id: resourceId },
              select: { id: true }
            });
            return user?.id === userId;
          } else {
            // 如果是數字，直接比較內部 ID
            return resourceId === userId;
          }
        }

        case 'resource': {
          // 檢查是否為資源創建者
          if (typeof resourceId === 'number') {
            const resource = await prisma.resources.findUnique({
              where: { id: resourceId },
              select: { created_by: true }
            });
            return resource?.created_by === userId;
          }
          return false;
        }

        case 'project': {
          // 檢查是否為專案創建者或成員
          if (typeof resourceId === 'number') {
            const project = await prisma.project.findUnique({
              where: { id: resourceId },
              select: { user_id: true }
            });
            return project?.user_id === userId;
          }
          return false;
        }

        case 'review': {
          // 檢查是否為心得評價創建者（通過 post 關聯）
          if (typeof resourceId === 'number') {
            const review = await prisma.review.findUnique({
              where: { id: resourceId },
              select: {
                post: {
                  select: { user_id: true }
                }
              }
            });
            return review?.post.user_id === userId;
          }
          return false;
        }

        case 'idea': {
          // 檢查是否為想法創建者
          if (typeof resourceId === 'number') {
            const idea = await prisma.ideas.findUnique({
              where: { id: resourceId },
              select: { user_id: true }
            });
            return idea?.user_id === userId;
          }
          return false;
        }

        default:
          console.warn(`Unknown resource type: ${resourceType}`);
          return false;
      }
    } catch (error) {
      console.error('Error checking resource ownership:', error);
      return false;
    }
  }

  /**
   * 創建新角色
   */
  async createRole(name: string, description?: string): Promise<roles | null> {
    try {
      const role = await prisma.roles.create({
        data: {
          name,
          description
        }
      });
      return role;
    } catch (error) {
      console.error('Error creating role:', error);
      return null;
    }
  }

  /**
   * 創建新權限
   */
  async createPermission(
    name: string, 
    resource: string, 
    action: string, 
    description?: string
  ): Promise<permissions | null> {
    try {
      const permission = await prisma.permissions.create({
        data: {
          name,
          description
        }
      });
      return permission;
    } catch (error) {
      console.error('Error creating permission:', error);
      return null;
    }
  }
}

// 創建權限服務實例
export const permissionService = new PermissionService();
export default permissionService;