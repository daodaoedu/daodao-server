/**
 * Auth Controller Unit Tests
 * Professional rewrite version - Testing actual controller logic
 */

import { Request, Response, NextFunction } from 'express';
import { 
  login, 
  register, 
  googleCallback, 
  logout, 
  refreshToken, 
  getCurrentUser, 
  forgotPassword, 
  resetPassword, 
  verifyEmail 
} from '@/controllers/auth.controller';

// Mock dependencies directly
jest.mock('@/services/jwt.service');
jest.mock('@/services/auth/email.service');
jest.mock('@/services/auth/auth.service');
jest.mock('@/services/database/prisma.service', () => ({
  prisma: {
    temp_users: {
      findUnique: jest.fn()
    }
  }
}));

import { jwtService } from '@/services/jwt.service';
import { emailService } from '@/services/auth/email.service';
import { authService } from '@/services/auth/auth.service';
import { prisma } from '@/services/database/prisma.service';
import { 
  UnauthorizedError, 
  NotFoundError, 
  BadRequestError 
} from '@/utils/error-handler';

describe('Auth Controller - Professional Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Basic request mock
    mockReq = {
      body: {},
      headers: {},
      user: undefined
    };

    // Basic response mock
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis()
    };

    // Next function mock that can handle errors from asyncWrapper
    mockNext = jest.fn();

    // Set environment variables
    process.env.FRONTEND_URL = 'http://localhost:3000';

    // Setup default service mocks with proper implementations
    (jwtService.generateToken as jest.Mock).mockReturnValue('mock-jwt-token');
    (jwtService.verifyToken as jest.Mock).mockReturnValue({ error: null });
    (jwtService.refreshToken as jest.Mock).mockReturnValue('new-token');
    
    (authService.getUserRoles as jest.Mock).mockResolvedValue([]);
    (authService.getUserPermissions as jest.Mock).mockResolvedValue([]);
    (authService.findUserByExternalId as jest.Mock).mockResolvedValue(null);
    (authService.verifyUserEmail as jest.Mock).mockResolvedValue(undefined);
    
    (emailService.sendWelcomeEmail as jest.Mock).mockResolvedValue({ success: true, messageId: 'test-id' });
    
    // Setup Prisma mock
    (prisma.temp_users.findUnique as jest.Mock).mockResolvedValue(null);
  });

  describe('login', () => {
    it('should reject password login and return OAuth error', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password' };

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '請使用 Google 登入',
          statusCode: 401
        })
      );
    });
  });

  describe('register', () => {
    it('should reject registration and return unavailable error', async () => {
      mockReq.body = { 
        email: 'test@example.com', 
        password: 'password',
        name: 'Test User'
      };

      await register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '註冊功能暫時不可用，請使用 Google 登入',
          statusCode: 400
        })
      );
    });
  });

  describe('googleCallback', () => {
    beforeEach(() => {
      // Override with specific values for googleCallback tests
      (authService.getUserRoles as jest.Mock).mockResolvedValue([
        { name: 'user' }
      ]);
      (authService.getUserPermissions as jest.Mock).mockResolvedValue([
        { name: 'user:read' }
      ]);
    });

    it('should handle formal user callback (with external_id)', async () => {
      // Set formal user data
      mockReq.user = {
        id: 123,
        external_id: 'google-user-123',
        name: 'John Doe'
      } as unknown as Express.User;

      // Mock service responses with proper structure
      (authService.getUserRoles as jest.Mock).mockResolvedValue([
        { name: 'user' }
      ]);
      (authService.getUserPermissions as jest.Mock).mockResolvedValue([
        { name: 'user:read' }
      ]);

      // Execute the controller function
      await googleCallback(mockReq as Request, mockRes as Response, mockNext);

      // Wait for all promises to resolve
      await new Promise(setImmediate);

      // Verify no errors were passed to next
      expect(mockNext).not.toHaveBeenCalled();
      
      // Verify JWT generation parameters
      expect(jwtService.generateToken).toHaveBeenCalledWith({
        id: 123,
        _id: 'google-user-123',
        username: 'John Doe',
        isTemp: false,
        roles: ['user'],
        permissions: ['user:read']
      });

      // Verify redirect
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mock-jwt-token'
      );

      // Verify service calls
      expect(authService.getUserRoles).toHaveBeenCalledWith(123);
      expect(authService.getUserPermissions).toHaveBeenCalledWith(123);
    });

    it('should handle temporary user callback (without external_id)', async () => {
      // Set temporary user data (no external_id)
      mockReq.user = {
        id: 456,
        name: 'Temp User'
      } as unknown as Express.User;

      await googleCallback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      
      expect(jwtService.generateToken).toHaveBeenCalledWith({
        id: 456,
        _id: undefined,
        username: 'Temp User',
        isTemp: true,
        roles: [],
        permissions: []
      });

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mock-jwt-token'
      );

      // Temporary users should not call role/permission services
      expect(authService.getUserRoles).not.toHaveBeenCalled();
      expect(authService.getUserPermissions).not.toHaveBeenCalled();
    });

    it('should handle missing user data', async () => {
      mockReq.user = undefined;

      await googleCallback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Google 認證失敗',
          statusCode: 401
        })
      );
    });

    it('should handle role/permission service errors', async () => {
      mockReq.user = {
        id: 123,
        external_id: 'google-user-123',
        name: 'John Doe'
      } as unknown as Express.User;

      // Mock services throwing errors
      (authService.getUserRoles as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );
      (authService.getUserPermissions as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await googleCallback(mockReq as Request, mockRes as Response, mockNext);

      // Should continue execution but with empty roles/permissions
      expect(mockNext).not.toHaveBeenCalled();
      expect(jwtService.generateToken).toHaveBeenCalledWith({
        id: 123,
        _id: 'google-user-123',
        username: 'John Doe',
        isTemp: false,
        roles: [],
        permissions: []
      });
    });

    it('should handle missing environment variable', async () => {
      delete process.env.FRONTEND_URL;
      
      mockReq.user = {
        id: 123,
        external_id: 'google-user-123',
        name: 'John Doe'
      } as unknown as Express.User;

      // Mock service responses
      (authService.getUserRoles as jest.Mock).mockResolvedValue([
        { name: 'user' }
      ]);
      (authService.getUserPermissions as jest.Mock).mockResolvedValue([
        { name: 'user:read' }
      ]);

      await googleCallback(mockReq as Request, mockRes as Response, mockNext);
      
      // Wait for all promises to resolve
      await new Promise(setImmediate);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'undefined/auth/callback?token=mock-jwt-token'
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      await logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '登出成功'
      });
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      mockReq.headers = { authorization: 'Bearer old-token' };
      (jwtService.refreshToken as jest.Mock).mockReturnValue('new-token');

      await refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(jwtService.refreshToken).toHaveBeenCalledWith('old-token');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '令牌刷新成功',
        token: 'new-token'
      });
    });

    it('should handle missing authorization header', async () => {
      mockReq.headers = {};

      await refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
    });

    it('should handle refresh failure', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      (jwtService.refreshToken as jest.Mock).mockReturnValue(null);

      await refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(() => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
    });

    it('should get current formal user info', async () => {
      // Setup request with proper authorization header
      mockReq.headers = { authorization: 'Bearer valid-token' };
      
      const mockUser = {
        id: 1,
        name: 'Test User',
        nickname: 'Test User',
        contacts: { email: 'test@example.com' },
        photo_url: '',
        is_active: true,
        email_verified: false,
        email_verified_at: null
      };

      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        _id: 'user-external-id',
        isTemp: false,
        error: null
      });
      (authService.findUserByExternalId as jest.Mock).mockResolvedValue(mockUser);
      (authService.getUserRoles as jest.Mock).mockResolvedValue([{ name: 'user' }]);
      (authService.getUserPermissions as jest.Mock).mockResolvedValue([{ name: 'user:read' }]);

      await getCurrentUser(mockReq as Request, mockRes as Response, mockNext);
      
      // Wait for all promises to resolve
      await new Promise(setImmediate);

      expect(authService.findUserByExternalId).toHaveBeenCalledWith('user-external-id');
      expect(authService.getUserRoles).toHaveBeenCalledWith(1);
      expect(authService.getUserPermissions).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '獲取用戶資訊成功',
          isTemporary: false
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should get current temporary user info', async () => {
      const mockTempUser = {
        id: 1,
        email: 'temp@example.com',
        name: 'Temp User'
      };

      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        isTemp: true
      });
      (prisma.temp_users.findUnique as jest.Mock).mockResolvedValue(mockTempUser);

      await getCurrentUser(mockReq as Request, mockRes as Response, mockNext);

      expect(prisma.temp_users.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '獲取用戶資訊成功',
          isTemporary: true
        })
      );
    });

    it('should handle missing token', async () => {
      mockReq.headers = {};

      await getCurrentUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
    });

    it('should handle user not found', async () => {
      // Setup request with authorization header
      mockReq.headers = { authorization: 'Bearer valid-token' };
      
      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        _id: 'non-existent-user',
        isTemp: false,
        error: null
      });
      (authService.findUserByExternalId as jest.Mock).mockResolvedValue(null);

      await getCurrentUser(mockReq as Request, mockRes as Response, mockNext);
      
      // Wait for all promises to resolve
      await new Promise(setImmediate);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(NotFoundError)
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should reject password reset', async () => {
      mockReq.body = { email: 'test@example.com' };

      await forgotPassword(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '密碼重設功能暫時不可用',
          statusCode: 400
        })
      );
    });
  });

  describe('resetPassword', () => {
    it('should reject password reset', async () => {
      mockReq.body = {
        token: 'reset-token',
        newPassword: 'newpassword',
        confirmPassword: 'newpassword'
      };

      await resetPassword(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '密碼重設功能暫時不可用',
          statusCode: 400
        })
      );
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      mockReq.body = {
        token: 'verification-token',
        email: 'test@example.com'
      };
    });

    it('should successfully verify email', async () => {
      // Setup request body properly
      mockReq.body = {
        token: 'verification-token',
        email: 'test@example.com'
      };
      
      const mockUser = {
        id: 1,
        nickname: 'Test User',
        email_verified: false,
        contacts: { email: 'test@example.com' }
      };

      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        _id: 'user-external-id',
        email: 'test@example.com',
        type: 'email_verification',
        error: null
      });
      (authService.findUserByExternalId as jest.Mock).mockResolvedValue(mockUser);
      (authService.verifyUserEmail as jest.Mock).mockResolvedValue(undefined);
      (emailService.sendWelcomeEmail as jest.Mock).mockResolvedValue({ 
        success: true, 
        messageId: 'test-id' 
      });

      await verifyEmail(mockReq as Request, mockRes as Response, mockNext);
      
      // Wait for all promises to resolve
      await new Promise(setImmediate);

      expect(authService.findUserByExternalId).toHaveBeenCalledWith('user-external-id');
      expect(authService.verifyUserEmail).toHaveBeenCalledWith(1);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User'
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '郵件驗證成功'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing token', async () => {
      mockReq.body.token = undefined;

      await verifyEmail(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
    });

    it('should handle invalid token', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({ 
        error: 'Invalid token' 
      });

      await verifyEmail(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
    });

    it('should handle user not found', async () => {
      // Setup request body properly
      mockReq.body = {
        token: 'verification-token',
        email: 'test@example.com'
      };
      
      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        _id: 'non-existent-user',
        email: 'test@example.com',
        type: 'email_verification',
        error: null
      });
      (authService.findUserByExternalId as jest.Mock).mockResolvedValue(null);

      await verifyEmail(mockReq as Request, mockRes as Response, mockNext);
      
      // Wait for all promises to resolve
      await new Promise(setImmediate);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(NotFoundError)
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should handle already verified email', async () => {
      // Setup request body properly
      mockReq.body = {
        token: 'verification-token',
        email: 'test@example.com'
      };
      
      const mockVerifiedUser = {
        id: 1,
        nickname: 'Test User',
        email_verified: true,
        contacts: { email: 'test@example.com' }
      };

      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        _id: 'user-external-id',
        email: 'test@example.com',
        type: 'email_verification',
        error: null
      });
      (authService.findUserByExternalId as jest.Mock).mockResolvedValue(mockVerifiedUser);

      await verifyEmail(mockReq as Request, mockRes as Response, mockNext);
      
      // Wait for all promises to resolve
      await new Promise(setImmediate);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});