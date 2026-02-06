/**
 * Auth Service Unit Tests
 * Tests authentication service business logic in isolation
 * 
 * Focus: Business logic validation, data transformation, error handling
 * Mocks: All external dependencies (database, bcrypt, JWT)
 */

import { prismaMock, mockResponses, PRISMA_ERRORS, mockPrismaError, setupTransactionMock } from '@tests/utils/prisma-mock';
import { createTestUser, createTestToken } from '@tests/utils/test-factories';
import bcrypt from 'bcrypt';

// Mock userService
const mockUserService = {
  updateLastLogin: jest.fn()
};

// Mock emailService
const mockEmailService = {
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined)
};

// Mock external dependencies
jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('bcrypt');
jest.mock('@/services/jwt.service', () => ({
  jwtService: {
    generateToken: jest.fn()
  }
}));

jest.mock('@/services/user.service', () => ({
  userService: mockUserService
}));

jest.mock('@/services/email/email.service', () => ({
  emailService: mockEmailService
}));

// Import mocked modules
import { jwtService } from '@/services/jwt.service';
import { authService } from '@/services/auth/auth.service';

describe('Auth Service', () => {
  const mockJwtService = jwtService as jest.Mocked<typeof jwtService>;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Prisma mock is already reset in prisma-mock.ts
  });

  // Test data factories
  const createTestContact = (overrides = {}) => ({
    id: 1,
    google_id: 'google-123',
    apple_id: null,
    photo_url: null,
    is_subscribe_email: false,
    email: 'test@example.com',
    ig: null,
    discord: null,
    line: null,
    fb: null,
    // New fields added to contacts table
    threads: null,
    linkedin: null,
    github: null,
    website: null,
    users: [createTestUser({ id: 1 })],
    ...overrides
  });

  const createTestTempUser = (overrides = {}) => ({
    id: 1,
    google_id: 'google-123',
    apple_id: null,
    email: 'temp@example.com',
    name: 'Temp User',
    photo_url: 'https://example.com/photo.jpg',
    created_date: new Date(),
    updated_date: new Date(),
    ...overrides
  });

  describe('findUserByEmail', () => {
    it('should find user by email and return success response', async () => {
      const mockContact = createTestContact();
      prismaMock.contacts.findFirst.mockResolvedValue(mockContact);

      const result = await authService.findUserByEmail('test@example.com');

      expect(prismaMock.contacts.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          users: {
            include: {
              roles: true,
              user_positions: {
                include: {
                  position: true
                }
              }
            }
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        contact: mockContact,
        user: mockContact.users[0]
      });
    });

    it('should return null data when contact not found', async () => {
      prismaMock.contacts.findFirst.mockResolvedValue(null);

      const result = await authService.findUserByEmail('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should return null data when contact has no users', async () => {
      const mockContact = createTestContact({ users: [] });
      prismaMock.contacts.findFirst.mockResolvedValue(mockContact);

      const result = await authService.findUserByEmail('test@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should propagate database errors', async () => {
      const dbError = mockPrismaError(PRISMA_ERRORS.CONNECTION_ERROR, 'Database connection failed');
      prismaMock.contacts.findFirst.mockRejectedValue(dbError);

      await expect(authService.findUserByEmail('test@example.com'))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('findOrCreateTempUser', () => {
    const mockProfile = {
      googleId: 'google-123',
      email: 'temp@example.com',
      name: 'Temp User',
      photoUrl: 'https://example.com/photo.jpg'
    };

    it('should return existing temp user in success response', async () => {
      const existingTempUser = createTestTempUser();
      prismaMock.temp_users.findFirst.mockResolvedValue(existingTempUser);

      const result = await authService.findOrCreateTempUser(mockProfile);

      expect(prismaMock.temp_users.findFirst).toHaveBeenCalledWith({
        where: { google_id: 'google-123' }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ user: existingTempUser, isNewUser: false });
      expect(prismaMock.temp_users.create).not.toHaveBeenCalled();
    });

    it('should create new temp user when not found', async () => {
      const newTempUser = createTestTempUser();

      prismaMock.temp_users.findFirst
        .mockResolvedValueOnce(null) // googleId check
        .mockResolvedValueOnce(null); // email check
      prismaMock.temp_users.create.mockResolvedValue(newTempUser);

      const result = await authService.findOrCreateTempUser(mockProfile);

      expect(prismaMock.temp_users.findFirst).toHaveBeenNthCalledWith(1, {
        where: { google_id: 'google-123' }
      });
      expect(prismaMock.temp_users.findFirst).toHaveBeenNthCalledWith(2, {
        where: { email: 'temp@example.com' }
      });
      expect(prismaMock.temp_users.create).toHaveBeenCalledWith({
        data: {
          google_id: 'google-123',
          email: 'temp@example.com',
          name: 'Temp User',
          photo_url: 'https://example.com/photo.jpg'
        }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ user: newTempUser, isNewUser: true });
    });

    it('should throw ConflictError when email already exists', async () => {
      const existingByEmail = createTestTempUser({
        google_id: 'different-id',
        email: 'temp@example.com'
      });

      prismaMock.temp_users.findFirst
        .mockResolvedValueOnce(null) // googleId check
        .mockResolvedValueOnce(existingByEmail); // email check

      await expect(authService.findOrCreateTempUser(mockProfile))
        .rejects.toThrow('此電子郵件已被使用');

      expect(prismaMock.temp_users.create).not.toHaveBeenCalled();
    });

    it('should handle profile without photoUrl', async () => {
      const profileWithoutPhoto = {
        googleId: 'google-456',
        email: 'nophoto@example.com',
        name: 'No Photo User'
      };

      const newTempUser = createTestTempUser({
        google_id: 'google-456',
        email: 'nophoto@example.com',
        name: 'No Photo User',
        photo_url: undefined
      });

      prismaMock.temp_users.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prismaMock.temp_users.create.mockResolvedValue(newTempUser);

      const result = await authService.findOrCreateTempUser(profileWithoutPhoto);

      expect(prismaMock.temp_users.create).toHaveBeenCalledWith({
        data: {
          google_id: 'google-456',
          email: 'nophoto@example.com',
          name: 'No Photo User',
          photo_url: undefined
        }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ user: newTempUser, isNewUser: true });
    });

    it('should handle database errors during creation', async () => {
      prismaMock.temp_users.findFirst.mockResolvedValue(null);
      const dbError = mockPrismaError(PRISMA_ERRORS.UNIQUE_CONSTRAINT, 'Unique constraint violation');
      prismaMock.temp_users.create.mockRejectedValue(dbError);

      await expect(authService.findOrCreateTempUser(mockProfile))
        .rejects.toThrow('Unique constraint violation');
    });
  });

  describe('findUserByExternalId', () => {
    it('should find user by external_id with success response', async () => {
      const mockUser = createTestUser({
        external_id: 'user-123',
        // Add related data
        roles: { id: 1, name: 'user' },
        contacts: { id: 1, email: 'test@example.com' },
        location: {
          city: { id: 1, name: 'Taipei' },
          country: { id: 1, name: 'Taiwan' }
        },
        user_positions: [
          { position: { id: 1, name: 'developer' } }
        ]
      });

      prismaMock.users.findUnique.mockResolvedValue(mockUser);

      const result = await authService.findUserByExternalId('user-123');

      expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
        where: { external_id: 'user-123' },
        include: {
          roles: true,
          contacts: true,
          location: {
            include: {
              city: true,
              country: true
            }
          },
          user_positions: {
            include: {
              position: true
            }
          }
        }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('should return null data when user not found', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);

      const result = await authService.findUserByExternalId('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles including positions in success response', async () => {
      const mockUser = createTestUser({
        roles: { id: 1, name: 'user' },
        user_positions: [
          { position: { id: 2, name: 'developer' } },
          { position: { id: 3, name: 'admin' } }
        ]
      });

      prismaMock.users.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getUserRoles(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        { id: 1, name: 'user' },
        { id: 2, name: 'developer' },
        { id: 3, name: 'admin' }
      ]);
    });

    it('should return empty array when user not found', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);

      const result = await authService.getUserRoles(999);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle user with no roles or positions', async () => {
      const mockUser = createTestUser({
        roles: null,
        user_positions: []
      });

      prismaMock.users.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getUserRoles(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle user with roles but no positions', async () => {
      const mockUser = createTestUser({
        roles: { id: 1, name: 'user' },
        user_positions: []
      });

      prismaMock.users.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getUserRoles(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1, name: 'user' }]);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions in success response', async () => {
      const mockPermissions = [
        {
          user_id: 1,
          permission_id: 1,
          granted: true,
          granted_at: new Date(),
          granted_by: null,
          expires_at: null,
          notes: null,
          permissions: {
            id: 1,
            name: 'user:read',
            description: 'Read user data'
          }
        },
        {
          user_id: 1,
          permission_id: 2,
          granted: true,
          granted_at: new Date(),
          granted_by: null,
          expires_at: null,
          notes: null,
          permissions: {
            id: 2,
            name: 'user:write',
            description: 'Write user data'
          }
        }
      ];

      prismaMock.user_permissions.findMany.mockResolvedValue(mockPermissions);

      const result = await authService.getUserPermissions(1);

      expect(prismaMock.user_permissions.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: {
          permissions: true
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        {
          id: 1,
          name: 'user:read',
          description: 'Read user data'
        },
        {
          id: 2,
          name: 'user:write',
          description: 'Write user data'
        }
      ]);
    });

    it('should return empty array when no permissions found', async () => {
      prismaMock.user_permissions.findMany.mockResolvedValue([]);

      const result = await authService.getUserPermissions(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password', async () => {
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.verifyPassword('password123', 'hashedpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.verifyPassword('wrongpassword', 'hashedpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(result).toBe(false);
    });

    it('should propagate bcrypt errors', async () => {
      (mockBcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      await expect(authService.verifyPassword('password', 'hash'))
        .rejects.toThrow('Bcrypt error');
    });
  });

  describe('generateAuthToken', () => {
    it('should generate token with complete payload', () => {
      const payload = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        isTemp: false,
        roles: ['user', 'admin'],
        permissions: ['user:read', 'user:write']
      };

      mockJwtService.generateToken.mockReturnValue('mock-token');

      const result = authService.generateAuthToken(payload);

      expect(jwtService.generateToken).toHaveBeenCalledWith(payload);
      expect(result).toBe('mock-token');
    });

    it('should generate token with minimal payload', () => {
      const payload = { id: 1 };

      mockJwtService.generateToken.mockReturnValue('mock-token-minimal');

      const result = authService.generateAuthToken(payload);

      expect(jwtService.generateToken).toHaveBeenCalledWith(payload);
      expect(result).toBe('mock-token-minimal');
    });

    it('should propagate JWT service errors', () => {
      const payload = { id: 1 };
      mockJwtService.generateToken.mockImplementation(() => {
        throw new Error('JWT generation failed');
      });

      expect(() => authService.generateAuthToken(payload))
        .toThrow('JWT generation failed');
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login time and return success', async () => {
      mockUserService.updateLastLogin.mockResolvedValue(undefined);

      const result = await authService.updateLastLogin(1);

      expect(mockUserService.updateLastLogin).toHaveBeenCalledWith(1, undefined);
      expect(result.success).toBe(true);
      expect(result.data!.success).toBe(true);
    });

    it('should handle database errors during update', async () => {
      const dbError = new Error('User not found');
      mockUserService.updateLastLogin.mockRejectedValue(dbError);

      await expect(authService.updateLastLogin(999))
        .rejects.toThrow('User not found');
    });
  });

  describe('verifyUserEmail', () => {
    it('should verify user email and return success', async () => {
      const mockUpdatedUser = createTestUser({ verified: true });
      prismaMock.users.update.mockResolvedValue(mockUpdatedUser);

      const result = await authService.verifyUserEmail(1);

      expect(prismaMock.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          verified: true,
          verified_at: expect.any(Date),
          updated_at: expect.any(Date)
        }
      });
      expect(result.success).toBe(true);
      expect(result.data!.success).toBe(true);
    });
  });

  describe('setUserActiveStatus', () => {
    it('should set user active status and return success', async () => {
      const mockUpdatedUser = createTestUser({ is_active: false });
      prismaMock.users.update.mockResolvedValue(mockUpdatedUser);

      const result = await authService.setUserActiveStatus(1, false);

      expect(prismaMock.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          is_active: false,
          updated_at: expect.any(Date)
        }
      });
      expect(result.success).toBe(true);
      expect(result.data!.success).toBe(true);
    });
  });

  describe('isUserEmailVerified', () => {
    it('should return true when user email is verified', async () => {
      const verifiedUser = createTestUser({ verified: true });
      prismaMock.users.findUnique.mockResolvedValue(verifiedUser);

      const result = await authService.isUserEmailVerified(1);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when user email is not verified', async () => {
      const unverifiedUser = createTestUser({ verified: false });
      prismaMock.users.findUnique.mockResolvedValue(unverifiedUser);

      const result = await authService.isUserEmailVerified(1);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('should return false when user not found', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);

      const result = await authService.isUserEmailVerified(999);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('isUserActive', () => {
    it('should return true when user is active', async () => {
      const activeUser = createTestUser({ is_active: true });
      prismaMock.users.findUnique.mockResolvedValue(activeUser);

      const result = await authService.isUserActive(1);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when user is inactive', async () => {
      const inactiveUser = createTestUser({ is_active: false });
      prismaMock.users.findUnique.mockResolvedValue(inactiveUser);

      const result = await authService.isUserActive(1);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('createUserFromOAuth', () => {
    const mockOAuthProfile = {
      googleId: 'google-oauth-123',
      email: 'oauthuser@example.com',
      name: 'OAuth User',
      photoUrl: 'https://example.com/oauth-photo.jpg'
    };

    beforeEach(() => {
      // Setup transaction mock for createUserFromOAuth
      setupTransactionMock();
    });

    it('should create a new formal user with all related records', async () => {
      const mockBasicInfo = { id: 1, self_introduction: null, share_list: null, want_to_do_list: [] };
      const mockContact = {
        id: 1,
        google_id: mockOAuthProfile.googleId,
        email: mockOAuthProfile.email,
        photo_url: mockOAuthProfile.photoUrl,
        is_subscribe_email: false
      };
      const mockUser = createTestUser({
        id: 1,
        nickname: mockOAuthProfile.name,
        contact_id: mockContact.id,
        basic_info_id: mockBasicInfo.id,
        role_id: 2,
        is_open_location: false,
        is_open_profile: false,
        verified: false,
        is_active: true
      });
      const mockUserWithRelations = {
        ...mockUser,
        roles: { id: 2, name: 'user' },
        contacts: mockContact,
        basic_info: mockBasicInfo,
        location: null,
        user_positions: []
      };

      prismaMock.basic_info.create.mockResolvedValue(mockBasicInfo);
      prismaMock.contacts.create.mockResolvedValue(mockContact as any);
      prismaMock.users.create.mockResolvedValue(mockUser);
      prismaMock.users.findUnique.mockResolvedValue(mockUserWithRelations);

      const result = await authService.createUserFromOAuth(mockOAuthProfile);

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();

      // Verify basic_info was created with empty values
      expect(prismaMock.basic_info.create).toHaveBeenCalledWith({
        data: {
          self_introduction: null,
          share_list: null,
          want_to_do_list: []
        }
      });

      // Verify contacts was created with Google info
      expect(prismaMock.contacts.create).toHaveBeenCalledWith({
        data: {
          google_id: mockOAuthProfile.googleId,
          email: mockOAuthProfile.email,
          photo_url: mockOAuthProfile.photoUrl,
          is_subscribe_email: false
        }
      });

      // Verify users was created with correct defaults
      expect(prismaMock.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mongo_id: expect.any(String),
          nickname: mockOAuthProfile.name,
          contact_id: mockContact.id,
          basic_info_id: mockBasicInfo.id,
          role_id: 2,
          is_open_location: false,
          is_open_profile: false,
          verified: false,
          is_active: true
        })
      });

      // Verify full user was fetched with relations
      expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: {
          roles: true,
          contacts: true,
          basic_info: true,
          location: {
            include: {
              city: true,
              country: true
            }
          },
          user_positions: {
            include: {
              position: true
            }
          }
        }
      });
    });

    it('should create user without photoUrl when not provided', async () => {
      const profileWithoutPhoto = {
        googleId: 'google-no-photo-456',
        email: 'nophoto@example.com',
        name: 'No Photo User'
      };

      const mockBasicInfo = { id: 2, self_introduction: null, share_list: null, want_to_do_list: [] };
      const mockContact = {
        id: 2,
        google_id: profileWithoutPhoto.googleId,
        email: profileWithoutPhoto.email,
        photo_url: undefined,
        is_subscribe_email: false
      };
      const mockUser = createTestUser({
        id: 2,
        nickname: profileWithoutPhoto.name,
        contact_id: mockContact.id,
        basic_info_id: mockBasicInfo.id
      });

      prismaMock.basic_info.create.mockResolvedValue(mockBasicInfo);
      prismaMock.contacts.create.mockResolvedValue(mockContact as any);
      prismaMock.users.create.mockResolvedValue(mockUser);
      prismaMock.users.findUnique.mockResolvedValue(mockUser);

      const result = await authService.createUserFromOAuth(profileWithoutPhoto);

      expect(result.success).toBe(true);
      expect(prismaMock.contacts.create).toHaveBeenCalledWith({
        data: {
          google_id: profileWithoutPhoto.googleId,
          email: profileWithoutPhoto.email,
          photo_url: undefined,
          is_subscribe_email: false
        }
      });
    });

    it('should handle database errors during transaction', async () => {
      const dbError = mockPrismaError(PRISMA_ERRORS.CONNECTION_ERROR, 'Transaction failed');
      prismaMock.basic_info.create.mockRejectedValue(dbError);

      await expect(authService.createUserFromOAuth(mockOAuthProfile))
        .rejects.toThrow('Transaction failed');
    });

    it('should handle unique constraint violation on contacts', async () => {
      const mockBasicInfo = { id: 1, self_introduction: null, share_list: null, want_to_do_list: [] };
      prismaMock.basic_info.create.mockResolvedValue(mockBasicInfo);

      const uniqueError = mockPrismaError(PRISMA_ERRORS.UNIQUE_CONSTRAINT, 'Email already exists');
      prismaMock.contacts.create.mockRejectedValue(uniqueError);

      await expect(authService.createUserFromOAuth(mockOAuthProfile))
        .rejects.toThrow('Email already exists');
    });

    it('should return user with role_id 2 (regular user)', async () => {
      const mockBasicInfo = { id: 1, self_introduction: null, share_list: null, want_to_do_list: [] };
      const mockContact = { id: 1, google_id: 'test', email: 'test@test.com', photo_url: null, is_subscribe_email: false };
      const mockUser = createTestUser({ id: 1, role_id: 2 });
      const mockUserWithRelations = {
        ...mockUser,
        roles: { id: 2, name: 'user', description: 'Regular user' }
      };

      prismaMock.basic_info.create.mockResolvedValue(mockBasicInfo);
      prismaMock.contacts.create.mockResolvedValue(mockContact as any);
      prismaMock.users.create.mockResolvedValue(mockUser);
      prismaMock.users.findUnique.mockResolvedValue(mockUserWithRelations);

      const result = await authService.createUserFromOAuth(mockOAuthProfile);

      expect(result.success).toBe(true);
      expect(prismaMock.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role_id: 2
        })
      });
    });
  });

  describe('createUserFromAppleOAuth', () => {
    const mockAppleProfile = {
      appleId: 'apple-oauth-123',
      email: 'appleuser@example.com',
      name: 'Apple User',
      photoUrl: 'https://example.com/apple-photo.jpg',
      emailVerified: true,
      isPrivateEmail: false
    };

    beforeEach(() => {
      setupTransactionMock();
      mockEmailService.sendWelcomeEmail.mockClear();
    });

    it('should create a new user with verified=true when emailVerified is true', async () => {
      const mockBasicInfo = { id: 1, self_introduction: null, share_list: null, want_to_do_list: [] };
      const mockContact = {
        id: 1,
        apple_id: mockAppleProfile.appleId,
        email: mockAppleProfile.email,
        photo_url: mockAppleProfile.photoUrl,
        is_subscribe_email: false
      };
      const mockUser = createTestUser({
        id: 1,
        nickname: mockAppleProfile.name,
        contact_id: mockContact.id,
        basic_info_id: mockBasicInfo.id,
        role_id: 2,
        verified: true
      });
      const mockUserWithRelations = {
        ...mockUser,
        roles: { id: 2, name: 'user' },
        contacts: mockContact,
        basic_info: mockBasicInfo,
        location: null,
        user_positions: []
      };

      prismaMock.basic_info.create.mockResolvedValue(mockBasicInfo);
      prismaMock.contacts.create.mockResolvedValue(mockContact as any);
      prismaMock.users.create.mockResolvedValue(mockUser);
      prismaMock.users.findUnique.mockResolvedValue(mockUserWithRelations);

      const result = await authService.createUserFromAppleOAuth(mockAppleProfile);

      expect(result.success).toBe(true);
      // Verify user is created with verified=true
      expect(prismaMock.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          verified: true
        })
      });
    });

    it('should send welcome email after creating user', async () => {
      const mockBasicInfo = { id: 1, self_introduction: null, share_list: null, want_to_do_list: [] };
      const mockContact = {
        id: 1,
        apple_id: mockAppleProfile.appleId,
        email: mockAppleProfile.email,
        photo_url: mockAppleProfile.photoUrl,
        is_subscribe_email: false
      };
      const mockUser = createTestUser({
        id: 1,
        nickname: mockAppleProfile.name,
        verified: true
      });

      prismaMock.basic_info.create.mockResolvedValue(mockBasicInfo);
      prismaMock.contacts.create.mockResolvedValue(mockContact as any);
      prismaMock.users.create.mockResolvedValue(mockUser);
      prismaMock.users.findUnique.mockResolvedValue(mockUser);

      await authService.createUserFromAppleOAuth(mockAppleProfile);

      // Wait for async email to be called
      await new Promise(resolve => setImmediate(resolve));

      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        mockAppleProfile.email,
        {
          name: mockAppleProfile.name,
          hasCompletedQuiz: false
        }
      );
    });

    it('should not send welcome email when email is not provided', async () => {
      const profileWithoutEmail = {
        appleId: 'apple-no-email-456',
        name: 'No Email User',
        emailVerified: false
      };

      const mockBasicInfo = { id: 1, self_introduction: null, share_list: null, want_to_do_list: [] };
      const mockContact = {
        id: 1,
        apple_id: profileWithoutEmail.appleId,
        email: undefined,
        is_subscribe_email: false
      };
      const mockUser = createTestUser({
        id: 1,
        nickname: profileWithoutEmail.name,
        verified: true
      });

      prismaMock.basic_info.create.mockResolvedValue(mockBasicInfo);
      prismaMock.contacts.create.mockResolvedValue(mockContact as any);
      prismaMock.users.create.mockResolvedValue(mockUser);
      prismaMock.users.findUnique.mockResolvedValue(mockUser);

      await authService.createUserFromAppleOAuth(profileWithoutEmail);

      await new Promise(resolve => setImmediate(resolve));

      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('should not fail if welcome email fails', async () => {
      const mockBasicInfo = { id: 1, self_introduction: null, share_list: null, want_to_do_list: [] };
      const mockContact = {
        id: 1,
        apple_id: mockAppleProfile.appleId,
        email: mockAppleProfile.email,
        is_subscribe_email: false
      };
      const mockUser = createTestUser({
        id: 1,
        nickname: mockAppleProfile.name,
        verified: true
      });

      prismaMock.basic_info.create.mockResolvedValue(mockBasicInfo);
      prismaMock.contacts.create.mockResolvedValue(mockContact as any);
      prismaMock.users.create.mockResolvedValue(mockUser);
      prismaMock.users.findUnique.mockResolvedValue(mockUser);

      // Mock email failure
      mockEmailService.sendWelcomeEmail.mockRejectedValue(new Error('SMTP connection failed'));

      // Should not throw error
      const result = await authService.createUserFromAppleOAuth(mockAppleProfile);

      expect(result.success).toBe(true);
    });

    it('should use "User" as default name if name is empty', async () => {
      const profileWithEmptyName = {
        appleId: 'apple-empty-name-789',
        email: 'emptyname@example.com',
        name: '',
        emailVerified: true
      };

      const mockBasicInfo = { id: 1, self_introduction: null, share_list: null, want_to_do_list: [] };
      const mockContact = {
        id: 1,
        apple_id: profileWithEmptyName.appleId,
        email: profileWithEmptyName.email,
        is_subscribe_email: false
      };
      const mockUser = createTestUser({ id: 1, nickname: '', verified: true });

      prismaMock.basic_info.create.mockResolvedValue(mockBasicInfo);
      prismaMock.contacts.create.mockResolvedValue(mockContact as any);
      prismaMock.users.create.mockResolvedValue(mockUser);
      prismaMock.users.findUnique.mockResolvedValue(mockUser);

      await authService.createUserFromAppleOAuth(profileWithEmptyName);

      await new Promise(resolve => setImmediate(resolve));

      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        profileWithEmptyName.email,
        {
          name: 'User',
          hasCompletedQuiz: false
        }
      );
    });
  });

  describe('Business logic integration', () => {
    describe('OAuth flow for new temp user', () => {
      it('should create temp user when formal user not found', async () => {
        const profile = {
          googleId: 'new-google-123',
          email: 'newuser@example.com',
          name: 'New User'
        };

        // Setup mocks
        prismaMock.contacts.findFirst.mockResolvedValue(null);
        prismaMock.temp_users.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null);
        
        const newTempUser = createTestTempUser({
          google_id: profile.googleId,
          email: profile.email,
          name: profile.name
        });
        prismaMock.temp_users.create.mockResolvedValue(newTempUser);
        mockJwtService.generateToken.mockReturnValue('temp-user-token');

        // Execute flow
        const userResult = await authService.findUserByEmail(profile.email);
        expect(userResult.data).toBeNull();

        const tempUserResult = await authService.findOrCreateTempUser(profile);
        expect(tempUserResult.data).toEqual({ user: newTempUser, isNewUser: true });

        const tempUserData = (tempUserResult.data as { user: { id: number; email: string }; isNewUser: boolean }).user;
        const token = authService.generateAuthToken({
          id: tempUserData.id,
          email: tempUserData.email,
          isTemp: true
        });
        expect(token).toBe('temp-user-token');
      });
    });

    describe('OAuth flow with direct login (OAUTH_DIRECT_LOGIN=true)', () => {
      beforeEach(() => {
        setupTransactionMock();
      });

      it('should create formal user directly when no existing user found', async () => {
        const profile = {
          googleId: 'direct-login-google-123',
          email: 'directlogin@example.com',
          name: 'Direct Login User',
          photoUrl: 'https://example.com/direct-photo.jpg'
        };

        // Setup: No existing user found
        prismaMock.contacts.findFirst.mockResolvedValue(null);

        // Setup: createUserFromOAuth mocks
        const mockBasicInfo = { id: 10, self_introduction: null, share_list: null, want_to_do_list: [] };
        const mockContact = {
          id: 10,
          google_id: profile.googleId,
          email: profile.email,
          photo_url: profile.photoUrl,
          is_subscribe_email: false
        };
        const mockUser = createTestUser({
          id: 10,
          nickname: profile.name,
          contact_id: mockContact.id,
          basic_info_id: mockBasicInfo.id,
          role_id: 2,
          verified: false
        });
        const mockUserWithRelations = {
          ...mockUser,
          roles: { id: 2, name: 'user' },
          contacts: mockContact,
          basic_info: mockBasicInfo,
          location: null,
          user_positions: []
        };

        prismaMock.basic_info.create.mockResolvedValue(mockBasicInfo);
        prismaMock.contacts.create.mockResolvedValue(mockContact as any);
        prismaMock.users.create.mockResolvedValue(mockUser);
        prismaMock.users.findUnique.mockResolvedValue(mockUserWithRelations);
        mockJwtService.generateToken.mockReturnValue('direct-login-token');

        // Execute flow
        const userResult = await authService.findUserByEmail(profile.email);
        expect(userResult.data).toBeNull();

        // This simulates what would happen when OAUTH_DIRECT_LOGIN=true
        const newUserResult = await authService.createUserFromOAuth(profile);
        expect(newUserResult.success).toBe(true);
        expect(newUserResult.data).toBeTruthy();

        const token = authService.generateAuthToken({
          id: (newUserResult.data as any).id,
          email: profile.email,
          isTemp: false,
          roles: ['user']
        });
        expect(token).toBe('direct-login-token');
      });
    });

    describe('OAuth flow for existing formal user', () => {
      it('should return user with roles and permissions', async () => {
        const email = 'existing@example.com';
        const mockContact = createTestContact({ email });
        const mockPermissions = [
          {
            user_id: 1,
            permission_id: 1,
            granted: true,
            granted_at: new Date(),
            granted_by: null,
            expires_at: null,
            notes: null,
            permissions: {
              id: 1,
              name: 'user:read',
              description: 'Read user data'
            }
          }
        ];

        prismaMock.contacts.findFirst.mockResolvedValue(mockContact);
        prismaMock.users.findUnique.mockResolvedValue(mockContact.users[0]);
        prismaMock.user_permissions.findMany.mockResolvedValue(mockPermissions);
        mockJwtService.generateToken.mockReturnValue('formal-user-token');

        // Execute flow
        const userResult = await authService.findUserByEmail(email);
        expect(userResult.data).toBeTruthy();
        expect(userResult.data!.user.id).toBe(1);

        const rolesResult = await authService.getUserRoles(1);
        expect(rolesResult.data).toBeDefined();

        const permissionsResult = await authService.getUserPermissions(1);
        expect(permissionsResult.data).toBeDefined();

        const token = authService.generateAuthToken({
          id: 1,
          email,
          username: mockContact.users[0].nickname,
          isTemp: false,
          roles: ['USER'],
          permissions: ['user:read']
        });
        expect(token).toBe('formal-user-token');
      });
    });
  });
});