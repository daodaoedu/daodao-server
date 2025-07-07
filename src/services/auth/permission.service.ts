/**
 * 權限管理服務
 * 處理用戶權限和角色管理
 */

import { 
  Permission, 
  Role, 
  User,
  UserRole, 
  RolePermission
} from '../../models/index';
import { Op } from 'sequelize';

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

      // 查找用戶的所有角色及其權限
      const userRoles = await UserRole.findAll({
        where: { 
          user_id: userId, 
          is_active: true,
          // 檢查角色是否過期
          [Op.or]: [
            { expires_at: { [Op.is]: undefined } },
            { expires_at: { [Op.gte]: new Date() } }
          ]
        },
        include: [{
          model: Role,
          as: 'role',
          where: { is_active: true },
          include: [{
            model: Permission,
            as: 'permissions',
            through: {
              where: { is_active: true }
            },
            where: { 
              resource, 
              action,
              is_active: true 
            }
          }]
        }]
      });

      // 如果找到匹配的權限，返回 true
      return userRoles.length > 0;
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
      const userRole = await UserRole.findOne({
        where: { 
          user_id: userId, 
          is_active: true,
          [Op.or]: [
            { expires_at: { [Op.is]: undefined } },
            { expires_at: { [Op.gte]: new Date() } }
          ]
        },
        include: [{
          model: Role,
          as: 'role',
          where: { 
            name: roleName,
            is_active: true 
          }
        }]
      });

      return !!userRole;
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
      const userRole = await UserRole.findOne({
        where: { 
          user_id: userId, 
          is_active: true,
          [Op.or]: [
            { expires_at: { [Op.is]: undefined } },
            { expires_at: { [Op.gte]: new Date() } }
          ]
        },
        include: [{
          model: Role,
          as: 'role',
          where: { 
            name: { [Op.in]: roleNames },
            is_active: true 
          }
        }]
      });

      return !!userRole;
    } catch (error) {
      console.error('Error checking any role:', error);
      return false;
    }
  }

  /**
   * 獲取用戶的所有權限
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    try {
      const userRoles = await UserRole.findAll({
        where: { 
          user_id: userId, 
          is_active: true,
          [Op.or]: [
            { expires_at: { [Op.is]: undefined } },
            { expires_at: { [Op.gte]: new Date() } }
          ]
        },
        include: [{
          model: Role,
          as: 'role',
          where: { is_active: true },
          include: [{
            model: Permission,
            as: 'permissions',
            through: {
              where: { is_active: true }
            },
            where: { is_active: true }
          }]
        }]
      });

      // 提取所有權限並去重
      const permissions = new Map<number, Permission>();
      userRoles.forEach(userRole => {
        const role = userRole.role as any;
        if (role && role.permissions) {
          role.permissions.forEach((permission: Permission) => {
            permissions.set(permission.id, permission);
          });
        }
      });

      return Array.from(permissions.values());
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * 獲取用戶的所有角色
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    try {
      const userRoles = await UserRole.findAll({
        where: { 
          user_id: userId, 
          is_active: true,
          [Op.or]: [
            { expires_at: { [Op.is]: undefined } },
            { expires_at: { [Op.gte]: new Date() } }
          ]
        },
        include: [{
          model: Role,
          as: 'role',
          where: { is_active: true }
        }]
      });

      return userRoles.map(userRole => (userRole.role as any));
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  /**
   * 為用戶分配角色
   */
  async assignRole(userId: number, roleId: number, grantedBy?: number): Promise<boolean> {
    try {
      const existingUserRole = await UserRole.findOne({
        where: { user_id: userId, role_id: roleId }
      });

      if (existingUserRole) {
        // 如果已存在，更新為活躍狀態
        await existingUserRole.update({ 
          is_active: true,
          granted_by: grantedBy,
          granted_at: new Date()
        });
      } else {
        // 創建新的用戶角色關聯
        await UserRole.create({
          user_id: userId,
          role_id: roleId,
          granted_by: grantedBy,
          granted_at: new Date(),
          is_active: true
        });
      }

      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      return false;
    }
  }

  /**
   * 移除用戶角色
   */
  async removeRole(userId: number, roleId: number): Promise<boolean> {
    try {
      const userRole = await UserRole.findOne({
        where: { user_id: userId, role_id: roleId }
      });

      if (userRole) {
        await userRole.update({ is_active: false });
        return true;
      }

      return false;
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
          const { Resource } = await import('../../models/index');
          const resource = await Resource.findOne({
            where: { id: resourceId, created_by: userId }
          });
          return !!resource;
        
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
  async createRole(name: string, description?: string): Promise<Role | null> {
    try {
      const role = await Role.create({
        name,
        description,
        is_active: true
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
  ): Promise<Permission | null> {
    try {
      const permission = await Permission.create({
        name,
        resource,
        action,
        description,
        is_active: true
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