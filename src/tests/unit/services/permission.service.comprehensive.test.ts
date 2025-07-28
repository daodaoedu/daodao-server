/**
 * Permission Service 全面單元測試
 * 測試權限管理服務的所有功能
 */

// Mock Prisma service
jest.mock('../../../services/database/prisma.service', () => ({
  prisma: {
    $transaction: jest.fn(),
    permissions: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn()
    },
    roles: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn()
    },
    users: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    user_permissions: {
      findMany: jest.fn()
    },
    resources: {
      findUnique: jest.fn()
    }
  }
}));

import { PermissionService, permissionService } from '../../../services/auth/permission.service';
import { prisma } from '../../../services/database/prisma.service';

describe('Permission Service Comprehensive Tests', () => {
  let service: PermissionService;
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PermissionService();
  });

  describe('hasPermission', () => {
    const userId = 1;
    const resource = 'user';
    const action = 'read';

    it('should return true for super admin', async () => {
      // Mock super admin user
      const mockUser = {
        id: 1,
        roles: {
          name: 'super_admin',
          role_permissions: []
        }
      };

      mockPrisma.users.findUnique
        .mockResolvedValueOnce(mockUser as any) // For isSuperAdmin check
        .mockResolvedValueOnce(mockUser as any); // For hasRole check

      const result = await service.hasPermission(userId, resource, action);

      expect(result).toBe(true);
    });

    it('should return true when user has role permission', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'user',
          role_permissions: [
            {
              permissions: {
                id: 1,
                name: 'user:read'
              }
            }
          ]
        }
      };

      // Mock for isSuperAdmin check (hasRole call) - return non-super admin
      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ id: 1, roles: { name: 'user' } } as any) // For isSuperAdmin -> hasRole (not super_admin)
        .mockResolvedValueOnce(mockUser as any); // For actual permission check

      const result = await service.hasPermission(userId, resource, action);

      expect(result).toBe(true);
      // Verify that the service was called with the correct parameters
      expect(mockPrisma.users.findUnique).toHaveBeenCalled();
    });

    it('should return true when user has direct permission', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'user',
          role_permissions: []
        }
      };

      const mockUserPermissions = [
        {
          permissions: {
            id: 1,
            name: 'user:read'
          }
        }
      ];

      // Mock for isSuperAdmin check (hasRole call) - return non-super admin
      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ id: 1, roles: { name: 'user' } } as any) // For isSuperAdmin -> hasRole (not super_admin)
        .mockResolvedValueOnce(mockUser as any); // For actual permission check
      
      mockPrisma.user_permissions.findMany.mockResolvedValue(mockUserPermissions as any);

      const result = await service.hasPermission(userId, resource, action);

      expect(result).toBe(true);
      // Verify that the service was called and returned the correct result
      expect(mockPrisma.users.findUnique).toHaveBeenCalled();
    });

    it('should return false when user has no permission', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'user',
          role_permissions: []
        }
      };

      // Mock for isSuperAdmin check (hasRole call) - return non-super admin
      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ id: 1, roles: { name: 'user' } } as any) // For isSuperAdmin -> hasRole (not super_admin)
        .mockResolvedValueOnce(mockUser as any); // For actual permission check
      
      mockPrisma.user_permissions.findMany.mockResolvedValue([]);

      const result = await service.hasPermission(userId, resource, action);

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const result = await service.hasPermission(userId, resource, action);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.users.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await service.hasPermission(userId, resource, action);

      expect(result).toBe(false);
    });

    it('should handle user with null roles', async () => {
      const mockUser = {
        id: 1,
        roles: null
      };

      // Mock for isSuperAdmin check (hasRole call) - return user with null roles
      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ id: 1, roles: null } as any) // For isSuperAdmin -> hasRole (null roles)
        .mockResolvedValueOnce(mockUser as any); // For actual permission check
      
      mockPrisma.user_permissions.findMany.mockResolvedValue([]);

      const result = await service.hasPermission(userId, resource, action);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    const userId = 1;
    const permissions = [
      { resource: 'user', action: 'read' },
      { resource: 'user', action: 'write' }
    ];

    it('should return true if user has any of the permissions', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'user',
          role_permissions: [
            {
              permissions: {
                id: 1,
                name: 'user:read'
              }
            }
          ]
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.hasAnyPermission(userId, permissions);

      expect(result).toBe(true);
    });

    it('should return false if user has none of the permissions', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'user',
          role_permissions: [
            {
              permissions: {
                id: 1,
                name: 'other:permission'
              }
            }
          ]
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user_permissions.findMany.mockResolvedValue([]);

      const result = await service.hasAnyPermission(userId, permissions);

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.users.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await service.hasAnyPermission(userId, permissions);

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    const userId = 1;
    const roleName = 'admin';

    it('should return true when user has the role', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'admin'
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.hasRole(userId, roleName);

      expect(result).toBe(true);
      expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { roles: true }
      });
    });

    it('should return false when user has different role', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'user'
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.hasRole(userId, roleName);

      expect(result).toBe(false);
    });

    it('should return false when user has no roles', async () => {
      const mockUser = {
        id: 1,
        roles: null
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.hasRole(userId, roleName);

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const result = await service.hasRole(userId, roleName);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    const userId = 1;
    const roleNames = ['admin', 'moderator'];

    it('should return true when user has any of the roles', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'admin'
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.hasAnyRole(userId, roleNames);

      expect(result).toBe(true);
    });

    it('should return false when user has none of the roles', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'user'
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.hasAnyRole(userId, roleNames);

      expect(result).toBe(false);
    });

    it('should handle empty role names array', async () => {
      const result = await service.hasAnyRole(userId, []);

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    const userId = 1;

    it('should return combined role and direct permissions', async () => {
      const mockUser = {
        id: 1,
        roles: {
          role_permissions: [
            {
              permissions: {
                id: 1,
                name: 'user:read'
              }
            }
          ]
        }
      };

      const mockUserPermissions = [
        {
          permissions: {
            id: 2,
            name: 'user:write'
          }
        }
      ];

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user_permissions.findMany.mockResolvedValue(mockUserPermissions as any);

      const result = await service.getUserPermissions(userId);

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 1, name: 'user:read' }),
          expect.objectContaining({ id: 2, name: 'user:write' })
        ])
      );
    });

    it('should deduplicate permissions', async () => {
      const mockUser = {
        id: 1,
        roles: {
          role_permissions: [
            {
              permissions: {
                id: 1,
                name: 'user:read'
              }
            }
          ]
        }
      };

      const mockUserPermissions = [
        {
          permissions: {
            id: 1, // Same permission ID
            name: 'user:read'
          }
        }
      ];

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user_permissions.findMany.mockResolvedValue(mockUserPermissions as any);

      const result = await service.getUserPermissions(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ id: 1, name: 'user:read' }));
    });

    it('should return empty array when user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const result = await service.getUserPermissions(userId);

      expect(result).toEqual([]);
    });

    it('should handle user with no roles or permissions', async () => {
      const mockUser = {
        id: 1,
        roles: null
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user_permissions.findMany.mockResolvedValue([]);

      const result = await service.getUserPermissions(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserRoles', () => {
    const userId = 1;

    it('should return user roles', async () => {
      const mockUser = {
        id: 1,
        roles: {
          id: 1,
          name: 'admin'
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.getUserRoles(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ id: 1, name: 'admin' }));
    });

    it('should return empty array when user has no roles', async () => {
      const mockUser = {
        id: 1,
        roles: null
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.getUserRoles(userId);

      expect(result).toEqual([]);
    });

    it('should return empty array when user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const result = await service.getUserRoles(userId);

      expect(result).toEqual([]);
    });
  });

  describe('assignRole', () => {
    const userId = 1;
    const roleId = 2;

    it('should successfully assign role to user', async () => {
      const mockUpdatedUser = {
        id: 1,
        role_id: 2
      };

      mockPrisma.users.update.mockResolvedValue(mockUpdatedUser as any);

      const result = await service.assignRole(userId, roleId);

      expect(result).toBe(true);
      expect(mockPrisma.users.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { role_id: roleId }
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.users.update.mockRejectedValue(new Error('Update failed'));

      const result = await service.assignRole(userId, roleId);

      expect(result).toBe(false);
    });

    it('should handle optional grantedBy parameter', async () => {
      const grantedBy = 3;
      mockPrisma.users.update.mockResolvedValue({} as any);

      const result = await service.assignRole(userId, roleId, grantedBy);

      expect(result).toBe(true);
      expect(mockPrisma.users.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { role_id: roleId }
      });
    });
  });

  describe('removeRole', () => {
    const userId = 1;
    const roleId = 2;

    it('should return true (simplified implementation)', async () => {
      const result = await service.removeRole(userId, roleId);

      expect(result).toBe(true);
    });
  });

  describe('checkResourceOwnership', () => {
    const userId = 1;

    it('should return true for resource owner', async () => {
      const mockResource = {
        id: 1,
        created_by: 1
      };

      mockPrisma.resources.findUnique.mockResolvedValue(mockResource as any);

      const result = await service.checkResourceOwnership(userId, 'resource', 1);

      expect(result).toBe(true);
      expect(mockPrisma.resources.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return false for non-owner', async () => {
      const mockResource = {
        id: 1,
        created_by: 2
      };

      mockPrisma.resources.findUnique.mockResolvedValue(mockResource as any);

      const result = await service.checkResourceOwnership(userId, 'resource', 1);

      expect(result).toBe(false);
    });

    it('should return true for user checking own profile', async () => {
      const result = await service.checkResourceOwnership(userId, 'user', userId);

      expect(result).toBe(true);
    });

    it('should return false for unknown resource type', async () => {
      const result = await service.checkResourceOwnership(userId, 'unknown', 1);

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      mockPrisma.resources.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await service.checkResourceOwnership(userId, 'resource', 1);

      expect(result).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    const userId = 1;

    it('should return true for super admin', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'super_admin'
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.isSuperAdmin(userId);

      expect(result).toBe(true);
    });

    it('should return false for non-super admin', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'admin'
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.isSuperAdmin(userId);

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    const userId = 1;
    const permissions = ['user:read', 'user:write'];

    it('should return true when user has all permissions', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'admin',
          role_permissions: [
            {
              permissions: { id: 1, name: 'user:read' }
            },
            {
              permissions: { id: 2, name: 'user:write' }
            }
          ]
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.hasAllPermissions(userId, permissions);

      expect(result).toBe(true);
    });

    it('should return false when user lacks any permission', async () => {
      const mockUser = {
        id: 1,
        roles: {
          name: 'user',
          role_permissions: [
            {
              permissions: { id: 1, name: 'user:read' }
            }
          ]
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user_permissions.findMany.mockResolvedValue([]);

      const result = await service.hasAllPermissions(userId, permissions);

      expect(result).toBe(false);
    });

    it('should handle empty permissions array', async () => {
      const result = await service.hasAllPermissions(userId, []);

      expect(result).toBe(true);
    });

    it('should handle malformed permission strings', async () => {
      const malformedPermissions = ['invalid-permission'];

      const result = await service.hasAllPermissions(userId, malformedPermissions);

      // Should handle gracefully
      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    const userId = 1;

    it('should return true for admin user', async () => {
      const mockUser = {
        id: 1,
        roles: {
          id: 1,
          name: 'admin'
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.isAdmin(userId);

      expect(result).toBe(true);
    });

    it('should return true for super admin user', async () => {
      const mockUser = {
        id: 1,
        roles: {
          id: 1,
          name: 'super_admin'
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.isAdmin(userId);

      expect(result).toBe(true);
    });

    it('should return false for regular user', async () => {
      const mockUser = {
        id: 1,
        roles: {
          id: 1,
          name: 'user'
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.isAdmin(userId);

      expect(result).toBe(false);
    });
  });

  describe('createRole', () => {
    it('should create new role successfully', async () => {
      const mockRole = {
        id: 1,
        name: 'new_role',
        description: 'New role description'
      };

      mockPrisma.roles.create.mockResolvedValue(mockRole as any);

      const result = await service.createRole('new_role', 'New role description');

      expect(result).toEqual(mockRole);
      expect(mockPrisma.roles.create).toHaveBeenCalledWith({
        data: {
          name: 'new_role',
          description: 'New role description'
        }
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.roles.create.mockRejectedValue(new Error('Creation failed'));

      const result = await service.createRole('new_role');

      expect(result).toBeNull();
    });

    it('should create role without description', async () => {
      const mockRole = {
        id: 1,
        name: 'simple_role',
        description: undefined
      };

      mockPrisma.roles.create.mockResolvedValue(mockRole as any);

      const result = await service.createRole('simple_role');

      expect(result).toEqual(mockRole);
      expect(mockPrisma.roles.create).toHaveBeenCalledWith({
        data: {
          name: 'simple_role',
          description: undefined
        }
      });
    });
  });

  describe('createPermission', () => {
    it('should create new permission successfully', async () => {
      const mockPermission = {
        id: 1,
        name: 'new:permission',
        description: 'New permission description'
      };

      mockPrisma.permissions.create.mockResolvedValue(mockPermission as any);

      const result = await service.createPermission(
        'new:permission', 
        'new', 
        'permission', 
        'New permission description'
      );

      expect(result).toEqual(mockPermission);
      expect(mockPrisma.permissions.create).toHaveBeenCalledWith({
        data: {
          name: 'new:permission',
          description: 'New permission description'
        }
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.permissions.create.mockRejectedValue(new Error('Creation failed'));

      const result = await service.createPermission('new:permission', 'new', 'permission');

      expect(result).toBeNull();
    });
  });

  describe('Singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(permissionService).toBeInstanceOf(PermissionService);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle hierarchical permission checks', async () => {
      const userId = 1;

      // Mock super admin check
      const mockSuperAdminUser = {
        id: 1,
        roles: {
          name: 'super_admin',
          role_permissions: []
        }
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockSuperAdminUser as any);

      const hasUserRead = await service.hasPermission(userId, 'user', 'read');
      const hasResourceWrite = await service.hasPermission(userId, 'resource', 'write');
      const hasAdminAccess = await service.hasPermission(userId, 'admin', 'access');

      expect(hasUserRead).toBe(true);
      expect(hasResourceWrite).toBe(true);
      expect(hasAdminAccess).toBe(true);
    });

    it('should handle complex permission combinations', async () => {
      const userId = 1;
      const permissions = [
        { resource: 'user', action: 'read' },
        { resource: 'resource', action: 'write' },
        { resource: 'admin', action: 'access' }
      ];

      const mockUser = {
        id: 1,
        roles: {
          name: 'moderator',
          role_permissions: [
            {
              permissions: { id: 1, name: 'user:read' }
            }
          ]
        }
      };

      const mockUserPermissions = [
        {
          permissions: { id: 2, name: 'resource:write' }
        }
      ];

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user_permissions.findMany.mockResolvedValue(mockUserPermissions as any);

      const hasAny = await service.hasAnyPermission(userId, permissions);
      expect(hasAny).toBe(true);
    });
  });
});