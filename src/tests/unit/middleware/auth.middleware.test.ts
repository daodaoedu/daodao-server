/**
 * 認證中間件單元測試
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  authenticateJWT,
  authenticate,
  optionalAuth,
  authorizeRoles,
  requireRole,
  authenticateWithOptions,
  requirePermissions,
  requireFormalUser,
  authenticateSession,
  authenticateAny
} from '../../../middleware/auth';
import { 
  UnauthorizedError, 
  ForbiddenError 
} from '../../../utils/error-handler';
import { AuthRequest } from '../../../types/auth.types';

// Mock JWT secret
const mockJwtSecret = 'test-jwt-secret';

describe('Auth Middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
    process.env.JWT_SECRET = mockJwtSecret;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    req = {
      headers: {},
      user: undefined,
      isTemporary: false
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('authenticateJWT', () => {
    it('should authenticate valid JWT token', () => {
      const payload = { id: 1, username: 'testuser', email: 'test@example.com' };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };

      authenticateJWT(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(payload.id);
      expect(req.user?.username).toBe(payload.username);
      expect(req.isTemporary).toBe(false);
    });

    it('should handle temporary user flag', () => {
      const payload = { id: 1, username: 'testuser', isTemp: true };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };

      authenticateJWT(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.isTemporary).toBe(true);
    });

    it('should return error for missing token', () => {
      req.headers = {};

      authenticateJWT(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(req.user).toBeUndefined();
    });

    it('should return error for invalid token', () => {
      req.headers = { authorization: 'Bearer invalid-token' };

      authenticateJWT(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(req.user).toBeUndefined();
    });

    it('should return error for expired token', () => {
      const payload = { id: 1, username: 'testuser' };
      const expiredToken = jwt.sign(payload, mockJwtSecret, { expiresIn: '-1s' });
      
      req.headers = { authorization: `Bearer ${expiredToken}` };

      authenticateJWT(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(req.user).toBeUndefined();
    });

    it('should handle missing JWT secret', () => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_SECURITY;

      const payload = { id: 1, username: 'testuser' };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };

      authenticateJWT(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      
      // Restore JWT secret
      process.env.JWT_SECRET = mockJwtSecret;
    });

    it('should handle malformed authorization header', () => {
      req.headers = { authorization: 'InvalidFormat' };

      authenticateJWT(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(req.user).toBeUndefined();
    });

    it('should handle non-object token payload', () => {
      // Create a token with a string payload (which shouldn't happen in practice)
      const token = jwt.sign('string-payload', mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };

      authenticateJWT(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(req.user).toBeUndefined();
    });
  });

  describe('authenticate (alias)', () => {
    it('should be an alias for authenticateJWT', () => {
      expect(authenticate).toBe(authenticateJWT);
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate valid token', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };

      optionalAuth(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(payload.id);
    });

    it('should continue without token', () => {
      req.headers = {};

      optionalAuth(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });

    it('should continue with invalid token', () => {
      req.headers = { authorization: 'Bearer invalid-token' };

      optionalAuth(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });

    it('should continue with expired token', () => {
      const payload = { id: 1, username: 'testuser' };
      const expiredToken = jwt.sign(payload, mockJwtSecret, { expiresIn: '-1s' });
      
      req.headers = { authorization: `Bearer ${expiredToken}` };

      optionalAuth(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });
  });

  describe('authorizeRoles', () => {
    it('should allow user with required role', () => {
      req.user = { id: 1, username: 'testuser', roles: ['admin', 'user'] };
      const middleware = authorizeRoles(['admin']);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow user with any of required roles', () => {
      req.user = { id: 1, username: 'testuser', roles: ['user'] };
      const middleware = authorizeRoles(['admin', 'user']);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject user without required role', () => {
      req.user = { id: 1, username: 'testuser', roles: ['user'] };
      const middleware = authorizeRoles(['admin']);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject user without any roles', () => {
      req.user = { id: 1, username: 'testuser', roles: [] };
      const middleware = authorizeRoles(['admin']);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject unauthenticated user', () => {
      req.user = undefined;
      const middleware = authorizeRoles(['admin']);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle user without roles property', () => {
      req.user = { id: 1, username: 'testuser' };
      const middleware = authorizeRoles(['admin']);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('requireRole (alias)', () => {
    it('should be an alias for authorizeRoles', () => {
      expect(requireRole).toBe(authorizeRoles);
    });
  });

  describe('authenticateWithOptions', () => {
    it('should authenticate with default options', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };
      const middleware = authenticateWithOptions();

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
    });

    it('should allow optional authentication', () => {
      req.headers = {};
      const middleware = authenticateWithOptions({ required: false });

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });

    it('should reject temporary user when not allowed', () => {
      const payload = { id: 1, username: 'testuser', isTemp: true };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };
      const middleware = authenticateWithOptions({ allowTemp: false });

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should check required roles', () => {
      const payload = { id: 1, username: 'testuser', roles: ['user'] };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };
      const middleware = authenticateWithOptions({ roles: ['admin'] });

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should check required permissions', () => {
      const payload = { 
        id: 1, 
        username: 'testuser', 
        permissions: ['user:read'] 
      };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };
      const middleware = authenticateWithOptions({ 
        permissions: [{ resource: 'admin', action: 'write' }] 
      });

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should pass with all required permissions', () => {
      const payload = { 
        id: 1, 
        username: 'testuser', 
        permissions: ['user:read', 'user:write'] 
      };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };
      const middleware = authenticateWithOptions({ 
        permissions: [{ resource: 'user', action: 'read' }] 
      });

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle token errors when not required', () => {
      req.headers = { authorization: 'Bearer invalid-token' };
      const middleware = authenticateWithOptions({ required: false });

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });
  });

  describe('requirePermissions', () => {
    it('should allow user with required permissions', () => {
      req.user = { 
        id: 1, 
        username: 'testuser', 
        permissions: ['user:read', 'user:write'] 
      };
      const middleware = requirePermissions([
        { resource: 'user', action: 'read' }
      ]);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject user without required permissions', () => {
      req.user = { 
        id: 1, 
        username: 'testuser', 
        permissions: ['user:read'] 
      };
      const middleware = requirePermissions([
        { resource: 'user', action: 'write' }
      ]);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should reject temporary user when not allowed', () => {
      req.user = { 
        id: 1, 
        username: 'testuser', 
        permissions: ['user:read'] 
      };
      req.isTemporary = true;
      const middleware = requirePermissions([
        { resource: 'user', action: 'read', allowTemp: false }
      ]);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should allow temporary user when allowed', () => {
      req.user = { 
        id: 1, 
        username: 'testuser', 
        permissions: ['user:read'] 
      };
      req.isTemporary = true;
      const middleware = requirePermissions([
        { resource: 'user', action: 'read', allowTemp: true }
      ]);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject unauthenticated user', () => {
      req.user = undefined;
      const middleware = requirePermissions([
        { resource: 'user', action: 'read' }
      ]);

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('requireFormalUser', () => {
    it('should allow formal user', () => {
      req.user = { id: 1, username: 'testuser' };
      req.isTemporary = false;

      requireFormalUser(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject temporary user', () => {
      req.user = { id: 1, username: 'testuser' };
      req.isTemporary = true;

      requireFormalUser(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should reject unauthenticated user', () => {
      req.user = undefined;

      requireFormalUser(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('authenticateSession', () => {
    it('should authenticate valid session', () => {
      (req as any).isAuthenticated = jest.fn().mockReturnValue(true);
      (req as any).user = { dataValues: { id: 1 } };

      authenticateSession(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect((req as AuthRequest).isTemporary).toBe(false);
    });

    it('should identify temporary user', () => {
      (req as any).isAuthenticated = jest.fn().mockReturnValue(true);
      (req as any).user = { id: 1 }; // No dataValues = temporary user

      authenticateSession(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect((req as AuthRequest).isTemporary).toBe(true);
    });

    it('should reject unauthenticated session', () => {
      (req as any).isAuthenticated = jest.fn().mockReturnValue(false);

      authenticateSession(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle missing isAuthenticated method', () => {
      authenticateSession(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('authenticateAny', () => {
    it('should authenticate with JWT token', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };

      authenticateAny(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect((req as AuthRequest).user).toBeDefined();
    });

    it('should authenticate with session', () => {
      req.headers = {};
      (req as any).isAuthenticated = jest.fn().mockReturnValue(true);
      (req as any).user = { dataValues: { id: 1 } };

      authenticateAny(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect((req as AuthRequest).isTemporary).toBe(false);
    });

    it('should reject when no authentication method available', () => {
      req.headers = {};
      (req as any).isAuthenticated = jest.fn().mockReturnValue(false);

      authenticateAny(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should prioritize JWT over session', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };
      (req as any).isAuthenticated = jest.fn().mockReturnValue(true);
      (req as any).user = { dataValues: { id: 2 } };

      authenticateAny(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect((req as AuthRequest).user?.id).toBe(1); // JWT user, not session user
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete authentication flow', () => {
      const payload = { 
        id: 1, 
        username: 'testuser', 
        email: 'test@example.com',
        roles: ['admin'],
        permissions: ['user:read', 'user:write']
      };
      const token = jwt.sign(payload, mockJwtSecret);
      
      req.headers = { authorization: `Bearer ${token}` };

      // First authenticate
      authenticateJWT(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenLastCalledWith();
      expect(req.user).toBeDefined();

      // Then check roles
      next.mockClear();
      const roleMiddleware = authorizeRoles(['admin']);
      roleMiddleware(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenLastCalledWith();

      // Then check permissions
      next.mockClear();
      const permissionMiddleware = requirePermissions([
        { resource: 'user', action: 'read' }
      ]);
      permissionMiddleware(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenLastCalledWith();
    });

    it('should handle authentication failure chain', () => {
      req.headers = { authorization: 'Bearer invalid-token' };

      // Authentication should fail
      authenticateJWT(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(req.user).toBeUndefined();

      // Role check should fail for unauthenticated user
      next.mockClear();
      const roleMiddleware = authorizeRoles(['admin']);
      roleMiddleware(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
});