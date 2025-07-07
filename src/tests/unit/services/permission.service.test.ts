/**
 * 權限管理服務單元測試
 */

import { Op } from 'sequelize';
import { PermissionService, permissionService } from '../../../services/auth/permission.service';

// Mock models
jest.mock('../../../models/index', () => ({
  Permission: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  Role: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  User: {
    findByPk: jest.fn()
  },
  UserRole: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  RolePermission: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  Resource: {
    findOne: jest.fn()
  }
}));

describe('Permission Service', () => {
  const {
    Permission,
    Role,
    User,
    UserRole,
    RolePermission,
    Resource
  } = require('../../../models/index');

  let service: PermissionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PermissionService();
  });

  describe('hasPermission', () => {
    it('should return true for super admin', async () => {
      // Mock super admin role check
      UserRole.findAll.mockResolvedValueOnce([{
        role: { name: 'super_admin', is_active: true }
      }]);

      const result = await service.hasPermission(1, 'user', 'read');

      expect(result).toBe(true);
    });

    it('should return true when user has required permission', async () => {
      // Mock non-super admin first
      UserRole.findAll.mockResolvedValueOnce([]);
      
      // Mock permission check
      UserRole.findAll.mockResolvedValueOnce([{
        role: {
          name: 'user',
          is_active: true,
          permissions: [{
            id: 1,
            resource: 'user',
            action: 'read',
            is_active: true
          }]
        }
      }]);

      const result = await service.hasPermission(1, 'user', 'read');

      expect(result).toBe(true);
      expect(UserRole.findAll).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          is_active: true,
          [Op.or]: [
            { expires_at: { [Op.is]: undefined } },
            { expires_at: { [Op.gte]: expect.any(Date) } }
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
              resource: 'user',
              action: 'read',
              is_active: true
            }
          }]
        }]
      });
    });

    it('should return false when user does not have required permission', async () => {
      // Mock non-super admin
      UserRole.findAll.mockResolvedValueOnce([]);
      
      // Mock no matching permissions
      UserRole.findAll.mockResolvedValueOnce([]);

      const result = await service.hasPermission(1, 'admin', 'write');

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      UserRole.findAll.mockRejectedValue(new Error('Database error'));

      const result = await service.hasPermission(1, 'user', 'read');

      expect(result).toBe(false);
    });

    it('should log permission check', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      UserRole.findAll.mockResolvedValue([]);

      await service.hasPermission(1, 'user', 'read');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Checking permission for user:', 1, 'resource:', 'user', 'action:', 'read'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', async () => {
      jest.spyOn(service, 'hasPermission')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const permissions = [
        { resource: 'admin', action: 'read' },
        { resource: 'user', action: 'read' }
      ];

      const result = await service.hasAnyPermission(1, permissions);

      expect(result).toBe(true);
      expect(service.hasPermission).toHaveBeenCalledTimes(2);
    });

    it('should return false when user has no permissions', async () => {
      jest.spyOn(service, 'hasPermission')
        .mockResolvedValue(false);

      const permissions = [
        { resource: 'admin', action: 'read' },
        { resource: 'user', action: 'write' }
      ];

      const result = await service.hasAnyPermission(1, permissions);

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(service, 'hasPermission')
        .mockRejectedValue(new Error('Permission check failed'));

      const permissions = [{ resource: 'user', action: 'read' }];

      const result = await service.hasAnyPermission(1, permissions);

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', async () => {
      UserRole.findOne.mockResolvedValue({
        user_id: 1,
        is_active: true,
        role: { name: 'admin', is_active: true }
      });

      const result = await service.hasRole(1, 'admin');

      expect(result).toBe(true);
      expect(UserRole.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          is_active: true,
          [Op.or]: [
            { expires_at: { [Op.is]: undefined } },
            { expires_at: { [Op.gte]: expect.any(Date) } }
          ]
        },
        include: [{
          model: Role,
          as: 'role',
          where: {
            name: 'admin',
            is_active: true
          }
        }]
      });
    });

    it('should return false when user does not have the role', async () => {
      UserRole.findOne.mockResolvedValue(null);

      const result = await service.hasRole(1, 'admin');

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      UserRole.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.hasRole(1, 'admin');

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has any of the roles', async () => {
      UserRole.findOne.mockResolvedValue({
        user_id: 1,
        is_active: true,
        role: { name: 'user', is_active: true }
      });

      const result = await service.hasAnyRole(1, ['admin', 'user']);

      expect(result).toBe(true);
    });

    it('should return false when user has none of the roles', async () => {
      UserRole.findOne.mockResolvedValue(null);

      const result = await service.hasAnyRole(1, ['admin', 'moderator']);

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all user permissions', async () => {
      const mockPermissions = [
        { id: 1, name: 'user:read', resource: 'user', action: 'read' },
        { id: 2, name: 'user:write', resource: 'user', action: 'write' }
      ];

      UserRole.findAll.mockResolvedValue([
        {
          role: {
            permissions: mockPermissions
          }
        }
      ]);

      const result = await service.getUserPermissions(1);

      expect(result).toEqual(mockPermissions);
    });

    it('should deduplicate permissions from multiple roles', async () => {
      const sharedPermission = { id: 1, name: 'user:read', resource: 'user', action: 'read' };
      const uniquePermission = { id: 2, name: 'user:write', resource: 'user', action: 'write' };

      UserRole.findAll.mockResolvedValue([
        {
          role: {
            permissions: [sharedPermission, uniquePermission]
          }
        },
        {
          role: {
            permissions: [sharedPermission] // Duplicate permission
          }
        }
      ]);

      const result = await service.getUserPermissions(1);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(sharedPermission);
      expect(result).toContainEqual(uniquePermission);
    });

    it('should handle empty permissions', async () => {
      UserRole.findAll.mockResolvedValue([]);

      const result = await service.getUserPermissions(1);

      expect(result).toEqual([]);
    });
  });

  describe('getUserRoles', () => {
    it('should return all user roles', async () => {
      const mockRoles = [
        { id: 1, name: 'admin', is_active: true },
        { id: 2, name: 'user', is_active: true }
      ];

      UserRole.findAll.mockResolvedValue([
        { role: mockRoles[0] },
        { role: mockRoles[1] }
      ]);

      const result = await service.getUserRoles(1);

      expect(result).toEqual(mockRoles);
    });

    it('should handle empty roles', async () => {
      UserRole.findAll.mockResolvedValue([]);

      const result = await service.getUserRoles(1);

      expect(result).toEqual([]);
    });
  });

  describe('assignRole', () => {
    it('should create new role assignment', async () => {
      UserRole.findOne.mockResolvedValue(null);
      UserRole.create.mockResolvedValue({ id: 1, user_id: 1, role_id: 2 });

      const result = await service.assignRole(1, 2, 3);

      expect(result).toBe(true);
      expect(UserRole.create).toHaveBeenCalledWith({
        user_id: 1,
        role_id: 2,
        granted_by: 3,
        granted_at: expect.any(Date),
        is_active: true
      });
    });

    it('should update existing inactive role assignment', async () => {
      const existingUserRole = {
        update: jest.fn().mockResolvedValue(true)
      };
      UserRole.findOne.mockResolvedValue(existingUserRole);

      const result = await service.assignRole(1, 2, 3);

      expect(result).toBe(true);
      expect(existingUserRole.update).toHaveBeenCalledWith({
        is_active: true,
        granted_by: 3,
        granted_at: expect.any(Date)
      });
    });

    it('should handle assignment errors', async () => {
      UserRole.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.assignRole(1, 2, 3);

      expect(result).toBe(false);
    });
  });

  describe('removeRole', () => {
    it('should deactivate existing role assignment', async () => {
      const userRole = {
        update: jest.fn().mockResolvedValue(true)
      };
      UserRole.findOne.mockResolvedValue(userRole);

      const result = await service.removeRole(1, 2);

      expect(result).toBe(true);
      expect(userRole.update).toHaveBeenCalledWith({ is_active: false });
    });

    it('should return false for non-existent role assignment', async () => {
      UserRole.findOne.mockResolvedValue(null);

      const result = await service.removeRole(1, 2);

      expect(result).toBe(false);
    });

    it('should handle removal errors', async () => {
      UserRole.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.removeRole(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('checkResourceOwnership', () => {
    it('should check resource ownership', async () => {
      Resource.findOne.mockResolvedValue({ id: 1, created_by: 1 });

      const result = await service.checkResourceOwnership(1, 'resource', 1);

      expect(result).toBe(true);
      expect(Resource.findOne).toHaveBeenCalledWith({
        where: { id: 1, created_by: 1 }
      });
    });

    it('should check user ownership', async () => {
      const result = await service.checkResourceOwnership(1, 'user', 1);

      expect(result).toBe(true);
    });

    it('should return false for different user', async () => {
      const result = await service.checkResourceOwnership(1, 'user', 2);

      expect(result).toBe(false);
    });

    it('should return false for unknown resource type', async () => {
      const result = await service.checkResourceOwnership(1, 'unknown', 1);

      expect(result).toBe(false);
    });

    it('should handle ownership check errors', async () => {
      Resource.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.checkResourceOwnership(1, 'resource', 1);

      expect(result).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should check super admin role', async () => {
      jest.spyOn(service, 'hasRole').mockResolvedValue(true);

      const result = await service.isSuperAdmin(1);

      expect(result).toBe(true);
      expect(service.hasRole).toHaveBeenCalledWith(1, 'super_admin');
    });

    it('should handle super admin check errors', async () => {
      jest.spyOn(service, 'hasRole').mockRejectedValue(new Error('Check failed'));

      const result = await service.isSuperAdmin(1);

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      jest.spyOn(service, 'hasPermission').mockResolvedValue(true);

      const result = await service.hasAllPermissions(1, ['user:read', 'user:write']);

      expect(result).toBe(true);
      expect(service.hasPermission).toHaveBeenCalledWith(1, 'user', 'read');
      expect(service.hasPermission).toHaveBeenCalledWith(1, 'user', 'write');
    });

    it('should return false when user missing any permission', async () => {
      jest.spyOn(service, 'hasPermission')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.hasAllPermissions(1, ['user:read', 'admin:write']);

      expect(result).toBe(false);
    });

    it('should handle permission check errors', async () => {
      jest.spyOn(service, 'hasPermission').mockRejectedValue(new Error('Check failed'));

      const result = await service.hasAllPermissions(1, ['user:read']);

      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', async () => {
      jest.spyOn(service, 'getUserRoles').mockResolvedValue([
        { id: 1, name: 'admin', is_active: true } as any
      ]);

      const result = await service.isAdmin(1);

      expect(result).toBe(true);
    });

    it('should return true for super admin role', async () => {
      jest.spyOn(service, 'getUserRoles').mockResolvedValue([
        { id: 1, name: 'super_admin', is_active: true } as any
      ]);

      const result = await service.isAdmin(1);

      expect(result).toBe(true);
    });

    it('should return false for non-admin roles', async () => {
      jest.spyOn(service, 'getUserRoles').mockResolvedValue([
        { id: 1, name: 'user', is_active: true } as any
      ]);

      const result = await service.isAdmin(1);

      expect(result).toBe(false);
    });
  });

  describe('createRole', () => {
    it('should create new role', async () => {
      const mockRole = { id: 1, name: 'new_role', description: 'New Role' };
      Role.create.mockResolvedValue(mockRole);

      const result = await service.createRole('new_role', 'New Role');

      expect(result).toEqual(mockRole);
      expect(Role.create).toHaveBeenCalledWith({
        name: 'new_role',
        description: 'New Role',
        is_active: true
      });
    });

    it('should handle role creation errors', async () => {
      Role.create.mockRejectedValue(new Error('Creation failed'));

      const result = await service.createRole('new_role');

      expect(result).toBeNull();
    });
  });

  describe('createPermission', () => {
    it('should create new permission', async () => {
      const mockPermission = {
        id: 1,
        name: 'user:read',
        resource: 'user',
        action: 'read',
        description: 'Read users'
      };
      Permission.create.mockResolvedValue(mockPermission);

      const result = await service.createPermission('user:read', 'user', 'read', 'Read users');

      expect(result).toEqual(mockPermission);
      expect(Permission.create).toHaveBeenCalledWith({
        name: 'user:read',
        resource: 'user',
        action: 'read',
        description: 'Read users',
        is_active: true
      });
    });

    it('should handle permission creation errors', async () => {
      Permission.create.mockRejectedValue(new Error('Creation failed'));

      const result = await service.createPermission('user:read', 'user', 'read');

      expect(result).toBeNull();
    });
  });

  describe('Service Instance', () => {
    it('should export permissionService instance', () => {
      expect(permissionService).toBeInstanceOf(PermissionService);
    });

    it('should have all methods available', () => {
      expect(typeof permissionService.hasPermission).toBe('function');
      expect(typeof permissionService.hasAnyPermission).toBe('function');
      expect(typeof permissionService.hasRole).toBe('function');
      expect(typeof permissionService.hasAnyRole).toBe('function');
      expect(typeof permissionService.getUserPermissions).toBe('function');
      expect(typeof permissionService.getUserRoles).toBe('function');
      expect(typeof permissionService.assignRole).toBe('function');
      expect(typeof permissionService.removeRole).toBe('function');
      expect(typeof permissionService.checkResourceOwnership).toBe('function');
      expect(typeof permissionService.isSuperAdmin).toBe('function');
      expect(typeof permissionService.hasAllPermissions).toBe('function');
      expect(typeof permissionService.isAdmin).toBe('function');
      expect(typeof permissionService.createRole).toBe('function');
      expect(typeof permissionService.createPermission).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex permission check scenario', async () => {
      // Mock user with admin role and multiple permissions
      UserRole.findAll
        .mockResolvedValueOnce([]) // Not super admin
        .mockResolvedValueOnce([{
          role: {
            name: 'admin',
            is_active: true,
            permissions: [
              { id: 1, resource: 'user', action: 'read', is_active: true },
              { id: 2, resource: 'user', action: 'write', is_active: true }
            ]
          }
        }]);

      const hasRead = await service.hasPermission(1, 'user', 'read');
      const hasWrite = await service.hasPermission(1, 'user', 'write');
      const hasDelete = await service.hasPermission(1, 'user', 'delete');

      expect(hasRead).toBe(true);
      expect(hasWrite).toBe(true);
      expect(hasDelete).toBe(false);
    });
  });
});