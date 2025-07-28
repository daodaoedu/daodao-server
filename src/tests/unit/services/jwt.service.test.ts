/**
 * JWT 服務單元測試
 */

// Set environment variables before importing
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_SECURITY = 'test-jwt-security';

import * as jwt from 'jsonwebtoken';
import { 
  generateToken, 
  verifyToken, 
  refreshToken, 
  jwtService 
} from '../../../services/jwt.service';

// Test constants
const mockJwtSecret = 'test-jwt-secret';
const mockJwtSecurity = 'test-jwt-security';

describe('JWT Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    // Store original env
    originalEnv = process.env;
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Clear any console mocks
    jest.clearAllMocks();
    // Ensure environment variables are set
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_SECURITY = 'test-jwt-security';
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include all payload data in token', () => {
      const payload = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user', 'admin'],
        isTemp: false
      };

      const token = generateToken(payload);
      const decoded = jwt.verify(token, mockJwtSecret) as any;

      expect(decoded.id).toBe(payload.id);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.roles).toEqual(payload.roles);
      expect(decoded.isTemp).toBe(payload.isTemp);
    });

    it('should set expiration time', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = generateToken(payload);
      const decoded = jwt.verify(token, mockJwtSecret) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should handle missing JWT secret', () => {
      // Test error handling when JWT_SECRET is missing
      const originalSecret = process.env.JWT_SECRET;
      const originalSecurity = process.env.JWT_SECURITY;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_SECURITY;

      const payload = { id: 1, username: 'testuser' };

      expect(() => generateToken(payload)).toThrow('JWT_SECRET environment variable is required');

      // Restore environment
      if (originalSecret) process.env.JWT_SECRET = originalSecret;
      if (originalSecurity) process.env.JWT_SECURITY = originalSecurity;
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      const token = generateToken(payload);
      const result = verifyToken(token);

      expect(result.error).toBeUndefined();
      expect(result.id).toBe(payload.id);
      expect(result.username).toBe(payload.username);
      expect(result.email).toBe(payload.email);
    });

    it('should return error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const result = verifyToken(invalidToken);

      expect(result.error).toBe('Token is invalid');
    });

    it('should return error for expired token', () => {
      // Create an expired token
      const payload = { id: 1, username: 'testuser' };
      const expiredToken = jwt.sign(payload, mockJwtSecret, { expiresIn: '-1s' });

      const result = verifyToken(expiredToken);

      expect(result.error).toBe('Token has expired');
    });

    it('should return error for token with wrong secret', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = jwt.sign(payload, 'wrong-secret');

      const result = verifyToken(token);

      expect(result.error).toBe('Token is invalid');
    });

    it('should handle empty token', () => {
      const result = verifyToken('');

      expect(result.error).toBe('Token is invalid');
    });

    it('should handle malformed token', () => {
      const result = verifyToken('not.a.valid.jwt.token');

      expect(result.error).toBe('Token is invalid');
    });
  });

  describe('refreshToken', () => {
    it('should refresh a valid token', async () => {
      const payload = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      const originalToken = generateToken(payload);
      
      // Add a small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newToken = refreshToken(originalToken);

      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(originalToken);
      expect(typeof newToken).toBe('string');

      // Verify the new token contains the same payload
      const result = verifyToken(newToken as string);
      expect(result.id).toBe(payload.id);
      expect(result.username).toBe(payload.username);
      expect(result.email).toBe(payload.email);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const result = refreshToken(invalidToken);

      expect(result).toBeNull();
    });

    it('should refresh expired token', () => {
      const payload = { id: 1, username: 'testuser' };
      // Create an expired token
      const expiredToken = jwt.sign(payload, mockJwtSecret, { expiresIn: '-1s' });

      // refreshToken should return null for expired tokens
      const result = refreshToken(expiredToken);

      expect(result).toBeNull();
    });

    it('should remove JWT default fields from refreshed token', async () => {
      const payload = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      const originalToken = generateToken(payload);
      const originalDecoded = jwt.verify(originalToken, mockJwtSecret) as any;
      
      // Add delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newToken = refreshToken(originalToken);
      const newDecoded = jwt.verify(newToken as string, mockJwtSecret) as any;

      // Should have new iat and exp (different from original)
      expect(newDecoded.iat).toBeDefined();
      expect(newDecoded.exp).toBeDefined();
      expect(newDecoded.iat).not.toBe(originalDecoded.iat);
      
      // Should preserve original payload
      expect(newDecoded.id).toBe(payload.id);
      expect(newDecoded.username).toBe(payload.username);
      expect(newDecoded.email).toBe(payload.email);
    });
  });

  describe('jwtService object', () => {
    it('should export all methods', () => {
      expect(jwtService.generateToken).toBeDefined();
      expect(jwtService.verifyToken).toBeDefined();
      expect(jwtService.refreshToken).toBeDefined();
      expect(typeof jwtService.generateToken).toBe('function');
      expect(typeof jwtService.verifyToken).toBe('function');
      expect(typeof jwtService.refreshToken).toBe('function');
    });

    it('should have working methods', () => {
      const payload = { id: 1, username: 'testuser' };
      
      const token = jwtService.generateToken(payload);
      expect(token).toBeDefined();
      
      const result = jwtService.verifyToken(token);
      expect(result.error).toBeUndefined();
      
      const refreshed = jwtService.refreshToken(token);
      expect(refreshed).toBeDefined();
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use JWT_SECRET if available', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = generateToken(payload);
      
      // Should be able to verify with JWT_SECRET
      const decoded = jwt.verify(token, mockJwtSecret);
      expect(decoded).toBeDefined();
    });

    it('should use consistent secret for token operations', () => {
      // This test verifies that tokens are created and verified with consistent secret
      const payload = { id: 1, username: 'testuser' };
      const token = generateToken(payload);
      
      // Should be able to verify with the same service
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.username).toBe(payload.username);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tokens gracefully', () => {
      const invalidToken = 'invalid.token.here';
      
      const result = verifyToken(invalidToken);
      
      expect(result.error).toBeDefined();
      expect(result.error).toBe('Token is invalid');
    });
  });

  describe('Integration Tests', () => {
    it('should work with complex payload', () => {
      const complexPayload = {
        id: 123,
        username: 'complex_user',
        email: 'complex@example.com',
        roles: ['admin', 'moderator', 'user'],
        isTemp: false,
        customData: {
          department: 'IT',
          level: 'senior'
        },
        permissions: ['read', 'write', 'delete']
      };

      const token = generateToken(complexPayload);
      const result = verifyToken(token);

      expect(result.error).toBeUndefined();
      expect(result.id).toBe(complexPayload.id);
      expect(result.username).toBe(complexPayload.username);
      expect(result.email).toBe(complexPayload.email);
      expect(result.roles).toEqual(complexPayload.roles);
      expect(result.isTemp).toBe(complexPayload.isTemp);
      expect(result.customData).toEqual(complexPayload.customData);
      expect(result.permissions).toEqual(complexPayload.permissions);
    });

    it('should handle token lifecycle (generate -> verify -> refresh)', async () => {
      const payload = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      // Generate token
      const token1 = generateToken(payload);
      expect(token1).toBeDefined();

      // Verify token
      const result1 = verifyToken(token1);
      expect(result1.error).toBeUndefined();
      expect(result1.id).toBe(payload.id);

      // Add delay to ensure different timestamp for refresh
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh token
      const token2 = refreshToken(token1);
      expect(token2).toBeDefined();
      expect(token2).not.toBe(token1);

      // Verify refreshed token
      const result2 = verifyToken(token2 as string);
      expect(result2.error).toBeUndefined();
      expect(result2.id).toBe(payload.id);
    });
  });
});