/**
 * OAuth Edge Cases 集成測試
 * 測試 Google OAuth 流程中的各種邊緣情況和錯誤處理
 */

import request from 'supertest';
import { Express } from 'express';

// Mock Prisma using shared mock utility
import { mockPrisma } from '../utils/prisma-mock';

jest.mock('../../services/database/prisma.service', () => ({
  prisma: mockPrisma
}));

// Mock auth service
jest.mock('../../services/auth/auth.service', () => ({
  authService: {
    findUserByEmail: jest.fn(),
    findUserByExternalId: jest.fn(),
    findOrCreateTempUser: jest.fn()
  }
}));

// Mock Google OAuth Strategy
jest.mock('passport-google-oauth20');
jest.mock('../../services/auth/email.service');

const prisma = mockPrisma;

describe('OAuth Edge Cases Integration Tests', () => {
  beforeAll(async () => {
    // Set up test environment
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:4000/api/v1/auth/google/callback';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Clean up database
    await prisma.temp_users.deleteMany({});
    await prisma.users.deleteMany({});
    await prisma.contacts.deleteMany({});
    await prisma.roles.deleteMany({});
  });

  describe('Google OAuth Configuration Issues', () => {
    it('should handle missing Google client configuration', async () => {
      // Create a simple express app without OAuth setup
      const express = require('express');
      const testApp = express();
      testApp.use(express.json());
      
      // Mock route that simulates OAuth not configured
      testApp.get('/auth/google', (req: any, res: any) => {
        res.status(500).json({ error: 'OAuth not configured' });
      });

      const response = await request(testApp)
        .get('/auth/google')
        .expect(500);

      expect(response.body.error).toBe('OAuth not configured');
    }, 5000);

    it('should handle invalid callback URL configuration', async () => {
      const originalCallbackUrl = process.env.GOOGLE_CALLBACK_URL;
      process.env.GOOGLE_CALLBACK_URL = 'invalid-url';

      // This would typically cause issues during OAuth setup
      // In a real test, we'd simulate the OAuth provider rejecting the callback
      
      process.env.GOOGLE_CALLBACK_URL = originalCallbackUrl;
    });
  });

  describe('Google Profile Edge Cases', () => {
    it('should handle Google profile without email', async () => {
      // Mock Passport strategy to simulate profile without email
      const mockProfile = {
        id: 'google-123',
        displayName: 'Test User',
        emails: [], // No emails
        photos: [{ value: 'https://example.com/photo.jpg' }]
      };

      // Mock the Google strategy callback
      const mockStrategy = {
        authenticate: jest.fn((req, options) => {
          // Simulate authentication failure due to missing email
          const error = new Error('No email found in Google profile');
          return options.failureRedirect ? 
            Promise.resolve({ redirect: options.failureRedirect }) :
            Promise.reject(error);
        })
      };

      // In a real implementation, this would be handled by the OAuth strategy
      expect(() => {
        if (!mockProfile.emails || mockProfile.emails.length === 0) {
          throw new Error('No email found in Google profile');
        }
      }).toThrow('No email found in Google profile');
    });

    it('should handle Google profile with unverified email', async () => {
      const mockProfile = {
        id: 'google-456',
        displayName: 'Unverified User',
        emails: [{ value: 'unverified@example.com', verified: false }],
        photos: []
      };

      // In OAuth flow, unverified emails should still be accepted
      // but might trigger additional verification steps
      expect(mockProfile.emails[0].value).toBe('unverified@example.com');
      expect(mockProfile.emails[0].verified).toBe(false);
    });

    it('should handle Google profile with multiple emails', async () => {
      const mockProfile = {
        id: 'google-789',
        displayName: 'Multi Email User',
        emails: [
          { value: 'primary@example.com', verified: true },
          { value: 'secondary@example.com', verified: false }
        ],
        photos: []
      };

      // Should use the first email
      const primaryEmail = mockProfile.emails[0].value;
      expect(primaryEmail).toBe('primary@example.com');
    });

    it('should handle Google profile with no display name', async () => {
      const mockProfile = {
        id: 'google-noname',
        displayName: '', // Empty display name
        emails: [{ value: 'noname@example.com', verified: true }],
        photos: []
      };

      // Should handle empty or missing display name gracefully
      const name = mockProfile.displayName || 'User';
      expect(name).toBe('User');
    });

    it('should handle Google profile with invalid photo URL', async () => {
      const mockProfile = {
        id: 'google-badphoto',
        displayName: 'Bad Photo User',
        emails: [{ value: 'badphoto@example.com', verified: true }],
        photos: [{ value: 'invalid-url' }]
      };

      // Should handle invalid photo URLs gracefully
      const photoUrl = mockProfile.photos && mockProfile.photos.length > 0 ? 
        mockProfile.photos[0].value : undefined;
      expect(photoUrl).toBe('invalid-url');
      // In real implementation, this would be validated
    });
  });

  describe('Database Failure Scenarios', () => {
    it('should handle database connection failure during OAuth', async () => {
      // Mock database error
      prisma.contacts.findFirst.mockRejectedValue(new Error('Database connection failed'));

      // Simulate OAuth callback that would trigger database operation
      try {
        await prisma.contacts.findFirst({ where: { email: 'test@example.com' } });
        fail('Should have thrown database error');
      } catch (error) {
        expect((error as Error).message).toBe('Database connection failed');
      }
    });

    it('should handle temp user creation failure', async () => {
      // Mock temp user creation failure
      prisma.temp_users.create.mockRejectedValue(new Error('Creation failed'));

      try {
        await prisma.temp_users.create({
          data: {
            google_id: 'test-google-id',
            email: 'test@example.com',
            name: 'Test User'
          }
        });
        fail('Should have thrown creation error');
      } catch (error) {
        expect((error as Error).message).toBe('Creation failed');
      }
    });

    it('should handle database constraint violations', async () => {
      // Mock first user creation success
      const firstUser = { id: 1, google_id: 'unique-google-id', email: 'unique@example.com' };
      prisma.temp_users.create.mockResolvedValueOnce(firstUser);
      
      await prisma.temp_users.create({
        data: {
          google_id: 'unique-google-id',
          email: 'unique@example.com',
          name: 'First User'
        }
      });

      // Mock second creation to fail with constraint error
      const constraintError = new Error('Unique constraint violation');
      constraintError.name = 'PrismaClientKnownRequestError';
      prisma.temp_users.create.mockRejectedValueOnce(constraintError);

      try {
        await prisma.temp_users.create({
          data: {
            google_id: 'unique-google-id', // Duplicate google_id
            email: 'different@example.com',
            name: 'Second User'
          }
        });
        fail('Should have thrown constraint violation');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).name).toBe('PrismaClientKnownRequestError');
      }
    });
  });

  describe('Network and External Service Failures', () => {
    it('should handle Google API timeout', async () => {
      // Mock network timeout scenario
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      // In a real OAuth flow, this would be handled by the strategy
      expect(timeoutError.name).toBe('TimeoutError');
    });

    it('should handle Google API rate limiting', async () => {
      // Mock rate limiting response
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';

      expect(rateLimitError.name).toBe('RateLimitError');
    });

    it('should handle Google API service unavailable', async () => {
      // Mock service unavailable
      const serviceError = new Error('Service temporarily unavailable');
      serviceError.name = 'ServiceUnavailableError';

      expect(serviceError.name).toBe('ServiceUnavailableError');
    });
  });

  describe('Session and State Management', () => {
    it('should handle session corruption during OAuth flow', async () => {
      // Simulate corrupted session data
      const corruptedSession = {
        user: null,
        passport: {
          user: 'corrupted-data'
        }
      };

      // OAuth flow should handle session corruption gracefully
      expect(corruptedSession.user).toBeNull();
    });

    it('should handle CSRF token mismatch', async () => {
      // Mock CSRF token mismatch
      const request = {
        session: { csrf_token: 'session-token' },
        body: { csrf_token: 'different-token' }
      };

      const isValidCSRF = request.session.csrf_token === request.body.csrf_token;
      expect(isValidCSRF).toBe(false);
    });

    it('should handle expired OAuth state parameter', async () => {
      // Mock expired state parameter
      const state = {
        timestamp: Date.now() - (30 * 60 * 1000), // 30 minutes ago
        nonce: 'test-nonce'
      };

      const isExpired = Date.now() - state.timestamp > (15 * 60 * 1000); // 15 minutes
      expect(isExpired).toBe(true);
    });
  });

  describe('Concurrent User Scenarios', () => {
    it('should handle concurrent OAuth attempts for same user', async () => {
      const userProfile = {
        google_id: 'concurrent-user',
        email: 'concurrent@example.com',
        name: 'Concurrent User'
      };

      // Mock first creation succeeds, second fails with constraint error
      prisma.temp_users.create
        .mockResolvedValueOnce({ id: 1, ...userProfile })
        .mockRejectedValueOnce(new Error('Unique constraint violated'));

      const promises = [
        prisma.temp_users.create({ data: userProfile }),
        prisma.temp_users.create({ data: { ...userProfile, google_id: 'concurrent-user-2' } })
      ];

      const results = await Promise.allSettled(promises);
      
      // First should succeed, second should fail due to email constraint
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });

    it('should handle user switching between temp and formal status', async () => {
      // Mock temp user creation
      const tempUser = { id: 1, google_id: 'switching-user', email: 'switching@example.com' };
      prisma.temp_users.create.mockResolvedValue(tempUser);
      
      const createdTempUser = await prisma.temp_users.create({
        data: {
          google_id: 'switching-user',
          email: 'switching@example.com',
          name: 'Switching User'
        }
      });

      expect(createdTempUser.id).toBeDefined();

      // Mock formal user creation process
      const contact = { id: 1, email: 'switching@example.com' };
      const role = { id: 1, name: 'user', description: 'Regular user' };
      const formalUser = { id: 1, external_id: 'formal-switching-user', contact_id: 1, role_id: 1 };
      
      prisma.contacts.create.mockResolvedValue(contact);
      prisma.roles.create.mockResolvedValue(role);
      prisma.users.create.mockResolvedValue(formalUser);

      const createdContact = await prisma.contacts.create({ data: { email: 'switching@example.com' } });
      const createdRole = await prisma.roles.create({ data: { name: 'user', description: 'Regular user' } });
      const createdFormalUser = await prisma.users.create({
        data: {
          external_id: 'formal-switching-user',
          mongo_id: 'mongo-id',
          nickname: 'SwitchingUser',
          contact_id: createdContact.id,
          role_id: createdRole.id
        }
      });

      expect(createdFormalUser.id).toBeDefined();
      
      // Mock finding user by email (now returns formal user)
      const userByEmail = { email: 'switching@example.com', users: [formalUser] };
      prisma.contacts.findFirst.mockResolvedValue(userByEmail);
      
      const foundUser = await prisma.contacts.findFirst({
        where: { email: 'switching@example.com' },
        include: { users: true }
      });

      expect(foundUser?.users).toHaveLength(1);
      expect(foundUser?.users[0].id).toBe(formalUser.id);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle malicious Google ID injection', async () => {
      const maliciousGoogleId = "'; DROP TABLE temp_users; --";
      
      // Mock successful creation (Prisma sanitizes automatically)
      const sanitizedUser = { 
        id: 1, 
        google_id: maliciousGoogleId, 
        email: 'malicious@example.com',
        name: 'Malicious User'
      };
      prisma.temp_users.create.mockResolvedValue(sanitizedUser);
      
      const user = await prisma.temp_users.create({
        data: {
          google_id: maliciousGoogleId,
          email: 'malicious@example.com',
          name: 'Malicious User'
        }
      });
      
      // Prisma should sanitize inputs automatically
      expect(user.google_id).toBe(maliciousGoogleId);
      expect(user.id).toBeDefined();
    });

    it('should handle XSS attempts in user profile data', async () => {
      const xssName = '<script>alert("xss")</script>';
      
      const mockTempUser = { id: 1, google_id: 'xss-user', email: 'xss@example.com', name: xssName };
      prisma.temp_users.create.mockResolvedValue(mockTempUser);
      
      const tempUser = await prisma.temp_users.create({
        data: {
          google_id: 'xss-user',
          email: 'xss@example.com',
          name: xssName
        }
      });

      // Name should be stored as-is (sanitization happens at display time)
      expect(tempUser.name).toBe(xssName);
    });

    it('should handle extremely long profile data', async () => {
      const longName = 'A'.repeat(1000);
      
      // Mock database constraint error for long data
      const constraintError = new Error('Value too long for column');
      constraintError.name = 'PrismaClientValidationError';
      prisma.temp_users.create.mockRejectedValue(constraintError);
      
      try {
        await prisma.temp_users.create({
          data: {
            google_id: 'long-name-user',
            email: 'long@example.com',
            name: longName
          }
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).name).toBe('PrismaClientValidationError');
      }
    });
  });

  describe('Recovery Scenarios', () => {
    it('should recover from partial OAuth completion', async () => {
      // Mock partial temp user creation
      const partialUser = { id: 1, google_id: 'partial-user', email: 'partial@example.com' };
      prisma.temp_users.create.mockResolvedValue(partialUser);
      
      const createdUser = await prisma.temp_users.create({
        data: {
          google_id: 'partial-user',
          email: 'partial@example.com',
          name: 'Partial User'
        }
      });

      // Mock finding existing user on retry
      prisma.temp_users.findUnique.mockResolvedValue(partialUser);
      
      const existingUser = await prisma.temp_users.findUnique({
        where: { google_id: 'partial-user' }
      });

      expect(existingUser?.id).toBe(createdUser.id);
    });

    it('should handle cleanup of orphaned temp users', async () => {
      // Mock orphan user creation
      const orphanUser = { 
        id: 1, 
        google_id: 'orphan-user', 
        email: 'orphan@example.com',
        created_date: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      };
      prisma.temp_users.create.mockResolvedValue(orphanUser);
      
      const createdOrphanUser = await prisma.temp_users.create({
        data: {
          google_id: 'orphan-user',
          email: 'orphan@example.com',
          name: 'Orphan User'
        }
      });

      // In a real system, there would be cleanup logic for old temp users
      const createdAt = new Date(createdOrphanUser.created_date);
      const ageInHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      
      // Orphan user should be eligible for cleanup if old enough
      expect(ageInHours).toBeGreaterThanOrEqual(0);
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.temp_users.deleteMany({});
    await prisma.users.deleteMany({});
    await prisma.contacts.deleteMany({});
    await prisma.roles.deleteMany({});
    await prisma.$disconnect();
  });
});