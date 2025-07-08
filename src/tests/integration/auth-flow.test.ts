/**
 * 認證系統端到端流程測試
 * 測試完整的使用者註冊、登入、權限控制、密碼重設等流程
 */

import request from 'supertest';
import { Express } from 'express';
import { prismaClient as prisma } from '../../services/database';
import { jwtService } from '../../services/jwt.service';
import { emailService } from '../../services/auth/email.service';
import { permissionService } from '../../services/auth/permission.service';
import bcrypt from 'bcrypt';

// Mock external services
jest.mock('../../services/auth/email.service');
jest.mock('../../services/auth/permission.service');

describe('Authentication Flow Integration Tests', () => {
  let app: Express;
  let mockEmailService: jest.Mocked<typeof emailService>;
  let mockPermissionService: jest.Mocked<typeof permissionService>;

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

    // Create test Express app
    const express = require('express');
    app = express();
    app.use(express.json());
    
    // Import and set up routes
    const authRoutes = require('../../routes/auth.routes');
    app.use('/api/v1/auth', authRoutes);

    // Mock successful email sending
    mockEmailService.sendVerificationEmail.mockResolvedValue({ success: true });
    mockEmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });
    mockEmailService.sendWelcomeEmail.mockResolvedValue({ success: true });

    // Mock permission service
    mockPermissionService.getUserRoles.mockResolvedValue([]);
    mockPermissionService.getUserPermissions.mockResolvedValue([]);
  });

  beforeEach(async () => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Reset database state
    await prisma.users.deleteMany({});
    await prisma.contacts.deleteMany({});
    await prisma.temp_users.deleteMany({});
  });

  describe('User Registration Flow', () => {
    it('should complete full registration flow', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'Test User'
      };

      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.user.username).toBe(userData.username);
      expect(registerResponse.body.user.email).toBe(userData.email);
      expect(registerResponse.body.isTemporary).toBe(false);

      // Verify email was sent
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        userData.email,
        expect.any(String)
      );

      // Step 2: Verify user was created in database
      const user = await prisma.users.findFirst({ where: { nickname: userData.username } });
      expect(user).toBeTruthy();
      
      const contact = await prisma.contacts.findFirst({ where: { email: userData.email } });
      expect(contact).toBeTruthy();

      // Step 3: Verify email with token
      const emailToken = mockEmailService.sendVerificationEmail.mock.calls[0][1];
      const verifyResponse = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          token: emailToken,
          email: userData.email
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.message).toContain('驗證成功');

      // Verify welcome email was sent
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        userData.email,
        userData.name
      );

      // Step 4: Verify user is now email verified
      const updatedUser = await prisma.users.findFirst({ where: { id: user?.id } });
      expect(updatedUser?.email_verified).toBe(true);
    });

    it('should handle registration with existing email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      // Create user first
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await prisma.users.create({
        data: {
          external_id: 'test-id',
          nickname: userData.username,
          password_hash: hashedPassword,
          name: userData.username,
          is_active: true,
          email_verified: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      await prisma.contacts.create({
        data: {
          user_id: user.id,
          email: userData.email,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('Conflict');
      expect(response.body.message).toContain('電子郵件已存在');
    });

    it('should handle registration with mismatched passwords', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('密碼');
    });
  });

  describe('User Login Flow', () => {
    let testUser: any;
    let testContact: any;

    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await prisma.users.create({
        data: {
          external_id: 'test-user-id',
          nickname: 'testuser',
          password_hash: hashedPassword,
          name: 'Test User',
          is_active: true,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      testContact = await prisma.contacts.create({
        data: {
          user_id: testUser.id,
          email: 'test@example.com',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Mock permission service
      mockPermissionService.getUserRoles.mockResolvedValue([
        { name: 'user', is_active: true } as any
      ]);
      mockPermissionService.getUserPermissions.mockResolvedValue([
        { resource: 'user', action: 'read' } as any
      ]);
    });

    it('should complete full login flow', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.username).toBe(testUser.nickname);
      expect(response.body.user.email).toBe(testContact.email);
      expect(response.body.isTemporary).toBe(false);

      // Verify token is valid
      const tokenPayload = jwtService.verifyToken(response.body.token);
      expect(tokenPayload.error).toBeUndefined();
      expect(tokenPayload.id).toBe(testUser.id);
      expect(tokenPayload.username).toBe(testUser.nickname);
      expect(tokenPayload.isTemp).toBe(false);
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('無效');
    });

    it('should reject login for inactive user', async () => {
      await prisma.users.update({
        where: { id: testUser.id },
        data: { is_active: false }
      });

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should update last login time', async () => {
      const originalLastLogin = testUser.last_login_at;

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      const updatedUser = await prisma.users.findFirst({ where: { id: testUser.id } });
      expect(updatedUser?.last_login_at).not.toBe(originalLastLogin);
    });
  });

  describe('Password Reset Flow', () => {
    let testUser: any;
    let testContact: any;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await prisma.users.create({
        data: {
          external_id: 'test-user-id',
          nickname: 'testuser',
          password_hash: hashedPassword,
          name: 'Test User',
          is_active: true,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      testContact = await prisma.contacts.create({
        data: {
          user_id: testUser.id,
          email: 'test@example.com',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    });

    it('should complete full password reset flow', async () => {
      // Step 1: Request password reset
      const forgotResponse = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(forgotResponse.body.success).toBe(true);
      expect(forgotResponse.body.message).toContain('發送');

      // Verify email was sent
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String)
      );

      // Step 2: Verify reset token was stored
      const updatedUser = await prisma.users.findFirst({ where: { id: testUser.id } });
      expect(updatedUser?.password_reset_token).toBeDefined();
      expect(updatedUser?.password_reset_expires).toBeDefined();

      // Step 3: Reset password with token
      const resetToken = mockEmailService.sendPasswordResetEmail.mock.calls[0][1];
      const resetResponse = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);
      expect(resetResponse.body.message).toContain('重設成功');

      // Step 4: Verify password was changed
      const finalUser = await prisma.users.findFirst({ where: { id: testUser.id } });
      expect(finalUser?.password_reset_token).toBeNull();
      expect(finalUser?.password_reset_expires).toBeNull();

      // Step 5: Verify old password doesn't work
      const oldPasswordResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(401);

      expect(oldPasswordResponse.body.error).toBe('Unauthorized');

      // Step 6: Verify new password works
      mockPermissionService.getUserRoles.mockResolvedValue([]);
      mockPermissionService.getUserPermissions.mockResolvedValue([]);

      const newPasswordResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'newpassword123' })
        .expect(200);

      expect(newPasswordResponse.body.success).toBe(true);
      expect(newPasswordResponse.body.token).toBeDefined();
    });

    it('should handle password reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('無效');
    });

    it('should handle password reset with expired token', async () => {
      // Set expired token
      await prisma.users.update({
        where: { id: testUser.id },
        data: {
          password_reset_token: 'expired-token',
          password_reset_expires: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
        }
      });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'expired-token',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('無效');
    });

    it('should handle password reset request for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should return success to prevent email enumeration
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('如果該電子郵件已註冊');
    });
  });

  describe('Token Refresh Flow', () => {
    let testUser: any;
    let validToken: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await prisma.users.create({
        data: {
          external_id: 'test-user-id',
          nickname: 'testuser',
          password_hash: hashedPassword,
          name: 'Test User',
          is_active: true,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
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

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Get Current User Flow', () => {
    let testUser: any;
    let testContact: any;
    let validToken: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await prisma.users.create({
        data: {
          external_id: 'test-user-id',
          nickname: 'testuser',
          password_hash: hashedPassword,
          name: 'Test User',
          is_active: true,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      testContact = await prisma.contacts.create({
        data: {
          user_id: testUser.id,
          email: 'test@example.com',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      validToken = jwtService.generateToken({
        id: testUser.id,
        username: testUser.nickname,
        email: testContact.email,
        isTemp: false
      });
    });

    it('should get current user information', async () => {
      const response = await request(app)
        .get('/api/v1/auth/user')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.username).toBe(testUser.nickname);
      expect(response.body.user.email).toBe(testContact.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.isTemporary).toBe(false);
    });

    it('should handle temporary user', async () => {
      const tempUser = await prisma.temp_users.create({
        data: {
          google_id: 'temp-google-id',
          email: 'temp@example.com',
          name: 'Temp User',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      const tempToken = jwtService.generateToken({
        id: tempUser.id,
        email: tempUser.email,
        name: tempUser.name,
        isTemp: true
      });

      const response = await request(app)
        .get('/api/v1/auth/user')
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
        .get('/api/v1/auth/user')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/user')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('登出成功');
    });
  });

  describe('Email Verification Flow', () => {
    let testUser: any;
    let testContact: any;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await prisma.users.create({
        data: {
          external_id: 'test-user-id',
          nickname: 'testuser',
          password_hash: hashedPassword,
          name: 'Test User',
          is_active: true,
          email_verified: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      testContact = await prisma.contacts.create({
        data: {
          user_id: testUser.id,
          email: 'test@example.com',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    });

    it('should verify email successfully', async () => {
      const verificationToken = jwtService.generateToken({
        id: testUser.id,
        email: testContact.email,
        type: 'email_verification'
      });

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          token: verificationToken,
          email: testContact.email
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('驗證成功');

      // Verify user is now email verified
      const verifiedUser = await prisma.users.findFirst({ where: { id: testUser.id } });
      expect(verifiedUser?.email_verified).toBe(true);
      expect(verifiedUser?.email_verified_at).toBeDefined();

      // Verify welcome email was sent
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        testContact.email,
        testUser.name
      );
    });

    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          token: 'invalid-token',
          email: testContact.email
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('無效');
    });

    it('should reject verification for already verified email', async () => {
      await prisma.users.update({
        where: { id: testUser.id },
        data: { email_verified: true }
      });

      const verificationToken = jwtService.generateToken({
        id: testUser.id,
        email: testContact.email,
        type: 'email_verification'
      });

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          token: verificationToken,
          email: testContact.email
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('已驗證');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      jest.spyOn(prisma.users, 'findFirst').mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should handle email service errors', async () => {
      mockEmailService.sendVerificationEmail.mockRejectedValue(new Error('Email service failed'));

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        })
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should handle JWT service errors', async () => {
      jest.spyOn(jwtService, 'generateToken').mockImplementation(() => {
        throw new Error('JWT generation failed');
      });

      // Create a contact first
      const contact = await prisma.contacts.create({
        data: {
          email: 'test@example.com'
        }
      });

      // Create a role first (required field)
      const role = await prisma.roles.create({
        data: {
          name: 'user',
          description: 'Test user role'
        }
      });

      // Create user with proper schema fields
      const user = await prisma.users.create({
        data: {
          external_id: 'test-user-id',
          mongo_id: 'test-mongo-id',
          nickname: 'testuser',
          contact_id: contact.id,
          role_id: role.id,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      mockPermissionService.getUserRoles.mockResolvedValue([]);
      mockPermissionService.getUserPermissions.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
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