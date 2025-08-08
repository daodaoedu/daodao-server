/**
 * Auth Service 單元測試
 * 測試認證服務的核心功能
 */

import { authService } from '@/services/auth/auth.service';
import { jwtService } from '@/services/jwt.service';
import * as bcrypt from 'bcrypt';
import { ConflictError } from '@/utils/error-handler';

// Mock dependencies
jest.mock('@/services/database/prisma.service', () => ({
  prisma: {
    contacts: {
      findFirst: jest.fn(),
    },
    temp_users: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user_permissions: {
      findMany: jest.fn(),
    },
  }
}));

jest.mock('@/services/jwt.service');
jest.mock('bcrypt');

// Import mocked modules
import { prisma } from '@/services/database/prisma.service';

describe('Auth Service', () => {
  const mockPrisma = prisma as any;
  let mockJwtService: jest.Mocked<typeof jwtService>;
  let mockBcrypt: jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockJwtService = jwtService as jest.Mocked<typeof jwtService>;
    mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
    
    // Reset all prisma mocks to default values
    mockPrisma.contacts.findFirst.mockReset();
    mockPrisma.temp_users.findUnique.mockReset();
    mockPrisma.temp_users.create.mockReset();
    mockPrisma.users.findUnique.mockReset();
    mockPrisma.users.update.mockReset();
    mockPrisma.user_permissions.findMany.mockReset();
  });

  describe('findUserByEmail', () => {
    it('should find user by email with complete relations', async () => {
      const mockContact = {
        id: 1,
        email: 'test@example.com',
        users: [{
          id: 1,
          external_id: 'user-123',
          nickname: 'testuser',
          roles: { id: 1, name: 'user' },
          user_positions: [
            {
              position: { id: 1, name: 'developer' }
            }
          ]
        }]
      };

      mockPrisma.contacts.findFirst.mockResolvedValue(mockContact as any);

      const result = await authService.findUserByEmail('test@example.com');

      expect(mockPrisma.contacts.findFirst).toHaveBeenCalledWith({
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

      expect(result).toEqual({
        contact: mockContact,
        user: mockContact.users[0]
      });
    });

    it('should return null if contact not found', async () => {
      mockPrisma.contacts.findFirst.mockResolvedValue(null);

      const result = await authService.findUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should return null if contact has no users', async () => {
      const mockContact = {
        id: 1,
        email: 'test@example.com',
        users: []
      };

      mockPrisma.contacts.findFirst.mockResolvedValue(mockContact as any);

      const result = await authService.findUserByEmail('test@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPrisma.contacts.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(authService.findUserByEmail('test@example.com'))
        .rejects.toThrow('Database error');
    });
  });

  describe('findOrCreateTempUser', () => {
    const mockProfile = {
      googleId: 'google-123',
      email: 'temp@example.com',
      name: 'Temp User',
      photoUrl: 'https://example.com/photo.jpg'
    };

    it('should return existing temp user if found', async () => {
      const existingTempUser = {
        id: 1,
        google_id: 'google-123',
        email: 'temp@example.com',
        name: 'Temp User'
      };

      mockPrisma.temp_users.findUnique.mockResolvedValue(existingTempUser as any);

      const result = await authService.findOrCreateTempUser(mockProfile);

      expect(mockPrisma.temp_users.findUnique).toHaveBeenCalledWith({
        where: { google_id: 'google-123' }
      });
      expect(result).toEqual(existingTempUser);
      expect(mockPrisma.temp_users.create).not.toHaveBeenCalled();
    });

    it('should create new temp user if not found', async () => {
      const newTempUser = {
        id: 1,
        google_id: 'google-123',
        email: 'temp@example.com',
        name: 'Temp User',
        photo_url: 'https://example.com/photo.jpg'
      };

      mockPrisma.temp_users.findUnique
        .mockResolvedValueOnce(null) // First call for googleId
        .mockResolvedValueOnce(null); // Second call for email

      mockPrisma.temp_users.create.mockResolvedValue(newTempUser as any);

      const result = await authService.findOrCreateTempUser(mockProfile);

      expect(mockPrisma.temp_users.findUnique).toHaveBeenCalledWith({
        where: { google_id: 'google-123' }
      });
      expect(mockPrisma.temp_users.findUnique).toHaveBeenCalledWith({
        where: { email: 'temp@example.com' }
      });
      expect(mockPrisma.temp_users.create).toHaveBeenCalledWith({
        data: {
          google_id: 'google-123',
          email: 'temp@example.com',
          name: 'Temp User',
          photo_url: 'https://example.com/photo.jpg'
        }
      });
      expect(result).toEqual(newTempUser);
    });

    it('should throw ConflictError if email already exists', async () => {
      const existingByEmail = {
        id: 2,
        google_id: 'different-google-id',
        email: 'temp@example.com'
      };

      mockPrisma.temp_users.findUnique
        .mockResolvedValueOnce(null) // First call for googleId
        .mockResolvedValueOnce(existingByEmail as any); // Second call for email

      await expect(authService.findOrCreateTempUser(mockProfile))
        .rejects.toThrow(ConflictError);
      
      expect(mockPrisma.temp_users.create).not.toHaveBeenCalled();
    });

    it('should handle profile without photoUrl', async () => {
      const profileWithoutPhoto = {
        googleId: 'google-456',
        email: 'nophoto@example.com',
        name: 'No Photo User'
      };

      const newTempUser = {
        id: 1,
        google_id: 'google-456',
        email: 'nophoto@example.com',
        name: 'No Photo User',
        photo_url: undefined
      };

      mockPrisma.temp_users.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.temp_users.create.mockResolvedValue(newTempUser as any);

      const result = await authService.findOrCreateTempUser(profileWithoutPhoto);

      expect(mockPrisma.temp_users.create).toHaveBeenCalledWith({
        data: {
          google_id: 'google-456',
          email: 'nophoto@example.com',
          name: 'No Photo User',
          photo_url: undefined
        }
      });
      expect(result).toEqual(newTempUser);
    });
  });

  describe('findUserByExternalId', () => {
    it('should find user by external_id with all relations', async () => {
      const mockUser = {
        id: 1,
        external_id: 'user-123',
        nickname: 'testuser',
        roles: { id: 1, name: 'user' },
        contacts: { id: 1, email: 'test@example.com' },
        location: {
          city: { id: 1, name: 'Taipei' },
          country: { id: 1, name: 'Taiwan' }
        },
        user_positions: [
          { position: { id: 1, name: 'developer' } }
        ]
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await authService.findUserByExternalId('user-123');

      expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const result = await authService.findUserByExternalId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles including positions', async () => {
      const mockUser = {
        id: 1,
        roles: { id: 1, name: 'user' },
        user_positions: [
          { position: { id: 2, name: 'developer' } },
          { position: { id: 3, name: 'admin' } }
        ]
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await authService.getUserRoles(1);

      expect(result).toEqual([
        { id: 1, name: 'user' },
        { id: 2, name: 'developer' },
        { id: 3, name: 'admin' }
      ]);
    });

    it('should return empty array if user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const result = await authService.getUserRoles(999);

      expect(result).toEqual([]);
    });

    it('should handle user with no roles or positions', async () => {
      const mockUser = {
        id: 1,
        roles: null,
        user_positions: []
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await authService.getUserRoles(1);

      expect(result).toEqual([]);
    });

    it('should handle user with roles but no positions', async () => {
      const mockUser = {
        id: 1,
        roles: { id: 1, name: 'user' },
        user_positions: []
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await authService.getUserRoles(1);

      expect(result).toEqual([{ id: 1, name: 'user' }]);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const mockPermissions = [
        {
          permissions: {
            id: 1,
            name: 'user:read',
            description: 'Read user data'
          }
        },
        {
          permissions: {
            id: 2,
            name: 'user:write',
            description: 'Write user data'
          }
        }
      ];

      mockPrisma.user_permissions.findMany.mockResolvedValue(mockPermissions as any);

      const result = await authService.getUserPermissions(1);

      expect(mockPrisma.user_permissions.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: {
          permissions: true
        }
      });

      expect(result).toEqual([
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

    it('should return empty array if no permissions found', async () => {
      mockPrisma.user_permissions.findMany.mockResolvedValue([]);

      const result = await authService.getUserPermissions(1);

      expect(result).toEqual([]);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await authService.verifyPassword('password123', 'hashedpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await authService.verifyPassword('wrongpassword', 'hashedpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(result).toBe(false);
    });

    it('should handle bcrypt errors', async () => {
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error') as never);

      await expect(authService.verifyPassword('password', 'hash'))
        .rejects.toThrow('Bcrypt error');
    });
  });

  describe('generateAuthToken', () => {
    it('should generate token with complete payload', async () => {
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

    it('should generate token with minimal payload', async () => {
      const payload = {
        id: 1
      };

      mockJwtService.generateToken.mockReturnValue('mock-token-minimal');

      const result = authService.generateAuthToken(payload);

      expect(jwtService.generateToken).toHaveBeenCalledWith(payload);
      expect(result).toBe('mock-token-minimal');
    });

    it('should handle JWT service errors', async () => {
      const payload = { id: 1 };
      mockJwtService.generateToken.mockImplementation(() => {
        throw new Error('JWT error');
      });

      expect(() => authService.generateAuthToken(payload))
        .toThrow('JWT error');
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login time', async () => {
      const mockUpdatedUser = {
        id: 1,
        updated_at: new Date()
      };

      mockPrisma.users.update.mockResolvedValue(mockUpdatedUser as any);

      await authService.updateLastLogin(1);

      expect(mockPrisma.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          updated_at: expect.any(Date)
        }
      });
    });

    it('should handle database errors during update', async () => {
      mockPrisma.users.update.mockRejectedValue(new Error('Update failed'));

      await expect(authService.updateLastLogin(1))
        .rejects.toThrow('Update failed');
    });

    it('should handle non-existent user gracefully', async () => {
      mockPrisma.users.update.mockRejectedValue(new Error('Record not found'));

      await expect(authService.updateLastLogin(999))
        .rejects.toThrow('Record not found');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete OAuth flow for new temp user', async () => {
      const profile = {
        googleId: 'new-google-123',
        email: 'newuser@example.com',
        name: 'New User'
      };

      // Mock sequence: user not found, temp user not found, create temp user
      mockPrisma.contacts.findFirst.mockResolvedValue(null);
      mockPrisma.temp_users.findUnique
        .mockResolvedValueOnce(null) // googleId check
        .mockResolvedValueOnce(null); // email check

      const newTempUser = {
        id: 1,
        google_id: profile.googleId,
        email: profile.email,
        name: profile.name
      };
      mockPrisma.temp_users.create.mockResolvedValue(newTempUser as any);
      mockJwtService.generateToken.mockReturnValue('temp-user-token');

      // Execute OAuth flow simulation
      const userResult = await authService.findUserByEmail(profile.email);
      expect(userResult).toBeNull();

      const tempUser = await authService.findOrCreateTempUser(profile);
      expect(tempUser).toEqual(newTempUser);

      const token = authService.generateAuthToken({
        id: tempUser.id,
        email: tempUser.email,
        isTemp: true
      });
      expect(token).toBe('temp-user-token');
    });

    it('should handle complete OAuth flow for existing formal user', async () => {
      const email = 'existing@example.com';
      
      const mockContact = {
        id: 1,
        email,
        users: [{
          id: 1,
          external_id: 'user-123',
          nickname: 'existinguser',
          roles: { id: 1, name: 'user' },
          user_positions: []
        }]
      };

      const mockPermissions = [
        {
          permissions: {
            id: 1,
            name: 'user:read',
            description: 'Read user data'
          }
        }
      ];

      mockPrisma.contacts.findFirst.mockResolvedValue(mockContact as any);
      mockPrisma.users.findUnique.mockResolvedValue(mockContact.users[0] as any);
      mockPrisma.user_permissions.findMany.mockResolvedValue(mockPermissions as any);
      mockJwtService.generateToken.mockReturnValue('formal-user-token');

      // Execute OAuth flow for existing user
      const userResult = await authService.findUserByEmail(email);
      expect(userResult).toBeTruthy();
      expect(userResult!.user.id).toBe(1);

      const roles = await authService.getUserRoles(1);
      expect(roles).toContainEqual({ id: 1, name: 'user' });

      const permissions = await authService.getUserPermissions(1);
      expect(permissions).toHaveLength(1);

      const token = authService.generateAuthToken({
        id: 1,
        email,
        username: 'existinguser',
        isTemp: false,
        roles: ['user'],
        permissions: ['user:read']
      });
      expect(token).toBe('formal-user-token');

      await authService.updateLastLogin(1);
      expect(mockPrisma.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { updated_at: expect.any(Date) }
      });
    });
  });
});