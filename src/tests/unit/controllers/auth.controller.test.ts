/**
 * 用戶管理系統控制器單元測試
 * 測試用戶註冊、登入、密碼重設、電子郵件驗證等功能
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
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
} from '@controllers/auth.controller';
import { jwtService } from '../../../services/jwt.service';
import { emailService } from '../../../services/auth/email.service';
import { permissionService } from '../../../services/auth/permission.service';
import { 
  UnauthorizedError, 
  NotFoundError, 
  ConflictError, 
  BadRequestError 
} from '../../../utils/error-handler';

// Mock dependencies
jest.mock('../../../services/jwt.service');
jest.mock('../../../services/auth/email.service');
jest.mock('../../../services/auth/permission.service');
jest.mock('../../../services/database/prisma.service', () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    contacts: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn()
    },
    temp_users: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn()
    },
    $transaction: jest.fn()
  }
}));
jest.mock('bcrypt');

describe('Auth Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let mockUser: any;
  let mockContact: any;
  let mockTempUser: any;
  let mockTransaction: any;
  let prisma: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Get prisma mock
    prisma = require('../../../services/database/prisma.service').prisma;

    // Mock request and response
    req = {
      body: {},
      headers: {},
      user: undefined
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      redirect: jest.fn()
    };

    next = jest.fn();

    // Mock database models
    mockUser = {
      id: 1,
      username: 'testuser',
      password_hash: 'hashedpassword',
      name: 'Test User',
      photo_url: 'https://example.com/photo.jpg',
      is_active: true,
      email_verified: false
    };

    mockContact = {
      id: 1,
      user_id: 1,
      email: 'test@example.com',
      User: mockUser,
      user: mockUser
    };

    mockTempUser = {
      id: 1,
      email: 'temp@example.com',
      name: 'Temp User',
      photo_url: 'https://example.com/temp.jpg'
    };

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };

    // Mock Prisma models
    prisma.users.findUnique.mockResolvedValue(null);
    prisma.users.findFirst.mockResolvedValue(null);
    prisma.users.create.mockResolvedValue(mockUser);
    prisma.contacts.findFirst.mockResolvedValue(null);
    prisma.contacts.create.mockResolvedValue(mockContact);
    prisma.temp_users.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (fn) => fn(prisma));

    // Mock bcrypt
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

    // Mock JWT service
    (jwtService.generateToken as jest.Mock).mockReturnValue('mock-jwt-token');
    (jwtService.verifyToken as jest.Mock).mockReturnValue({ 
      id: 1, 
      email: 'test@example.com', 
      type: 'email_verification' 
    });
    (jwtService.refreshToken as jest.Mock).mockReturnValue('new-mock-jwt-token');

    // Mock email service
    (emailService.sendVerificationEmail as jest.Mock).mockResolvedValue(true);
    (emailService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(true);
    (emailService.sendWelcomeEmail as jest.Mock).mockResolvedValue(true);

    // Mock permission service
    (permissionService.getUserRoles as jest.Mock).mockResolvedValue([{ name: 'user' }]);
    (permissionService.getUserPermissions as jest.Mock).mockResolvedValue([
      { resource: 'user', action: 'read' }
    ]);
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
    });

    it('should successfully login with valid credentials', async () => {
      prisma.contacts.findFirst.mockResolvedValue(mockContact);
      prisma.users.update.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await login(req as Request, res as Response, next);

      expect(prisma.contacts.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { user: true }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(permissionService.getUserRoles).toHaveBeenCalledWith(1);
      expect(permissionService.getUserPermissions).toHaveBeenCalledWith(1);
      expect(jwtService.generateToken).toHaveBeenCalled();
      expect(prisma.users.update).toHaveBeenCalledWith({ 
        where: { id: 1 },
        data: { last_login_at: expect.any(Date) }
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '登入成功',
        token: 'mock-jwt-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          name: 'Test User',
          photo_url: 'https://example.com/photo.jpg',
          is_active: true
        },
        isTemporary: false
      });
    });

    it('should reject login with invalid email', async () => {
      prisma.contacts.findFirst.mockResolvedValue(null);

      await expect(login(req as Request, res as Response))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should reject login with invalid password', async () => {
      prisma.contacts.findFirst.mockResolvedValue(mockContact);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(login(req as Request, res as Response))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should reject login for inactive user', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      const inactiveContact = { ...mockContact, User: inactiveUser };
      prisma.contacts.findFirst.mockResolvedValue(inactiveContact);

      await expect(login(req as Request, res as Response))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should handle user without password hash', async () => {
      const userWithoutPassword = { ...mockUser, password_hash: null };
      const contactWithoutPassword = { ...mockContact, User: userWithoutPassword };
      (Contact.findOne as jest.Mock).mockResolvedValue(contactWithoutPassword);

      await expect(login(req as Request, res as Response))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('register', () => {
    beforeEach(() => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'New User'
      };
    });

    it('should successfully register a new user', async () => {
      (Contact.findOne as jest.Mock).mockResolvedValue(null);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await register(req as Request, res as Response);

      expect(Contact.findOne).toHaveBeenCalledWith({ where: { email: 'new@example.com' } });
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'newuser' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(User.create).toHaveBeenCalledWith({
        external_id: expect.any(String),
        username: 'newuser',
        password_hash: 'hashedpassword',
        name: 'New User',
        is_active: true,
        email_verified: false,
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      }, { transaction: mockTransaction });
      expect(Contact.create).toHaveBeenCalledWith({
        user_id: 1,
        email: 'new@example.com',
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      }, { transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'new@example.com',
        'mock-jwt-token'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '註冊成功，請檢查您的電子郵件進行驗證',
        user: {
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
          name: 'New User',
          is_active: true
        },
        isTemporary: false
      });
    });

    it('should reject registration with mismatched passwords', async () => {
      req.body.confirmPassword = 'differentpassword';

      await expect(register(req as Request, res as Response))
        .rejects.toThrow(BadRequestError);
    });

    it('should reject registration with existing email', async () => {
      (Contact.findOne as jest.Mock).mockResolvedValue(mockContact);

      await expect(register(req as Request, res as Response))
        .rejects.toThrow(ConflictError);
    });

    it('should reject registration with existing username', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(register(req as Request, res as Response))
        .rejects.toThrow(ConflictError);
    });

    it('should handle transaction rollback on error', async () => {
      (Contact.findOne as jest.Mock).mockResolvedValue(null);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(register(req as Request, res as Response))
        .rejects.toThrow('Database error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should use username as name if name is not provided', async () => {
      req.body.name = undefined;
      (Contact.findOne as jest.Mock).mockResolvedValue(null);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await register(req as Request, res as Response);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'newuser' }),
        { transaction: mockTransaction }
      );
    });
  });

  describe('googleCallback', () => {
    it('should handle formal user callback', async () => {
      const formalUser = { 
        id: 1, 
        username: 'googleuser', 
        email: 'google@example.com',
        dataValues: { id: 1 }
      };
      req.user = formalUser;
      (Contact.findOne as jest.Mock).mockResolvedValue(mockContact);

      await googleCallback(req as Request, res as Response);

      expect(jwtService.generateToken).toHaveBeenCalledWith({
        id: 1,
        email: 'test@example.com',
        username: 'googleuser',
        isTemp: false,
        roles: [],
        permissions: []
      });
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?token=mock-jwt-token&temporary=false`
      );
    });

    it('should handle temporary user callback', async () => {
      const tempUser = { 
        id: 1, 
        email: 'temp@example.com', 
        name: 'Temp User'
      };
      req.user = tempUser;

      await googleCallback(req as Request, res as Response);

      expect(jwtService.generateToken).toHaveBeenCalledWith({
        id: 1,
        email: 'temp@example.com',
        name: 'Temp User',
        isTemp: true,
        roles: [],
        permissions: []
      });
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding?token=mock-jwt-token&temporary=true`
      );
    });

    it('should handle missing user', async () => {
      req.user = undefined;

      await expect(googleCallback(req as Request, res as Response))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      await logout(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '登出成功'
      });
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      req.headers = { authorization: 'Bearer old-token' };
    });

    it('should successfully refresh token', async () => {
      (jwtService.refreshToken as jest.Mock).mockReturnValue('new-token');

      await refreshToken(req as Request, res as Response);

      expect(jwtService.refreshToken).toHaveBeenCalledWith('old-token');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '令牌刷新成功',
        token: 'new-token'
      });
    });

    it('should handle missing authorization header', async () => {
      req.headers = {};

      await expect(refreshToken(req as Request, res as Response))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should handle failed token refresh', async () => {
      (jwtService.refreshToken as jest.Mock).mockReturnValue(null);

      await expect(refreshToken(req as Request, res as Response))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(() => {
      req.headers = { authorization: 'Bearer valid-token' };
    });

    it('should get current formal user', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        isTemp: false
      });
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Contact.findOne as jest.Mock).mockResolvedValue(mockContact);

      await getCurrentUser(req as Request, res as Response);

      expect(jwtService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(Contact.findOne).toHaveBeenCalledWith({ where: { user_id: 1 } });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '獲取用戶資訊成功',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          name: 'Test User',
          photo_url: 'https://example.com/photo.jpg',
          is_active: true
        },
        isTemporary: false
      });
    });

    it('should get current temporary user', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        isTemp: true
      });
      (TempUser.findByPk as jest.Mock).mockResolvedValue(mockTempUser);

      await getCurrentUser(req as Request, res as Response);

      expect(TempUser.findByPk).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '獲取用戶資訊成功',
        user: {
          id: 1,
          username: undefined,
          email: 'temp@example.com',
          name: 'Temp User',
          photo_url: 'https://example.com/temp.jpg',
          is_active: true
        },
        isTemporary: true
      });
    });

    it('should handle missing token', async () => {
      req.headers = {};

      await expect(getCurrentUser(req as Request, res as Response))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should handle invalid token', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({ error: 'Invalid token' });

      await expect(getCurrentUser(req as Request, res as Response))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should handle user not found', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        isTemp: false
      });
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(getCurrentUser(req as Request, res as Response))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('forgotPassword', () => {
    beforeEach(() => {
      req.body = { email: 'test@example.com' };
    });

    it('should send password reset email for existing user', async () => {
      (Contact.findOne as jest.Mock).mockResolvedValue(mockContact);
      mockUser.update = jest.fn();

      await forgotPassword(req as Request, res as Response);

      expect(Contact.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [{ model: User, as: 'user', required: true }]
      });
      expect(mockUser.update).toHaveBeenCalledWith({
        password_reset_token: expect.any(String),
        password_reset_expires: expect.any(Date)
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '密碼重設連結已發送到您的電子郵箱'
      });
    });

    it('should return success message for non-existing user (security)', async () => {
      (Contact.findOne as jest.Mock).mockResolvedValue(null);

      await forgotPassword(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '如果該電子郵件已註冊，您將收到密碼重設連結'
      });
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      req.body = {
        token: 'reset-token',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };
    });

    it('should successfully reset password', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.update = jest.fn();

      await resetPassword(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          password_reset_token: 'reset-token',
          password_reset_expires: { [Op.gt]: expect.any(Date) }
        }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(mockUser.update).toHaveBeenCalledWith({
        password_hash: 'hashedpassword',
        password_reset_token: undefined,
        password_reset_expires: undefined,
        updated_at: expect.any(Date)
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '密碼重設成功'
      });
    });

    it('should reject mismatched passwords', async () => {
      req.body.confirmPassword = 'differentpassword';

      await expect(resetPassword(req as Request, res as Response))
        .rejects.toThrow(BadRequestError);
    });

    it('should reject invalid or expired token', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(resetPassword(req as Request, res as Response))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      req.body = {
        token: 'verification-token',
        email: 'test@example.com'
      };
    });

    it('should successfully verify email', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        type: 'email_verification'
      });
      (Contact.findOne as jest.Mock).mockResolvedValue(mockContact);
      mockUser.id = 1;
      mockUser.email_verified = false;
      mockUser.update = jest.fn();

      await verifyEmail(req as Request, res as Response);

      expect(jwtService.verifyToken).toHaveBeenCalledWith('verification-token');
      expect(Contact.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [{ model: User, as: 'user', required: true }]
      });
      expect(mockUser.update).toHaveBeenCalledWith({
        email_verified: true,
        email_verified_at: expect.any(Date)
      });
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '電子郵件驗證成功，歡迎加入島島阿學！'
      });
    });

    it('should handle missing token', async () => {
      req.body.token = undefined;

      await expect(verifyEmail(req as Request, res as Response))
        .rejects.toThrow(BadRequestError);
    });

    it('should handle invalid token', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({ error: 'Invalid token' });

      await expect(verifyEmail(req as Request, res as Response))
        .rejects.toThrow(BadRequestError);
    });

    it('should handle wrong token type', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        type: 'password_reset'
      });

      await expect(verifyEmail(req as Request, res as Response))
        .rejects.toThrow(BadRequestError);
    });

    it('should handle user not found', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        type: 'email_verification'
      });
      (Contact.findOne as jest.Mock).mockResolvedValue(null);

      await expect(verifyEmail(req as Request, res as Response))
        .rejects.toThrow(NotFoundError);
    });

    it('should handle user ID mismatch', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 2,
        email: 'test@example.com',
        type: 'email_verification'
      });
      (Contact.findOne as jest.Mock).mockResolvedValue(mockContact);

      await expect(verifyEmail(req as Request, res as Response))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should handle already verified email', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        type: 'email_verification'
      });
      (Contact.findOne as jest.Mock).mockResolvedValue(mockContact);
      mockUser.id = 1;
      mockUser.email_verified = true;

      await expect(verifyEmail(req as Request, res as Response))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors', async () => {
      req.body = { email: 'test@example.com', password: 'password' };
      (Contact.findOne as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(login(req as Request, res as Response))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle JWT service errors', async () => {
      req.body = { email: 'test@example.com', password: 'password' };
      (Contact.findOne as jest.Mock).mockResolvedValue(mockContact);
      (jwtService.generateToken as jest.Mock).mockImplementation(() => {
        throw new Error('JWT generation failed');
      });

      await expect(login(req as Request, res as Response))
        .rejects.toThrow('JWT generation failed');
    });

    it('should handle email service errors', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
      (Contact.findOne as jest.Mock).mockResolvedValue(null);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (emailService.sendVerificationEmail as jest.Mock).mockRejectedValue(
        new Error('Email service failed')
      );

      await expect(register(req as Request, res as Response))
        .rejects.toThrow('Email service failed');
    });

    it('should handle permission service errors', async () => {
      req.body = { email: 'test@example.com', password: 'password' };
      (Contact.findOne as jest.Mock).mockResolvedValue(mockContact);
      (permissionService.getUserRoles as jest.Mock).mockRejectedValue(
        new Error('Permission service failed')
      );

      await expect(login(req as Request, res as Response))
        .rejects.toThrow('Permission service failed');
    });

    it('should handle bcrypt errors', async () => {
      req.body = { email: 'test@example.com', password: 'password' };
      (Contact.findOne as jest.Mock).mockResolvedValue(mockContact);
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt failed'));

      await expect(login(req as Request, res as Response))
        .rejects.toThrow('Bcrypt failed');
    });
  });
});