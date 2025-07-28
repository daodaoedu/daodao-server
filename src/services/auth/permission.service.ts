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
   * 檢查用戶是否有指定角色
   */
  async hasRole(userId: number, roleName: string): Promise<boolean> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          roles: true
        }
      });

      return user?.roles?.name === roleName;
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
      // 簡化實現
      return true;
    } catch (error) {
      console.error('Error removing role:', error);
      return false;
    }
  }

  /**
   * 檢查資源擁有權
   */
  async checkResourceOwnership(
    userId: number, 
    resourceType: string, 
    resourceId: number
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'resource':
          // 檢查是否為資源創建者
          const resource = await prisma.resources.findUnique({
            where: { id: resourceId }
          });
          return resource?.created_by === userId;
        
        case 'user':
          // 檢查是否為用戶本人
          return resourceId === userId;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking resource ownership:', error);
      return false;
    }
  }

  /**
   * 檢查是否為超級管理員
   */
  async isSuperAdmin(userId: number): Promise<boolean> {
    try {
      return await this.hasRole(userId, 'super_admin');
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
   * 檢查用戶是否為管理員
   */
  async isAdmin(userId: number): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId);
      return userRoles.some(role => 
        role.name === 'admin' || role.name === 'super_admin'
      );
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
    resourceId: number
  ): Promise<boolean> {
    try {
      // 這裡需要根據不同的資源類型來檢查擁有權
      // 暫時返回 false，需要根據具體業務邏輯實現
      console.log('Checking resource ownership for user:', userId, 'resource:', resourceType, 'id:', resourceId);
      return false;
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