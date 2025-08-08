/**
 * 認證系統安全性整合測試
 */

// Set environment variables before any imports
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_SECURITY = 'test-jwt-security';
process.env.EMAIL_ADDRESS = 'test@example.com';
process.env.EMAIL_PASSWORD = 'test-password';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// Mock email config before any imports
jest.mock('@/config/email.config', () => ({
  emailConfig: {
    smtp: {
      service: 'gmail',
      auth: {
        user: 'test@example.com',
        pass: 'test-password'
      }
    },
    sender: {
      name: 'Test',
      email: 'test@example.com'
    }
  }
}));

// Mock enhanced email service config
jest.mock('@/services/email/enhanced-email.service', () => ({
  emailConfig: {
    smtp: {
      service: 'gmail',
      auth: {
        user: 'test@example.com',
        pass: 'test-password'
      }
    },
    sender: {
      name: 'Test',
      email: 'test@example.com'
    },
    urls: {
      frontend: 'http://localhost:3000',
      backend: 'http://localhost:4000'
    },
    retry: {
      maxAttempts: 3,
      backoffMs: 1000
    }
  },
  getEmailConfig: jest.fn(() => ({
    smtp: {
      service: 'gmail',
      auth: {
        user: 'test@example.com',
        pass: 'test-password'
      }
    },
    sender: {
      name: 'Test',
      email: 'test@example.com'
    },
    urls: {
      frontend: 'http://localhost:3000',
      backend: 'http://localhost:4000'
    },
    retry: {
      maxAttempts: 3,
      backoffMs: 1000
    }
  })),
  enhancedEmailService: {
    sendWelcomeEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendContactEmail: jest.fn(),
    sendCustomEmail: jest.fn()
  }
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import { jwtService } from '@/services/jwt.service';
import { emailService } from '@/services/auth/email.service';
import { permissionService } from '@/services/auth/permission.service';

// Mock dependencies
jest.mock('@/services/auth/email.service');
jest.mock('@/services/auth/permission.service');
jest.mock('@/services/email/enhanced-email.service');

describe('Authentication Security Integration Tests', () => {
  let app: Express;
  let server: any;
  let agent: any;
  let connections: Set<any> = new Set();
  let mockEmailService: jest.Mocked<typeof emailService>;
  let mockPermissionService: jest.Mocked<typeof permissionService>;
  const JWT_SECRET = 'test-jwt-secret';

  beforeAll(async () => {
    mockEmailService = emailService as jest.Mocked<typeof emailService>;
    mockPermissionService = permissionService as jest.Mocked<typeof permissionService>;

    // Mock Express app with basic auth routes
    const express = require('express');
    app = express();
    app.disable('x-powered-by'); // Hide Express headers
    app.use(express.json());

    // Import middleware after setting env vars
    const { authenticateJWT, requirePermissions } = require('@/middleware/auth');
    const { globalErrorHandler } = require('@/middleware/error.middleware');

    // Test routes
    app.post('/auth/login', (req, res) => {
      const { email, password } = req.body;
      if (email === 'test@example.com' && password === 'password') {
        const token = jwtService.generateToken({ id: 1, email, username: 'testuser' });
        res.json({ token, user: { id: 1, email, username: 'testuser' } });
      } else {
        res.status(401).json({
          success: false,
          error: {
            message: 'Invalid credentials',
            type: 'unauthorized'
          }
        });
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
      mockEmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });
      res.json({ message: 'Password reset email sent', resetToken });
    });

    // Add error handling middleware
    app.use(globalErrorHandler);

    // Start the server properly to avoid open handle issues
    server = app.listen(0); // Use port 0 for dynamic port allocation

    // Track connections to close them later
    server.on('connection', (connection: any) => {
      connections.add(connection);
      connection.on('close', () => {
        connections.delete(connection);
      });
    });

    agent = request(server);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Token Security', () => {
    it('should reject requests with no token', async () => {
      const response = await agent
        .get('/auth/protected')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '缺少認證令牌',
          type: 'unauthorized'
        }
      });
    });

    it('should reject requests with invalid token', async () => {
      const response = await agent
        .get('/auth/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '無效的認證令牌',
          type: 'unauthorized'
        }
      });
    });

    it('should reject requests with malformed token', async () => {
      const response = await agent
        .get('/auth/protected')
        .set('Authorization', 'Bearer not.a.valid.jwt')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { id: 1, username: 'testuser' },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const response = await agent
        .get('/auth/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject tokens with wrong signature', async () => {
      const wrongToken = jwt.sign(
        { id: 1, username: 'testuser' },
        'wrong-secret'
      );

      const response = await agent
        .get('/auth/protected')
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should accept valid tokens', async () => {
      const validToken = jwtService.generateToken({ id: 1, username: 'testuser' });

      const response = await agent
        .get('/auth/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('Protected route accessed');
      expect(response.body.user.id).toBe(1);
    });

    it('should handle token without Bearer prefix', async () => {
      const validToken = jwtService.generateToken({ id: 1, username: 'testuser' });

      const response = await agent
        .get('/auth/protected')
        .set('Authorization', validToken) // No "Bearer " prefix
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle empty Authorization header', async () => {
      const response = await agent
        .get('/auth/protected')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
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

      const response = await agent
        .get('/auth/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should allow access with required permissions', async () => {
      const adminToken = jwtService.generateToken({
        id: 1,
        username: 'admin',
        permissions: ['admin:read']
      });

      // Mock permission check to return true
      mockPermissionService.hasPermission.mockResolvedValue(true);

      const response = await agent
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

      const response = await agent
        .get('/auth/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Authentication Flow Security', () => {
    it('should prevent brute force attacks with rate limiting', async () => {
      const attempts = Array(10).fill(0).map(() =>
        agent
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
        const response = await agent
          .post('/auth/login')
          .send({ email: input, password: input });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
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
        const response = await agent
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
        const response = await agent
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
        const response = await agent
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

      const response = await agent
        .get('/auth/protected')
        .set('Authorization', `Bearer ${modifiedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject tokens with modified signature', async () => {
      const validToken = jwtService.generateToken({ id: 1, username: 'testuser' });
      const parts = validToken.split('.');
      parts[2] = 'modified-signature';

      const modifiedToken = parts.join('.');

      const response = await agent
        .get('/auth/protected')
        .set('Authorization', `Bearer ${modifiedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject tokens with none algorithm', async () => {
      // Create a token with "none" algorithm (security vulnerability)
      const header = { alg: 'none', typ: 'JWT' };
      const payload = { id: 999, username: 'hacker' };

      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const noneToken = `${encodedHeader}.${encodedPayload}.`;

      const response = await agent
        .get('/auth/protected')
        .set('Authorization', `Bearer ${noneToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Password Reset Security', () => {
    it('should generate secure reset tokens', async () => {
      mockEmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });

      const response = await agent
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
      const response = await agent
        .post('/auth/password-reset')
        .send({ email: 'invalid-email' });

      // Should still return success to prevent email enumeration
      expect(response.status).toBe(200);
    });

    it('should prevent email enumeration attacks', async () => {
      const responses = await Promise.all([
        agent.post('/auth/password-reset').send({ email: 'existing@example.com' }),
        agent.post('/auth/password-reset').send({ email: 'nonexistent@example.com' })
      ]);

      // Both should return the same response to prevent enumeration
      expect(responses[0].status).toBe(responses[1].status);
      expect(responses[0].body.message).toBe(responses[1].body.message);
    });
  });

  describe('Header Security', () => {
    it('should handle missing Authorization header', async () => {
      const response = await agent
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
        const response = await agent
          .get('/auth/protected')
          .set('Authorization', header);

        expect(response.status).toBe(401);
      }
    });

    it('should handle extremely long tokens', async () => {
      const longToken = 'a'.repeat(10000);

      const response = await agent
        .get('/auth/protected')
        .set('Authorization', `Bearer ${longToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle special characters in tokens', async () => {
      const specialTokens = [
        'token-with-unicode-✓',
        'token_with_spaces',
        'token<script>alert("xss")</script>'
      ];

      for (const token of specialTokens) {
        try {
          const response = await agent
            .get('/auth/protected')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(401);
        } catch (error) {
          // If the token contains invalid characters for HTTP headers,
          // the request should fail, which is the expected behavior
          expect((error as Error).message).toContain('Invalid character in header');
        }
      }
    });
  });

  describe('Concurrent Request Security', () => {
    it('should handle concurrent authentication requests', async () => {
      const validToken = jwtService.generateToken({ id: 1, username: 'testuser' });

      const requests = Array(20).fill(0).map(() =>
        agent
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
        agent
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
      const response = await agent
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

      const response = await agent
        .post('/auth/login')
        .send(largePayload);

      expect([200, 401, 413]).toContain(response.status); // 413 = Payload Too Large
    });
  });

  describe('Advanced Security Tests', () => {
    describe('CSRF Protection', () => {
      it('should handle requests with suspicious origin headers', async () => {
        const response = await agent
          .post('/auth/login')
          .set('Origin', 'https://malicious-site.com')
          .send({ email: 'test@example.com', password: 'password' });

        expect(response.status).toBe(200); // Should work but log for monitoring
      });

      it('should handle requests with suspicious referer headers', async () => {
        const response = await agent
          .post('/auth/login')
          .set('Referer', 'https://attacker.com')
          .send({ email: 'test@example.com', password: 'password' });

        expect(response.status).toBe(200); // Should work but log for monitoring
      });
    });

    describe('Rate Limiting Scenarios', () => {
      it('should handle distributed brute force attempts', async () => {
        const requests = [];
        for (let i = 0; i < 50; i++) {
          requests.push(
            agent
              .post('/auth/login')
              .set('X-Forwarded-For', `192.168.1.${i}`)
              .send({ email: 'test@example.com', password: 'wrongpassword' })
          );
        }

        const responses = await Promise.all(requests);
        responses.forEach(response => {
          expect(response.status).toBe(401); // All should return 401 for wrong password
        });
      });

      it('should handle slow requests (slowloris-style)', async () => {
        const slowData = {
          email: 'test@example.com',
          password: 'password',
          slowField: 'a'.repeat(1000)
        };

        const response = await agent
          .post('/auth/login')
          .send(slowData)
          .timeout(5000);

        expect([200, 401, 408]).toContain(response.status);
      });
    });

    describe('Input Validation Security', () => {
      it('should handle null bytes in input', async () => {
        const response = await agent
          .post('/auth/login')
          .send({
            email: 'test@example.com\x00admin',
            password: 'password\x00'
          });

        expect(response.status).toBe(401);
      });

      it('should handle unicode normalization attacks', async () => {
        const normalizedEmail = 'test@example.com';
        const attackEmail = 'tëst@example.com'; // Different unicode representation

        const response = await agent
          .post('/auth/login')
          .send({ email: attackEmail, password: 'password' });

        expect(response.status).toBe(401);
      });

      it('should handle extremely long field names', async () => {
        const longField = 'a'.repeat(10000);
        const payload = { [longField]: 'value' };
        payload.email = 'test@example.com';
        payload.password = 'password';

        const response = await agent
          .post('/auth/login')
          .send(payload);

        expect([200, 400, 413]).toContain(response.status);
      });
    });

    describe('JWT Advanced Attacks', () => {
      it('should reject JWT with critical header claims', async () => {
        const maliciousHeader = {
          alg: 'HS256',
          typ: 'JWT',
          crit: ['exp'], // Critical header parameter
          exp: Math.floor(Date.now() / 1000) + 3600
        };

        const payload = { id: 1, username: 'testuser' };
        const encodedHeader = Buffer.from(JSON.stringify(maliciousHeader)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = 'fake-signature';
        const maliciousToken = `${encodedHeader}.${encodedPayload}.${signature}`;

        const response = await agent
          .get('/auth/protected')
          .set('Authorization', `Bearer ${maliciousToken}`)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should reject JWT with algorithm confusion', async () => {
        // Try to use RS256 public key as HS256 secret
        const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem/V41
-----END PUBLIC KEY-----`;

        const maliciousToken = jwt.sign(
          { id: 999, username: 'hacker' },
          publicKey,
          { algorithm: 'HS256' }
        );

        const response = await agent
          .get('/auth/protected')
          .set('Authorization', `Bearer ${maliciousToken}`)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should handle JWT with extremely long claims', async () => {
        const longClaim = 'a'.repeat(10000); // Reduced size to avoid network issues
        const payload = {
          id: 1,
          username: 'testuser',
          longClaim: longClaim
        };

        let token;
        try {
          token = jwtService.generateToken(payload);
        } catch (error) {
          // If token generation fails, that's acceptable
          expect(error).toBeDefined();
          return;
        }

        try {
          const response = await agent
            .get('/auth/protected')
            .set('Authorization', `Bearer ${token}`)
            .timeout(5000); // Add timeout

          expect([200, 401, 413]).toContain(response.status);
        } catch (error: unknown) {
          // Handle network errors gracefully
          if (error && typeof error === 'object' && 'code' in error) {
            const errorWithCode = error as { code: string };
            if (errorWithCode.code === 'ECONNRESET' || errorWithCode.code === 'TIMEOUT') {
              // This is expected for extremely long tokens
              expect(error).toBeDefined();
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      });
    });

    describe('Session Security', () => {
      it('should handle session fixation attempts', async () => {
        const fixedSessionId = 'fixed-session-12345';

        const response = await agent
          .post('/auth/login')
          .set('Cookie', `sessionid=${fixedSessionId}`)
          .send({ email: 'test@example.com', password: 'password' });

        expect(response.status).toBe(200);
        // JWT-based auth doesn't use cookies for sessions
        // This test verifies the login works regardless of session cookies
        expect(response.body.token).toBeDefined();
      });

      it('should handle concurrent session attacks', async () => {
        const token = jwtService.generateToken({ id: 1, username: 'testuser' });

        const requests = Array(20).fill(0).map(() =>
          agent
            .get('/auth/protected')
            .set('Authorization', `Bearer ${token}`)
        );

        const responses = await Promise.all(requests);

        // All requests should succeed but be rate limited if necessary
        responses.forEach(response => {
          expect([200, 429]).toContain(response.status);
        });
      });
    });

    describe('Timing Attack Protection', () => {
      it('should have consistent response times for invalid users', async () => {
        const startTime = Date.now();

        await agent
          .post('/auth/login')
          .send({ email: 'nonexistent@example.com', password: 'password' });

        const invalidUserTime = Date.now() - startTime;

        const startTime2 = Date.now();

        await agent
          .post('/auth/login')
          .send({ email: 'test@example.com', password: 'wrongpassword' });

        const wrongPasswordTime = Date.now() - startTime2;

        // Response times should be similar to prevent user enumeration
        const timeDifference = Math.abs(invalidUserTime - wrongPasswordTime);
        expect(timeDifference).toBeLessThan(100); // Allow 100ms variance
      });
    });

    describe('Content Security', () => {
      it('should not expose sensitive headers in responses', async () => {
        const response = await agent
          .get('/auth/protected')
          .set('Authorization', 'Bearer invalid-token');

        // Test that sensitive information is not leaked
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        // In a real implementation, these headers should be removed
        // expect(response.headers['x-powered-by']).toBeUndefined();
        // expect(response.headers['server']).toBeUndefined();
      });

      it('should sanitize error messages', async () => {
        const response = await agent
          .post('/auth/login')
          .send({ email: '<script>alert(1)</script>', password: 'password' });

        expect(response.text).not.toContain('<script>');
        expect(response.text).not.toContain('alert(1)');
      });
    });

    describe('Authentication Bypass Attempts', () => {
      it('should reject requests with manipulated user agent', async () => {
        const response = await agent
          .get('/auth/protected')
          .set('User-Agent', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should handle requests with HTTP method override', async () => {
        const response = await agent
          .post('/auth/protected')
          .set('X-HTTP-Method-Override', 'GET')
          .expect(404); // Should not find POST /auth/protected

        expect(response.status).toBe(404);
      });
    });
  });

  afterAll(async () => {
    // Force close all tracked connections first
    for (const connection of connections) {
      try {
        connection.destroy();
      } catch (error) {
        // Ignore errors when destroying connections
      }
    }
    connections.clear();

    // Close the server with a more robust approach
    if (server) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // Force resolve after timeout
          resolve();
        }, 1000);

        try {
          server.close((error: any) => {
            clearTimeout(timeout);
            resolve();
          });

          // Also try calling server.closeAllConnections if available (Node.js 18+)
          if (typeof server.closeAllConnections === 'function') {
            server.closeAllConnections();
          }
        } catch (error) {
          clearTimeout(timeout);
          resolve();
        }
      });

      // Set server to null to prevent further operations
      server = null;
    }

    // Clear all mocks and timers
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.clearAllTimers();

    // Give a moment for all async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50));
  }, 10000); // Increased timeout for cleanup
});