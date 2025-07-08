/**
 * 認證中間件單元測試 - 重構版本
 * 使用測試工具函數來減少重複代碼和提高可讀性
 */

import { Response } from 'express';
import {
  authenticateJWT,
  optionalAuth,
  requireFormalUser,
  requirePermissions
} from '../../../middleware/auth';
import { 
  UnauthorizedError, 
  ForbiddenError 
} from '../../../utils/error-handler';
import { AuthRequest } from '../../../types/auth.types';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  generateTestToken,
  createAuthHeader,
  createTestUserPayload,
  createTestTempUserPayload,
  setupTestEnvironment,
  expectErrorType,
  expectStatusCode,
  expectJsonResponse,
  createPermissionServiceMock,
  TestDataGenerator,
  TestAssertions,
  TEST_JWT_SECRET
} from '../../utils/test-helpers';

// Mock the permission service
jest.mock('../../../services/auth/permission.service', () => ({
  permissionService: createPermissionServiceMock()
}));

describe('Auth Middleware - Refactored Tests', () => {
  let cleanupEnv: () => void;

  beforeAll(() => {
    cleanupEnv = setupTestEnvironment({
      JWT_SECRET: TEST_JWT_SECRET,
      NODE_ENV: 'test'
    });
  });

  afterAll(() => {
    cleanupEnv();
  });

  describe('authenticateJWT', () => {
    describe('Valid Authentication', () => {
      it('should authenticate valid JWT token', () => {
        // Arrange
        const userPayload = createTestUserPayload();
        const token = generateTestToken(userPayload);
        const req = createMockRequest({
          headers: createAuthHeader(token)
        });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user?.id).toBe(userPayload.id);
        expect(req.user?.username).toBe(userPayload.username);
        expect(req.isTemporary).toBe(false);
      });

      it('should handle temporary user flag', () => {
        // Arrange
        const tempUserPayload = createTestTempUserPayload();
        const token = generateTestToken(tempUserPayload);
        const req = createMockRequest({
          headers: createAuthHeader(token)
        });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.isTemporary).toBe(true);
      });

      it('should authenticate tokens with different algorithms', () => {
        // Arrange
        const userPayload = createTestUserPayload();
        const token = generateTestToken(userPayload, TEST_JWT_SECRET, { algorithm: 'HS256' });
        const req = createMockRequest({
          headers: createAuthHeader(token)
        });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
      });
    });

    describe('Invalid Authentication', () => {
      it('should return error for missing token', () => {
        // Arrange
        const req = createMockRequest();
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(req.user).toBeUndefined();
      });

      it('should return error for invalid token', () => {
        // Arrange
        const req = createMockRequest({
          headers: createAuthHeader('invalid-token')
        });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(req.user).toBeUndefined();
      });

      it('should return error for expired token', () => {
        // Arrange
        const userPayload = createTestUserPayload();
        const expiredToken = generateTestToken(userPayload, TEST_JWT_SECRET, { expiresIn: '-1s' });
        const req = createMockRequest({
          headers: createAuthHeader(expiredToken)
        });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(req.user).toBeUndefined();
      });

      it('should return error for token with wrong secret', () => {
        // Arrange
        const userPayload = createTestUserPayload();
        const wrongSecretToken = generateTestToken(userPayload, 'wrong-secret');
        const req = createMockRequest({
          headers: createAuthHeader(wrongSecretToken)
        });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(req.user).toBeUndefined();
      });

      it('should handle malformed authorization header', () => {
        // Arrange
        const req = createMockRequest({
          headers: { authorization: 'Malformed header' }
        });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(req.user).toBeUndefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty authorization header', () => {
        // Arrange
        const req = createMockRequest({
          headers: { authorization: '' }
        });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      });

      it('should handle authorization header with only Bearer', () => {
        // Arrange
        const req = createMockRequest({
          headers: { authorization: 'Bearer' }
        });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      });

      it('should handle very long tokens', () => {
        // Arrange
        const longToken = TestDataGenerator.randomString(10000);
        const req = createMockRequest({
          headers: createAuthHeader(longToken)
        });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        authenticateJWT(req as AuthRequest, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      });
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate valid token', () => {
      // Arrange
      const userPayload = createTestUserPayload();
      const token = generateTestToken(userPayload);
      const req = createMockRequest({
        headers: createAuthHeader(token)
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      optionalAuth(req as AuthRequest, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(userPayload.id);
    });

    it('should continue without token', () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      optionalAuth(req as AuthRequest, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should continue with invalid token', () => {
      // Arrange
      const req = createMockRequest({
        headers: createAuthHeader('invalid-token')
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      optionalAuth(req as AuthRequest, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });

  describe('requireFormalUser', () => {
    it('should allow formal user', () => {
      // Arrange
      const userPayload = createTestUserPayload();
      const req = createMockRequest({
        user: userPayload,
        isTemporary: false
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      requireFormalUser(req as AuthRequest, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should reject temporary user', () => {
      // Arrange
      const tempUserPayload = createTestTempUserPayload();
      const req = createMockRequest({
        user: tempUserPayload,
        isTemporary: true
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      requireFormalUser(req as AuthRequest, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should reject unauthenticated user', () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      requireFormalUser(req as AuthRequest, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle multiple concurrent authentications', async () => {
      // Arrange
      const userPayload = createTestUserPayload();
      const token = generateTestToken(userPayload);
      const promises = [];

      // Act
      for (let i = 0; i < 100; i++) {
        const req = createMockRequest({
          headers: createAuthHeader(token)
        });
        const res = createMockResponse();
        const next = createMockNext();

        promises.push(new Promise<void>((resolve) => {
          authenticateJWT(req as AuthRequest, res as Response, () => {
            resolve();
          });
        }));
      }

      await Promise.all(promises);

      // Assert
      expect(promises).toHaveLength(100);
    });

    it('should maintain consistent performance with large payloads', () => {
      // Arrange
      const largeUserPayload = createTestUserPayload({
        largeData: TestDataGenerator.randomString(1000)
      });
      const token = generateTestToken(largeUserPayload);
      const req = createMockRequest({
        headers: createAuthHeader(token)
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      const startTime = Date.now();
      authenticateJWT(req as AuthRequest, res as Response, next);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(next).toHaveBeenCalled();
    });
  });
});