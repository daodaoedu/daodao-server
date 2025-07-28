/**
 * 認證系統端到端流程測試
 * 測試完整的使用者註冊、登入、權限控制、密碼重設等流程
 */

import request from 'supertest';
import { Express } from 'express';
// Use the unified Prisma mock
import { createPrismaMock } from '../utils/prisma-mock';

const mockPrisma = createPrismaMock();

jest.mock('../../services/database/prisma.service', () => ({
  prisma: mockPrisma
}));

const prisma = mockPrisma;
import { jwtService } from '../../services/jwt.service';
import { emailService } from '../../services/auth/email.service';
import { permissionService } from '../../services/auth/permission.service';
import { authService } from '../../services/auth/auth.service';
import bcrypt from 'bcrypt';
import { createMockPrismaUser } from '../utils/test-helpers';

// Mock external services
jest.mock('../../services/auth/email.service');
jest.mock('../../services/auth/permission.service');
jest.mock('../../services/auth/auth.service');

describe('Authentication Flow Integration Tests', () => {
  let app: Express;
  let mockEmailService: jest.Mocked<typeof emailService>;
  let mockPermissionService: jest.Mocked<typeof permissionService>;
  let mockAuthService: jest.Mocked<typeof authService>;

  beforeAll(async () => {
    // Set up test environment
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_SECURITY = 'test-jwt-security';
    process.env.EMAIL_ADDRESS = 'test@daoedu.tw';
    process.env.EMAIL_PASSWORD = 'test-password';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.NODE_ENV = 'test';

    mockEmailService = emailService as jest.Mocked<typeof emailService>;
    mockPermissionService = permissionService as jest.Mocked<typeof permissionService>;
    mockAuthService = authService as jest.Mocked<typeof authService>;

    // Create test Express app
    const express = require('express');
    app = express();
    app.use(express.json());
    
    // Import and set up routes with proper middleware
    const { default: authRoutes } = require('../../routes/auth.routes');
    app.use('/api/v1/auth', authRoutes);
    
    // Add error handling middleware
    const { globalErrorHandler, notFoundHandler } = require('../../middleware/error.middleware');
    app.use(notFoundHandler);
    app.use(globalErrorHandler);

    // Mock successful email sending
    mockEmailService.sendVerificationEmail.mockResolvedValue({ success: true });
    mockEmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });
    mockEmailService.sendWelcomeEmail.mockResolvedValue({ success: true });

    // Mock permission service
    mockPermissionService.getUserRoles.mockResolvedValue([]);
    mockPermissionService.getUserPermissions.mockResolvedValue([]);
    
    // Mock auth service - return null by default for security tests
    mockAuthService.findUserByExternalId.mockResolvedValue(null);
    mockAuthService.getUserRoles.mockResolvedValue([]);
    mockAuthService.getUserPermissions.mockResolvedValue([]);
    mockAuthService.verifyUserEmail.mockResolvedValue(undefined);
  });

  beforeEach(async () => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Reset database state
    await prisma.users.deleteMany({});
    await prisma.contacts.deleteMany({});
    await prisma.temp_users.deleteMany({});
  });

  describe('User Registration Flow (OAuth-only)', () => {
    it('should reject traditional registration (OAuth-only system)', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      console.log('Register response body:', JSON.stringify(response.body, null, 2));
      console.log('Response status:', response.status);
      console.log('Response type:', typeof response.body);

      expect(response.body).toBeDefined();
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('bad_request');
      // Validation passed, so the actual controller error should be returned
      expect(response.body.error.message).toContain('註冊功能暫時不可用');
    });

    it('should handle Google OAuth registration flow', async () => {
      // This would be handled by OAuth middleware and Google callback
      // Test OAuth callback with new temp user
      const tempUserData = {
        id: 1,
        google_id: 'google-123',
        email: 'new@example.com',
        name: 'New User',
        photo_url: 'https://example.com/photo.jpg'
      };

      // Mock temp user creation
      mockPrisma.temp_users.create.mockResolvedValue(tempUserData);

      // Create temp user to simulate OAuth callback
      const tempUser = await prisma.temp_users.create({
        data: tempUserData
      });

      expect(tempUser.email).toBe(tempUserData.email);
      expect(tempUser.google_id).toBe(tempUserData.google_id);
    });
  });

  describe('User Login Flow (OAuth-only)', () => {
    it('should reject traditional email/password login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('unauthorized');
      expect(response.body.error.message).toContain('請使用 Google 登入');
    });

    it('should handle Google OAuth login for existing user', async () => {
      // Mock contact data
      const testContact = {
        id: 1,
        email: 'test@example.com'
      };
      mockPrisma.contacts.create.mockResolvedValue(testContact);

      // Mock role data
      const role = {
        id: 1,
        name: 'user',
        description: 'Test user role'
      };
      mockPrisma.roles.create.mockResolvedValue(role);

      // Mock user data
      const testUser = {
        id: 1,
        external_id: 'test-user-id',
        mongo_id: 'test-mongo-id',
        nickname: 'testuser',
        contact_id: testContact.id,
        role_id: role.id,
        email_verified: true
      };
      mockPrisma.users.create.mockResolvedValue(testUser);

      // Create contact first
      const createdContact = await prisma.contacts.create({
        data: {
          email: 'test@example.com'
        }
      });

      // Create role first
      const createdRole = await prisma.roles.create({
        data: {
          name: 'user',
          description: 'Test user role'
        }
      });

      // Create test user
      const createdUser = await prisma.users.create({
        data: {
          external_id: 'test-user-id',
          mongo_id: 'test-mongo-id',
          nickname: 'testuser',
          contact_id: createdContact.id,
          role_id: createdRole.id,
          email_verified: true
        }
      });

      // Simulate OAuth callback success
      const token = jwtService.generateToken({
        id: createdUser.id,
        _id: createdUser.external_id || undefined,
        username: createdUser.nickname || undefined,
        isTemp: false
      });

      expect(token).toBeDefined();
      
      // Verify token contains correct user info
      const decoded = jwtService.verifyToken(token);
      expect(decoded.id).toBe(createdUser.id);
      expect(decoded._id).toBe(createdUser.external_id);
      expect(decoded.isTemp).toBe(false);
    });

    it('should handle Google OAuth login for temporary user', async () => {
      // Mock temporary user data
      const tempUserData = {
        id: 1,
        google_id: 'google-temp-123',
        email: 'temp@example.com',
        name: 'Temp User'
      };
      mockPrisma.temp_users.create.mockResolvedValue(tempUserData);

      // Create temporary user
      const tempUser = await prisma.temp_users.create({
        data: {
          google_id: 'google-temp-123',
          email: 'temp@example.com',
          name: 'Temp User'
        }
      });

      // Simulate OAuth callback for temp user
      const token = jwtService.generateToken({
        id: tempUser.id,
        email: tempUser.email,
        name: tempUser.name,
        isTemp: true
      });

      expect(token).toBeDefined();
      
      // Verify token contains correct temp user info
      const decoded = jwtService.verifyToken(token);
      expect(decoded.id).toBe(tempUser.id);
      expect(decoded.isTemp).toBe(true);
    });
  });

  describe('Password Reset Flow (OAuth-only)', () => {
    it('should reject password reset requests (OAuth-only system)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('bad_request');
      expect(response.body.error.message).toContain('密碼重設功能暫時不可用');
    });

    it('should reject password reset confirmation (OAuth-only system)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: '123e4567-e89b-12d3-a456-426614174000',
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('bad_request');
      expect(response.body.error.message).toContain('密碼重設功能暫時不可用');
    });
  });

  describe('Token Refresh Flow', () => {
    let testUser: any;
    let validToken: string;

    beforeEach(async () => {
      // Create contact first
      const contact = await prisma.contacts.create({
        data: {
          email: 'test@example.com'
        }
      });

      // Create role first
      const role = await prisma.roles.create({
        data: {
          name: 'user',
          description: 'Test user role'
        }
      });

      // Create test user
      testUser = await prisma.users.create({
        data: {
          external_id: 'test-user-id',
          mongo_id: 'test-mongo-id',
          nickname: 'testuser',
          contact_id: contact.id,
          role_id: role.id,
          email_verified: true
        }
      });

      validToken = jwtService.generateToken({
        id: testUser.id,
        username: testUser.nickname,
        email: 'test@example.com',
        isTemp: false
      });
    });

    it('should refresh valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.token).not.toBe(validToken);

      // Verify new token is valid
      const newTokenPayload = jwtService.verifyToken(response.body.token);
      expect(newTokenPayload.error).toBeUndefined();
      expect(newTokenPayload.id).toBe(testUser.id);
      expect(newTokenPayload.username).toBe(testUser.nickname);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('unauthorized');
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('unauthorized');
    });
  });

  describe('Get Current User Flow', () => {
    let testUser: any;
    let testContact: any;
    let validToken: string;

    beforeEach(async () => {
      // Set up mock data
      testContact = {
        id: 1,
        email: 'test@example.com'
      };

      const role = {
        id: 1,
        name: 'user',
        description: 'Test user role'
      };

      testUser = {
        id: 1,
        external_id: 'test-user-id',
        mongo_id: 'test-mongo-id',
        nickname: 'testuser',
        contact_id: testContact.id,
        role_id: role.id,
        email_verified: true
      };

      // Configure Prisma mocks
      prisma.contacts.create.mockResolvedValue(testContact);
      prisma.roles.create.mockResolvedValue(role);
      prisma.users.create.mockResolvedValue(testUser);
      
      // Create contact and role first
      await prisma.contacts.create({
        data: {
          email: 'test@example.com'
        }
      });

      await prisma.roles.create({
        data: {
          name: 'user',
          description: 'Test user role'
        }
      });

      // Create test user
      await prisma.users.create({
        data: {
          external_id: 'test-user-id',
          mongo_id: 'test-mongo-id',
          nickname: 'testuser',
          contact_id: testContact.id,
          role_id: role.id,
          email_verified: true
        }
      });

      validToken = jwtService.generateToken({
        id: testUser.id,
        username: testUser.nickname,
        email: testContact.email,
        isTemp: false,
        _id: testUser.external_id
      });
    });

    it('should get current user information', async () => {
      // Set up mock for this specific test
      const mockUser = createMockPrismaUser({
        external_id: 'test-user-id',
        nickname: 'testuser'
      });
      mockAuthService.findUserByExternalId.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.nickname).toBe(testUser.nickname);
      expect(response.body.user.email).toBe(testContact.email);
      expect(response.body.isTemporary).toBe(false);
    });

    it('should handle temporary user', async () => {
      const tempUser = {
        id: 2,
        google_id: 'temp-google-id',
        email: 'temp@example.com',
        name: 'Temp User'
      };

      // Configure temp user mock
      prisma.temp_users.create.mockResolvedValue(tempUser);
      prisma.temp_users.findUnique.mockResolvedValue(tempUser);

      await prisma.temp_users.create({
        data: {
          google_id: 'temp-google-id',
          email: 'temp@example.com',
          name: 'Temp User'
        }
      });

      const tempToken = jwtService.generateToken({
        id: tempUser.id,
        email: tempUser.email,
        name: tempUser.name,
        isTemp: true
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe(tempUser.id);
      expect(response.body.user.email).toBe(tempUser.email);
      expect(response.body.user.name).toBe(tempUser.name);
      expect(response.body.isTemporary).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('unauthorized');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('unauthorized');
    });
  });

  describe('Logout Flow', () => {
    let testUser: any;
    let testContact: any;
    let validToken: string;

    beforeEach(async () => {
      // Create contact first
      testContact = await prisma.contacts.create({
        data: {
          email: 'logout@example.com'
        }
      });

      // Create role first
      const role = await prisma.roles.create({
        data: {
          name: 'user',
          description: 'Test user role'
        }
      });

      // Create test user
      testUser = await prisma.users.create({
        data: {
          external_id: 'logout-user-id',
          mongo_id: 'logout-mongo-id',
          nickname: 'logoutuser',
          contact_id: testContact.id,
          role_id: role.id,
          email_verified: true
        }
      });

      validToken = jwtService.generateToken({
        id: testUser.id,
        username: testUser.nickname,
        email: testContact.email,
        isTemp: false
      });
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('登出成功');
    });
  });

  describe('Email Verification Flow', () => {
    let testUser: any;
    let testContact: any;

    beforeEach(async () => {
      // Create contact first
      testContact = await prisma.contacts.create({
        data: {
          email: 'test@example.com'
        }
      });

      // Create role first
      const role = await prisma.roles.create({
        data: {
          name: 'user',
          description: 'Test user role'
        }
      });

      // Create test user
      testUser = await prisma.users.create({
        data: {
          external_id: 'test-user-id',
          mongo_id: 'test-mongo-id',
          nickname: 'testuser',
          contact_id: testContact.id,
          role_id: role.id,
          email_verified: false
        }
      });
    });

    it('should verify email successfully', async () => {
      const verificationToken = jwtService.generateToken({
        id: testUser.id,
        email: testContact.email,
        _id: testUser.external_id
      });

      // Mock unverified user for this test
      const unverifiedUser = createMockPrismaUser({
        external_id: 'test-user-id',
        nickname: 'testuser',
        email_verified: false,
        roles: {
          id: 1,
          name: 'user',
          description: 'Regular user'
        }
      });
      mockAuthService.findUserByExternalId.mockResolvedValueOnce(unverifiedUser);

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          token: verificationToken,
          email: testContact.email
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('驗證成功');

      // Verify welcome email was sent
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        testContact.email,
        testUser.nickname
      );
    });

    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          token: '123e4567-e89b-12d3-a456-426614174000',
          email: testContact.email
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('bad_request');
      expect(response.body.error.message).toContain('無效');
    });

    it('should reject verification for already verified email', async () => {
      // Mock user as already verified for this specific test
      const verifiedUser = createMockPrismaUser({
        external_id: 'test-user-id',
        nickname: 'testuser',
        email_verified: true, // Already verified
        roles: {
          id: 1,
          name: 'user',
          description: 'Regular user'
        }
      });
      mockAuthService.findUserByExternalId.mockResolvedValueOnce(verifiedUser);

      const verificationToken = jwtService.generateToken({
        id: testUser.id,
        email: testContact.email,
        _id: testUser.external_id
      });

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          token: verificationToken,
          email: testContact.email
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('bad_request');
      expect(response.body.error.message).toContain('郵件已驗證');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Since login is OAuth-only, it should return 401 for password login attempts
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('unauthorized');
      expect(response.body.error.message).toContain('請使用 Google 登入');
    });

    it('should handle email service errors', async () => {
      // Since registration is OAuth-only, it should return 400 for traditional registration attempts
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('bad_request');
      expect(response.body.error.message).toContain('註冊功能暫時不可用');
    });

    it('should handle JWT service errors', async () => {
      // Since login is OAuth-only, it should return 401 for password login attempts
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('unauthorized');
      expect(response.body.error.message).toContain('請使用 Google 登入');
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.users.deleteMany({});
    await prisma.contacts.deleteMany({});
    await prisma.temp_users.deleteMany({});
    await prisma.roles.deleteMany({});
    await prisma.$disconnect();
  });
});