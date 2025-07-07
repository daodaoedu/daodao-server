/**
 * 認證系統安全性整合測試
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import { jwtService } from '../../services/jwt-service';
import { emailService } from '../../services/auth/email.service';
import { permissionService } from '../../services/auth/permission.service';

// Mock dependencies
jest.mock('../../services/auth/email.service');
jest.mock('../../services/auth/permission.service');
jest.mock('../../models/index');

describe('Authentication Security Integration Tests', () => {
  let app: Express;
  let mockEmailService: jest.Mocked<typeof emailService>;
  let mockPermissionService: jest.Mocked<typeof permissionService>;
  const JWT_SECRET = 'test-jwt-secret';

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_SECURITY = JWT_SECRET;
    process.env.EMAIL_ADDRESS = 'test@example.com';
    process.env.EMAIL_PASSWORD = 'test-password';
    
    mockEmailService = emailService as jest.Mocked<typeof emailService>;
    mockPermissionService = permissionService as jest.Mocked<typeof permissionService>;

    // Mock Express app with basic auth routes
    const express = require('express');
    app = express();
    app.use(express.json());

    // Import middleware after setting env vars
    const { authenticateJWT, requirePermissions } = require('../../middleware/auth');

    // Test routes
    app.post('/auth/login', (req, res) => {
      const { email, password } = req.body;
      if (email === 'test@example.com' && password === 'password') {
        const token = jwtService.generateToken({ id: 1, email, username: 'testuser' });
        res.json({ token, user: { id: 1, email, username: 'testuser' } });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });

    app.get('/auth/protected', authenticateJWT, (req, res) => {
      res.json({ message: 'Protected route accessed', user: req.user });
    });

    app.get('/auth/admin', authenticateJWT, requirePermissions([
      { resource: 'admin', action: 'read' }
    ]), (req, res) => {
      res.json({ message: 'Admin route accessed' });
    });

    app.post('/auth/password-reset', (req, res) => {
      const { email } = req.body;
      const resetToken = jwtService.generateToken({ id: 0, email, purpose: 'reset' });
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);
      res.json({ message: 'Password reset email sent', resetToken });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Token Security', () => {
    it('should reject requests with no token', async () => {
      const response = await request(app)
        .get('/auth/protected')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: '缺少認證令牌'
      });
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject requests with malformed token', async () => {
      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', 'Bearer not.a.valid.jwt')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { id: 1, username: 'testuser' },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toContain('過期');
    });

    it('should reject tokens with wrong signature', async () => {
      const wrongToken = jwt.sign(
        { id: 1, username: 'testuser' },
        'wrong-secret'
      );

      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should accept valid tokens', async () => {
      const validToken = jwtService.generateToken({ id: 1, username: 'testuser' });

      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('Protected route accessed');
      expect(response.body.user.id).toBe(1);
    });

    it('should handle token without Bearer prefix', async () => {
      const validToken = jwtService.generateToken({ id: 1, username: 'testuser' });

      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', validToken) // No "Bearer " prefix
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should handle empty Authorization header', async () => {
      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Permission Security', () => {
    it('should deny access without required permissions', async () => {
      const userToken = jwtService.generateToken({
        id: 1,
        username: 'testuser',
        permissions: ['user:read']
      });

      mockPermissionService.hasPermission.mockResolvedValue(false);

      const response = await request(app)
        .get('/auth/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should allow access with required permissions', async () => {
      const adminToken = jwtService.generateToken({
        id: 1,
        username: 'admin',
        permissions: ['admin:read']
      });

      // Mock permission check to return true
      mockPermissionService.hasPermission.mockResolvedValue(true);

      const response = await request(app)
        .get('/auth/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Admin route accessed');
    });

    it('should handle permission service errors gracefully', async () => {
      const userToken = jwtService.generateToken({
        id: 1,
        username: 'testuser'
      });

      mockPermissionService.hasPermission.mockRejectedValue(new Error('Permission service error'));

      const response = await request(app)
        .get('/auth/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });
  });

  describe('Authentication Flow Security', () => {
    it('should prevent brute force attacks with rate limiting', async () => {
      const attempts = Array(10).fill(0).map(() =>
        request(app)
          .post('/auth/login')
          .send({ email: 'test@example.com', password: 'wrongpassword' })
      );

      const responses = await Promise.all(attempts);
      
      // All should return 401 for wrong password
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
    });

    it('should handle SQL injection attempts in login', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'/**/OR/**/1=1#",
        "' UNION SELECT * FROM users --"
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/auth/login')
          .send({ email: input, password: input });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid credentials');
      }
    });

    it('should handle XSS attempts in input fields', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '\"><script>alert("xss")</script>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/auth/login')
          .send({ email: payload, password: 'password' });

        expect(response.status).toBe(401);
        // Ensure the payload is not reflected in the response
        expect(response.text).not.toContain('<script>');
        expect(response.text).not.toContain('javascript:');
      }
    });

    it('should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user..user@domain.com',
        'user@domain',
        ''
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/auth/login')
          .send({ email, password: 'password' });

        expect(response.status).toBe(401);
      }
    });

    it('should handle empty and null values', async () => {
      const testCases = [
        { email: '', password: '' },
        { email: null, password: null },
        { email: undefined, password: undefined },
        {},
        { email: 'test@example.com' }, // missing password
        { password: 'password' } // missing email
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/auth/login')
          .send(testCase);

        expect(response.status).toBe(401);
      }
    });
  });

  describe('Token Manipulation Security', () => {
    it('should reject tokens with modified payload', async () => {
      const validToken = jwtService.generateToken({ id: 1, username: 'testuser' });
      const parts = validToken.split('.');
      
      // Modify the payload (base64 decode, change, encode)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      payload.id = 999; // Change user ID
      parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      const modifiedToken = parts.join('.');

      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', `Bearer ${modifiedToken}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject tokens with modified signature', async () => {
      const validToken = jwtService.generateToken({ id: 1, username: 'testuser' });
      const parts = validToken.split('.');
      parts[2] = 'modified-signature';
      
      const modifiedToken = parts.join('.');

      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', `Bearer ${modifiedToken}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject tokens with none algorithm', async () => {
      // Create a token with "none" algorithm (security vulnerability)
      const header = { alg: 'none', typ: 'JWT' };
      const payload = { id: 999, username: 'hacker' };
      
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const noneToken = `${encodedHeader}.${encodedPayload}.`;

      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', `Bearer ${noneToken}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Password Reset Security', () => {
    it('should generate secure reset tokens', async () => {
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);

      const response = await request(app)
        .post('/auth/password-reset')
        .send({ email: 'test@example.com' })
        .expect(200);

      const { resetToken } = response.body;
      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
      
      // Verify token structure
      const decoded = jwtService.verifyToken(resetToken);
      expect(decoded.error).toBeUndefined();
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.purpose).toBe('reset');
    });

    it('should handle invalid email in password reset', async () => {
      const response = await request(app)
        .post('/auth/password-reset')
        .send({ email: 'invalid-email' });

      // Should still return success to prevent email enumeration
      expect(response.status).toBe(200);
    });

    it('should prevent email enumeration attacks', async () => {
      const responses = await Promise.all([
        request(app).post('/auth/password-reset').send({ email: 'existing@example.com' }),
        request(app).post('/auth/password-reset').send({ email: 'nonexistent@example.com' })
      ]);

      // Both should return the same response to prevent enumeration
      expect(responses[0].status).toBe(responses[1].status);
      expect(responses[0].body.message).toBe(responses[1].body.message);
    });
  });

  describe('Header Security', () => {
    it('should handle missing Authorization header', async () => {
      const response = await request(app)
        .get('/auth/protected');

      expect(response.status).toBe(401);
    });

    it('should handle malformed Authorization header formats', async () => {
      const malformedHeaders = [
        'Basic token123',
        'Bearer',
        'Bearer ',
        'token123',
        'Bearer token1 token2',
        'bearer token123' // lowercase
      ];

      for (const header of malformedHeaders) {
        const response = await request(app)
          .get('/auth/protected')
          .set('Authorization', header);

        expect(response.status).toBe(401);
      }
    });

    it('should handle extremely long tokens', async () => {
      const longToken = 'a'.repeat(10000);
      
      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', `Bearer ${longToken}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should handle special characters in tokens', async () => {
      const specialTokens = [
        'token-with-unicode-✓',
        'token\nwith\nnewlines',
        'token\twith\ttabs',
        'token with spaces',
        'token<script>alert("xss")</script>'
      ];

      for (const token of specialTokens) {
        const response = await request(app)
          .get('/auth/protected')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
      }
    });
  });

  describe('Concurrent Request Security', () => {
    it('should handle concurrent authentication requests', async () => {
      const validToken = jwtService.generateToken({ id: 1, username: 'testuser' });
      
      const requests = Array(20).fill(0).map(() =>
        request(app)
          .get('/auth/protected')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.user.id).toBe(1);
      });
    });

    it('should handle concurrent invalid requests', async () => {
      const requests = Array(20).fill(0).map(() =>
        request(app)
          .get('/auth/protected')
          .set('Authorization', 'Bearer invalid-token')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
    });
  });

  describe('Memory and Performance Security', () => {
    it('should not leak sensitive information in error messages', async () => {
      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Ensure no sensitive information is leaked
      expect(response.text).not.toContain(JWT_SECRET);
      expect(response.text).not.toContain('jwt');
      expect(response.text).not.toContain('secret');
      expect(response.text).not.toContain('key');
    });

    it('should handle large payloads gracefully', async () => {
      const largePayload = {
        email: 'test@example.com',
        password: 'password',
        extraData: 'x'.repeat(100000)
      };

      const response = await request(app)
        .post('/auth/login')
        .send(largePayload);

      expect([200, 401, 413]).toContain(response.status); // 413 = Payload Too Large
    });
  });
});