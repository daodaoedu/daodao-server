/**
 * 權限中間件單元測試
 */

import { Request, Response, NextFunction } from 'express';
import {
  requirePermission,
  requireOwnership,
  requireAdmin
} from '@middleware/permission.middleware';
import { ForbiddenError, UnauthorizedError } from '@utils/error-handler';
import { permissionService } from '@services/auth/permission.service';

// Mock permission service
jest.mock('@services/auth/permission.service', () => ({
  permissionService: {
    hasPermission: jest.fn(),
    checkResourceOwnership: jest.fn(),
    isResourceOwner: jest.fn(),
    isAdmin: jest.fn(),
    isSuperAdmin: jest.fn(),
    hasAllPermissions: jest.fn()
  }
}));

// Mock constants
jest.mock('@/constants', () => ({
  PERMISSIONS: {
    USER: {
      READ: 'user:read',
      WRITE: 'user:write'
    }
  },
  ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  }
}));

describe('Permission Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  const mockPermissionService = permissionService as jest.Mocked<typeof permissionService>;

  beforeEach(() => {
    req = {
      user: {
        id: 1,
        external_id: 'test-external-id',
        mongo_id: 'test-mongo-id',
        gender: null,
        language: null,
        education_stage: null,
        tag_list: [],
        contact_id: 1,
        is_open_location: null,
        location_id: null,
        nickname: 'testuser',
        role_id: 1,
        is_open_profile: null,
        birth_date: null,
        basic_info_id: null,
        createdDate: null,
        updatedDate: null,
        created_by: null,
        created_at: new Date(),
        updated_by: null,
        updated_at: new Date(),
        email_verified: true,
        email_verified_at: new Date(),
        is_active: true
      },
      params: {},
      query: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('requirePermission', () => {
    it('should allow access when user has permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(true);
      const middleware = requirePermission({ resource: 'user', action: 'read' });

      await middleware(req as Request, res as Response, next);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(1, 'user', 'read');
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access when user lacks permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);
      const middleware = requirePermission({ resource: 'admin', action: 'write' });

      await middleware(req as Request, res as Response, next);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(1, 'admin', 'write');
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should deny access for unauthenticated user', async () => {
      req.user = undefined;
      const middleware = requirePermission({ resource: 'user', action: 'read' });

      await middleware(req as Request, res as Response, next);

      expect(mockPermissionService.hasPermission).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should deny access for temporary user when not allowed', async () => {
      // For temporary user tests, we would typically use a different user object
      // But since the middleware logic uses user.id to check permissions, we'll modify the existing one
      (req.user as any).isTemp = true;
      const middleware = requirePermission({ resource: 'user', action: 'read' });

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should allow access for temporary user when allowed', async () => {
      // For temporary user tests, we would typically use a different user object
      // But since the middleware logic uses user.id to check permissions, we'll modify the existing one
      (req.user as any).isTemp = true;
      mockPermissionService.hasPermission.mockResolvedValue(true);
      const middleware = requirePermission({ resource: 'user', action: 'read' }, { allowTemp: true });

      await middleware(req as Request, res as Response, next);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(1, 'user', 'read');
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle multiple permissions with requireAll=false', async () => {
      mockPermissionService.hasPermission
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const middleware = requirePermission([
        { resource: 'admin', action: 'read' },
        { resource: 'user', action: 'read' }
      ]);

      await middleware(req as Request, res as Response, next);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle multiple permissions with requireAll=true', async () => {
      mockPermissionService.hasAllPermissions.mockResolvedValue(true);

      const middleware = requirePermission([
        { resource: 'admin', action: 'read' },
        { resource: 'user', action: 'read' }
      ], { requireAll: true });

      await middleware(req as Request, res as Response, next);

      expect(mockPermissionService.hasAllPermissions).toHaveBeenCalledWith(1, ['admin:read', 'user:read']);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireOwnership', () => {
    it('should allow access for resource owner', async () => {
      req.params = { id: '123' };
      mockPermissionService.isAdmin.mockResolvedValue(false);
      mockPermissionService.isResourceOwner.mockResolvedValue(true);
      const middleware = requireOwnership('resource');

      await middleware(req as Request, res as Response, next);

      expect(mockPermissionService.isResourceOwner).toHaveBeenCalledWith(1, 'resource', 123);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for non-owner', async () => {
      req.params = { id: '123' };
      mockPermissionService.isAdmin.mockResolvedValue(false);
      mockPermissionService.isResourceOwner.mockResolvedValue(false);
      const middleware = requireOwnership('resource');

      await middleware(req as Request, res as Response, next);

      expect(mockPermissionService.isResourceOwner).toHaveBeenCalledWith(1, 'resource', 123);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should allow access for admin even if not owner', async () => {
      req.params = { id: '123' };
      mockPermissionService.isAdmin.mockResolvedValue(true);
      const middleware = requireOwnership('resource');

      await middleware(req as Request, res as Response, next);

      expect(mockPermissionService.isAdmin).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for unauthenticated user', async () => {
      req.user = undefined;
      req.params = { id: '123' };
      const middleware = requireOwnership('resource');

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle missing resource ID', async () => {
      req.params = {};
      const middleware = requireOwnership('resource');

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should handle invalid resource ID', async () => {
      req.params = { id: 'invalid-id' };
      const middleware = requireOwnership('resource');

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should use custom ID parameter name', async () => {
      req.params = { resourceId: '456' };
      mockPermissionService.isAdmin.mockResolvedValue(false);
      mockPermissionService.isResourceOwner.mockResolvedValue(true);
      const middleware = requireOwnership('resource', 'resourceId');

      await middleware(req as Request, res as Response, next);

      expect(mockPermissionService.isResourceOwner).toHaveBeenCalledWith(1, 'resource', 456);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin user', async () => {
      mockPermissionService.isAdmin.mockResolvedValue(true);

      await requireAdmin(req as Request, res as Response, next);

      expect(mockPermissionService.isAdmin).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for non-admin user', async () => {
      mockPermissionService.isAdmin.mockResolvedValue(false);

      await requireAdmin(req as Request, res as Response, next);

      expect(mockPermissionService.isAdmin).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should deny access for temporary user', async () => {
      // For temporary user tests, we would typically use a different user object
      // But since the middleware logic uses user.id to check permissions, we'll modify the existing one
      (req.user as any).isTemp = true;

      await requireAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should deny access for unauthenticated user', async () => {
      req.user = undefined;

      await requireAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('Error Handling', () => {
    it('should handle permission service errors', async () => {
      mockPermissionService.hasPermission.mockRejectedValue(new Error('Service error'));
      const middleware = requirePermission({ resource: 'user', action: 'read' });

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle ownership service errors', async () => {
      req.params = { id: '123' };
      mockPermissionService.isAdmin.mockResolvedValue(false);
      mockPermissionService.isResourceOwner.mockRejectedValue(new Error('Service error'));
      const middleware = requireOwnership('resource');

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle admin check errors', async () => {
      mockPermissionService.isAdmin.mockRejectedValue(new Error('Admin check error'));

      await requireAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});