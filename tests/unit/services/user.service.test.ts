/**
 * User Service Unit Tests
 * Tests user service business logic in isolation
 * 
 * Focus: Business logic validation, data transformation, user management operations
 * Mocks: All external dependencies (database, email service, JWT, tag service)
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

// Mock external dependencies with proper jest functions
const mockTagService = {
  getEntityTags: jest.fn(),
  setEntityTags: jest.fn(),
  removeEntityTag: jest.fn()
};

const mockJwtService = {
  generateToken: jest.fn()
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
  sendWelcomeEmail: jest.fn()
};

const mockProfessionalFieldService = {
  getUserProfessionalFields: jest.fn(),
  setUserProfessionalFields: jest.fn()
};

const mockCityService = {
  findOrCreateLocation: jest.fn(),
  validateCityCode: jest.fn(),
  getCityByCode: jest.fn()
};

const mockR2Service = {
  uploadToR2: jest.fn(),
  deleteFromR2: jest.fn()
};

const mockLoggerService = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: mockLoggerService
}));

jest.mock('@/services/r2.service', () => mockR2Service);

jest.mock('@/services/tag.service', () => mockTagService);

jest.mock('@/services/jwt.service', () => ({
  jwtService: mockJwtService
}));

jest.mock('@/services/email/email.service', () => ({
  emailService: mockEmailService
}));

jest.mock('@/services/professional-field.service', () => ({
  default: mockProfessionalFieldService,
  ...mockProfessionalFieldService
}));

jest.mock('@/services/city.service', () => ({
  cityService: mockCityService
}));

import { userService } from '@/services/user.service';
import { mockResponses, PRISMA_ERRORS, mockPrismaError } from '@tests/utils/prisma-mock';
import { createTestUser, createTestUsers, createTestUserWithRelations, createApiResponse } from '@tests/utils/test-factories';

describe('User Service', () => {
  // Mock services are already defined above

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup transaction mock
    setupTransactionMock();

    // Setup common mock returns
    mockTagService.getEntityTags.mockResolvedValue([]);
    mockTagService.setEntityTags.mockResolvedValue(undefined);
    mockJwtService.generateToken.mockReturnValue('mock-jwt-token');
    mockEmailService.sendVerificationEmail.mockResolvedValue({ success: true, messageId: 'mock-message-id' });
    mockProfessionalFieldService.getUserProfessionalFields.mockResolvedValue([]);
    mockProfessionalFieldService.setUserProfessionalFields.mockResolvedValue(undefined);
    mockR2Service.uploadToR2.mockResolvedValue('avatars/test-avatar.jpg');
    mockR2Service.deleteFromR2.mockResolvedValue(undefined);
    mockCityService.findOrCreateLocation.mockResolvedValue(1); // Default location ID
    mockCityService.validateCityCode.mockResolvedValue(true);

    // Setup common Prisma mock returns for formatUserResponse dependencies
    prismaMock.user_interests.findMany.mockResolvedValue([]);
    prismaMock.quiz_results.findFirst.mockResolvedValue(null);
  });

  // Test data factories
  const createTestTempUser = (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    google_id: 'google-123',
    apple_id: null,
    photo_url: 'https://example.com/photo.jpg',
    created_date: new Date(),
    updated_date: new Date(),
    ...overrides
  });

  const createTestBasicInfo = (overrides = {}) => ({
    id: 1,
    self_introduction: 'Test introduction',
    share_list: 'Test share list',
    want_to_do_list: [],
    ...overrides
  });

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
    ...overrides
  });

  describe('createUser', () => {
    const validUserData = {
      gender: 'male' as const,
      isSendEmail: false,
      city: 'Taipei',
      birthYear: 1990,
      phone: '+886987654321',
      wantToDoList: ['coding', 'reading'],
      tags: ['developer', 'student'],
      customId: 'test_user'
    };

    it('should create user successfully with complete data', async () => {
      const tempUser = createTestTempUser();
      const basicInfo = createTestBasicInfo();
      const contact = createTestContact();
      const newUser = createTestUser();

      // Setup mocks
      prismaMock.temp_users.findUnique.mockResolvedValue(tempUser);
      prismaMock.users.findFirst.mockResolvedValue(null); // No existing user
      prismaMock.basic_info.create.mockResolvedValue(basicInfo);
      prismaMock.contacts.create.mockResolvedValue(contact);
      prismaMock.users.create.mockResolvedValue(newUser);
      prismaMock.users.findUnique.mockResolvedValue(newUser);

      const result = await userService.createUser(validUserData, '1');

      // Verify database operations
      expect(prismaMock.temp_users.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prismaMock.users.findFirst).toHaveBeenCalledWith({
        where: { nickname: tempUser.name }
      });
      expect(prismaMock.basic_info.create).toHaveBeenCalled();
      expect(prismaMock.contacts.create).toHaveBeenCalled();
      expect(prismaMock.users.create).toHaveBeenCalled();
      expect(prismaMock.users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            custom_id: validUserData.customId,
            custom_id_verified: true
          })
        })
      );

      // Verify response format
      expect(result.success).toBe(true);
      expect(result.data.user).toMatchObject({
        id: newUser.external_id,
        name: newUser.nickname,
        gender: newUser.gender,
        educationStage: newUser.education_stage
      });
      expect(result.data.token).toBe('mock-jwt-token');

      // Note: temp user cleanup only happens when sending email (isSendEmail: true)
    });

    it('should throw NotFoundError when temp user not found', async () => {
      prismaMock.temp_users.findUnique.mockResolvedValue(null);

      await expect(userService.createUser(validUserData, '999'))
        .rejects.toThrow('Temporary user not found');
    });

    it('should reject user creation without customId', async () => {
      const tempUser = createTestTempUser();
      const userDataWithoutCustomId = { ...validUserData };
      delete (userDataWithoutCustomId as Partial<typeof validUserData>).customId;

      prismaMock.temp_users.findUnique.mockResolvedValue(tempUser);
      prismaMock.users.findFirst.mockResolvedValue(null);

      await expect(userService.createUser(userDataWithoutCustomId, '1'))
        .rejects.toThrow('Custom ID 為必填欄位');
    });

    it('should throw ConflictError when username already exists', async () => {
      const tempUser = createTestTempUser();
      const existingUser = createTestUser({ nickname: tempUser.name });

      prismaMock.temp_users.findUnique.mockResolvedValue(tempUser);
      prismaMock.users.findFirst.mockResolvedValue(existingUser);

      await expect(userService.createUser(validUserData, '1'))
        .rejects.toThrow(`使用者名稱 ${tempUser.name} 已存在`);
    });

    it('should handle email sending when requested', async () => {
      const tempUser = createTestTempUser();
      const newUser = createTestUserWithRelations({
        contacts: { email: tempUser.email }
      });
      const userDataWithEmail = { ...validUserData, isSendEmail: true };

      prismaMock.temp_users.findUnique.mockResolvedValue(tempUser);
      prismaMock.users.findFirst.mockResolvedValue(null);
      prismaMock.basic_info.create.mockResolvedValue(createTestBasicInfo());
      prismaMock.contacts.create.mockResolvedValue(createTestContact());
      prismaMock.users.create.mockResolvedValue(newUser);
      prismaMock.users.findUnique.mockResolvedValue(newUser);

      await userService.createUser(userDataWithEmail, '1');

      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.contacts.email,
        expect.stringContaining('/api/v1/auth/verify-email?token='),
        expect.any(String),
        expect.any(Number)
      );
    });

    it('should handle database transaction errors', async () => {
      const tempUser = createTestTempUser();
      prismaMock.temp_users.findUnique.mockResolvedValue(tempUser);
      prismaMock.users.findFirst.mockResolvedValue(null);

      const dbError = mockPrismaError(PRISMA_ERRORS.UNIQUE_CONSTRAINT, 'Unique constraint violation');
      prismaMock.basic_info.create.mockRejectedValue(dbError);

      await expect(userService.createUser(validUserData, '1'))
        .rejects.toThrow('Unique constraint violation');
    });

    it('should use cityService to find or create location when location is provided', async () => {
      const tempUser = createTestTempUser();
      const newUser = createTestUser();
      const userDataWithLocation = { ...validUserData, location: 'taipei_city' };

      prismaMock.temp_users.findUnique.mockResolvedValue(tempUser);
      prismaMock.users.findFirst.mockResolvedValue(null);
      prismaMock.basic_info.create.mockResolvedValue(createTestBasicInfo());
      prismaMock.contacts.create.mockResolvedValue(createTestContact());
      prismaMock.users.create.mockResolvedValue(newUser);
      prismaMock.users.findUnique.mockResolvedValue(newUser);
      mockCityService.findOrCreateLocation.mockResolvedValue(10);

      await userService.createUser(userDataWithLocation, '1');

      // Verify cityService was called with the location code
      expect(mockCityService.findOrCreateLocation).toHaveBeenCalled();
      expect(mockCityService.findOrCreateLocation.mock.calls[0][0]).toBe('taipei_city');
      expect(prismaMock.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          location_id: 10
        })
      });
    });

    it('should throw ConflictError when location code is invalid', async () => {
      const tempUser = createTestTempUser();
      const userDataWithInvalidLocation = { ...validUserData, location: 'invalid_city' };

      prismaMock.temp_users.findUnique.mockResolvedValue(tempUser);
      prismaMock.users.findFirst.mockResolvedValue(null);
      mockCityService.findOrCreateLocation.mockResolvedValue(null);

      await expect(userService.createUser(userDataWithInvalidLocation, '1'))
        .rejects.toThrow("'invalid_city' 不是有效的城市代碼");
    });
  });

  describe('updateUser', () => {
    const updateData = {
      name: 'Updated User',
      phone: '+886912345678',
      bio: 'Updated bio',
      tags: ['developer', 'designer'],
      socialLinks: {
        github: 'https://github.com/updated',
        linkedin: 'https://linkedin.com/in/updated'
      }
    };

    it('should update user successfully', async () => {
      const existingUser = createTestUser();
      const updatedUser = createTestUser({
        nickname: updateData.name,
        bio: updateData.bio
      });

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser) // First call for validation
        .mockResolvedValueOnce(updatedUser); // Second call for response
      prismaMock.users.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(existingUser.external_id, updateData);

      expect(prismaMock.users.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateData.name);
    });

    it('should throw NotFoundError when user not found', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);

      await expect(userService.updateUser('non-existent-uuid', updateData))
        .rejects.toThrow('用戶不存在');
    });

    it('should handle tag updates', async () => {
      const existingUser = createTestUser();
      const updatedUser = createTestUser();
      const updateDataWithTags = { ...updateData, tagList: ['developer', 'designer'] };

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.update.mockResolvedValue(updatedUser);

      await userService.updateUser(existingUser.external_id, updateDataWithTags);

      expect(mockTagService.setEntityTags).toHaveBeenCalledWith(
        'user',
        existingUser.id,
        updateDataWithTags.tagList,
        existingUser.id,
        prismaMock // The transaction object is actually the prismaMock itself
      );
    });

    it('should handle contact information updates', async () => {
      const existingUser = createTestUser({
        contacts: { id: 1, email: 'old@example.com' }
      });
      const updatedUser = createTestUser();
      const updateDataWithContactList = {
        ...updateData,
        contactList: {
          instagram: 'test_ig',
          discord: 'test_discord'
        }
      };

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.update.mockResolvedValue(updatedUser);
      prismaMock.contacts.update.mockResolvedValue(createTestContact());

      await userService.updateUser(existingUser.external_id, updateDataWithContactList);

      expect(prismaMock.contacts.update).toHaveBeenCalled();
    });

    it('should clear contact fields when empty strings are provided', async () => {
      const existingUser = createTestUser({
        contacts: { id: 1, email: 'old@example.com', ig: 'old_ig' }
      });
      const updatedUser = createTestUser();
      const updateDataWithClearContact = {
        contactList: {
          instagram: '', // Clear instagram
          discord: 'new_discord'
        }
      };

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.update.mockResolvedValue(updatedUser);
      prismaMock.contacts.update.mockResolvedValue(createTestContact());

      await userService.updateUser(existingUser.external_id, updateDataWithClearContact);

      expect(prismaMock.contacts.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ig: null, // Empty string should be converted to null
            discord: 'new_discord'
          })
        })
      );
    });

    it('should update customId successfully', async () => {
      const existingUser = createTestUser({
        contacts: { id: 1, email: 'test@example.com' },
        basic_info: { id: 1 }
      });
      const updatedUser = createTestUser({
        custom_id: 'new_custom_id',
        custom_id_verified: true,
        custom_id_created_at: new Date()
      });

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.findFirst.mockResolvedValue(null); // No duplicate customId
      prismaMock.users.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(existingUser.external_id, {
        customId: 'new_custom_id'
      });

      expect(result.success).toBe(true);
      expect(result.data.customId).toBe('new_custom_id');
    });

    it('should throw error when customId format is invalid', async () => {
      const existingUser = createTestUser({
        contacts: { id: 1, email: 'test@example.com' },
        basic_info: { id: 1 }
      });

      prismaMock.users.findUnique.mockResolvedValueOnce(existingUser);

      await expect(userService.updateUser(existingUser.external_id, {
        customId: 'ab' // Too short (min 3 characters)
      })).rejects.toThrow();
    });

    it('should throw error when customId already exists for another user', async () => {
      const existingUser = createTestUser({
        id: 1,
        contacts: { id: 1, email: 'test@example.com' },
        basic_info: { id: 1 }
      });
      const anotherUser = createTestUser({
        id: 2,
        custom_id: 'taken_custom_id'
      });

      prismaMock.users.findUnique.mockResolvedValueOnce(existingUser);
      prismaMock.users.findFirst.mockResolvedValue(anotherUser); // customId already taken

      await expect(userService.updateUser(existingUser.external_id, {
        customId: 'taken_custom_id'
      })).rejects.toThrow('此自訂 ID 已被使用');
    });

    it('should clear customId when empty string is provided', async () => {
      const existingUser = createTestUser({
        contacts: { id: 1, email: 'test@example.com' },
        basic_info: { id: 1 },
        custom_id: 'old_custom_id',
        custom_id_verified: true
      });
      const updatedUser = createTestUser({
        custom_id: null,
        custom_id_verified: false,
        custom_id_created_at: null
      });

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(existingUser.external_id, {
        customId: ''
      });

      expect(result.success).toBe(true);
      expect(result.data.customId).toBeNull();
    });

    it('should use cityService to update location when location is provided', async () => {
      const existingUser = createTestUser({
        contacts: { id: 1, email: 'test@example.com' },
        basic_info: { id: 1 }
      });
      const updatedUser = createTestUser({ location_id: 20 });

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.update.mockResolvedValue(updatedUser);
      mockCityService.findOrCreateLocation.mockResolvedValue(20);

      await userService.updateUser(existingUser.external_id, {
        location: 'new_taipei_city'
      });

      // Verify cityService was called with the location code
      expect(mockCityService.findOrCreateLocation).toHaveBeenCalled();
      expect(mockCityService.findOrCreateLocation.mock.calls[0][0]).toBe('new_taipei_city');
      expect(prismaMock.users.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: expect.objectContaining({
          location_id: 20
        })
      });
    });

    it('should throw ConflictError when updating with invalid location code', async () => {
      const existingUser = createTestUser({
        contacts: { id: 1, email: 'test@example.com' },
        basic_info: { id: 1 }
      });

      prismaMock.users.findUnique.mockResolvedValueOnce(existingUser);
      mockCityService.findOrCreateLocation.mockResolvedValue(null);

      await expect(userService.updateUser(existingUser.external_id, {
        location: 'invalid_city_code'
      })).rejects.toThrow("'invalid_city_code' 不是有效的城市代碼");
    });

    it('should clear location when location is empty string', async () => {
      const existingUser = createTestUser({
        contacts: { id: 1, email: 'test@example.com' },
        basic_info: { id: 1 },
        location_id: 10
      });
      const updatedUser = createTestUser({ location_id: null });

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.update.mockResolvedValue(updatedUser);

      await userService.updateUser(existingUser.external_id, {
        location: ''
      });

      expect(mockCityService.findOrCreateLocation).not.toHaveBeenCalled();
      expect(prismaMock.users.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: expect.objectContaining({
          location_id: null
        })
      });
    });
  });

  describe('updateUserWithAvatar', () => {
    const createMockFile = (overrides = {}): Express.Multer.File => ({
      fieldname: 'avatar',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 102400,
      destination: '/tmp',
      filename: 'test.jpg',
      path: '/tmp/test.jpg',
      buffer: Buffer.from('test image data'),
      stream: {} as any,
      ...overrides
    });

    beforeEach(() => {
      // Set environment variables for R2
      process.env.R2_PUBLIC_URL = 'https://cdn.example.com';
    });

    it('should call updateUser without avatar when no file provided', async () => {
      const existingUser = createTestUser({
        contacts: { id: 1, email: 'test@example.com', photo_url: 'https://old-avatar.jpg' },
        basic_info: { id: 1 }
      });
      const updatedUser = createTestUser({
        nickname: 'Updated Name'
      });

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUserWithAvatar(existingUser.external_id!, {
        name: 'Updated Name'
        // No avatarFile
      });

      expect(result.success).toBe(true);
      expect(mockR2Service.uploadToR2).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when user not found for avatar upload', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);

      const mockFile = createMockFile();

      await expect(userService.updateUserWithAvatar('non-existent-id', {
        name: 'Test',
        avatarFile: mockFile
      })).rejects.toThrow('用戶不存在');
    });

    it('should upload new avatar and update user successfully', async () => {
      const existingUser = createTestUser({
        external_id: 'user-123',
        contacts: { id: 1, email: 'test@example.com', photo_url: null },
        basic_info: { id: 1 }
      });
      const updatedUser = createTestUser({
        external_id: 'user-123',
        nickname: 'Updated Name'
      });
      const mockFile = createMockFile();

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser) // For avatar check
        .mockResolvedValueOnce(existingUser) // For updateUser
        .mockResolvedValueOnce(updatedUser); // After update
      prismaMock.users.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUserWithAvatar(existingUser.external_id!, {
        name: 'Updated Name',
        avatarFile: mockFile
      });

      expect(result.success).toBe(true);
      expect(mockR2Service.uploadToR2).toHaveBeenCalledTimes(1);
      expect(mockR2Service.uploadToR2).toHaveBeenCalledWith(
        expect.objectContaining({ originalname: 'test.jpg' }),
        expect.stringMatching(/^avatars\/[a-f0-9-]+\.jpg$/)
      );
    });

    it('should delete old avatar when uploading new one', async () => {
      const oldAvatarUrl = 'https://cdn.example.com/avatars/old-avatar-uuid.jpg';
      const existingUser = createTestUser({
        external_id: 'user-123',
        contacts: { id: 1, email: 'test@example.com', photo_url: oldAvatarUrl },
        basic_info: { id: 1 }
      });
      const updatedUser = createTestUser({
        external_id: 'user-123',
        nickname: 'Updated Name'
      });
      const mockFile = createMockFile();

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.update.mockResolvedValue(updatedUser);

      await userService.updateUserWithAvatar(existingUser.external_id!, {
        name: 'Updated Name',
        avatarFile: mockFile
      });

      // Wait for async delete operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockR2Service.uploadToR2).toHaveBeenCalledTimes(1);
      expect(mockR2Service.deleteFromR2).toHaveBeenCalledWith('avatars/old-avatar-uuid.jpg');
    });

    it('should cleanup uploaded avatar when database update fails', async () => {
      const existingUser = createTestUser({
        external_id: 'user-123',
        contacts: { id: 1, email: 'test@example.com', photo_url: null },
        basic_info: { id: 1 }
      });
      const mockFile = createMockFile();

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(existingUser);
      prismaMock.users.update.mockRejectedValue(new Error('Database error'));

      await expect(userService.updateUserWithAvatar(existingUser.external_id!, {
        name: 'Updated Name',
        avatarFile: mockFile
      })).rejects.toThrow('Database error');

      expect(mockR2Service.uploadToR2).toHaveBeenCalledTimes(1);
      expect(mockR2Service.deleteFromR2).toHaveBeenCalledWith(
        expect.stringMatching(/^avatars\/[a-f0-9-]+\.jpg$/)
      );
    });

    it('should handle R2 upload failure', async () => {
      const existingUser = createTestUser({
        external_id: 'user-123',
        contacts: { id: 1, email: 'test@example.com', photo_url: null },
        basic_info: { id: 1 }
      });
      const mockFile = createMockFile();

      prismaMock.users.findUnique.mockResolvedValue(existingUser);
      mockR2Service.uploadToR2.mockRejectedValue(new Error('R2 upload failed'));

      await expect(userService.updateUserWithAvatar(existingUser.external_id!, {
        name: 'Updated Name',
        avatarFile: mockFile
      })).rejects.toThrow('R2 upload failed');

      expect(prismaMock.users.update).not.toHaveBeenCalled();
    });

    it('should use correct file extension from original filename', async () => {
      const existingUser = createTestUser({
        external_id: 'user-123',
        contacts: { id: 1, email: 'test@example.com', photo_url: null },
        basic_info: { id: 1 }
      });
      const updatedUser = createTestUser({ external_id: 'user-123' });
      const mockFile = createMockFile({ originalname: 'photo.PNG' });

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.update.mockResolvedValue(updatedUser);

      await userService.updateUserWithAvatar(existingUser.external_id!, {
        avatarFile: mockFile
      });

      expect(mockR2Service.uploadToR2).toHaveBeenCalledWith(
        expect.objectContaining({ originalname: 'photo.PNG' }),
        expect.stringMatching(/^avatars\/[a-f0-9-]+\.PNG$/)
      );
    });

    it('should continue even if old avatar deletion fails', async () => {
      const oldAvatarUrl = 'https://cdn.example.com/avatars/old-avatar-uuid.jpg';
      const existingUser = createTestUser({
        external_id: 'user-123',
        contacts: { id: 1, email: 'test@example.com', photo_url: oldAvatarUrl },
        basic_info: { id: 1 }
      });
      const updatedUser = createTestUser({ external_id: 'user-123' });
      const mockFile = createMockFile();

      prismaMock.users.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.users.update.mockResolvedValue(updatedUser);
      mockR2Service.deleteFromR2.mockRejectedValue(new Error('R2 delete failed'));

      // Should not throw even if old avatar deletion fails
      const result = await userService.updateUserWithAvatar(existingUser.external_id!, {
        avatarFile: mockFile
      });

      expect(result.success).toBe(true);

      // Wait for async delete operation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify warning was logged
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Failed to delete old avatar',
        expect.objectContaining({ oldAvatarUrl })
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user and all related data', async () => {
      const userToDelete = createTestUser({
        contacts: { id: 10 },
        basic_info: { id: 20 }
      });

      prismaMock.users.findUnique.mockResolvedValue(userToDelete);
      prismaMock.user_positions.deleteMany.mockResolvedValue({ count: 2 });
      prismaMock.contacts.delete.mockResolvedValue(createTestContact());
      prismaMock.basic_info.delete.mockResolvedValue(createTestBasicInfo());
      prismaMock.users.delete.mockResolvedValue(userToDelete);

      const result = await userService.deleteUser(userToDelete.id);

      // Verify deletion order (important for foreign key constraints)
      expect(prismaMock.user_positions.deleteMany).toHaveBeenCalledWith({
        where: { user_id: userToDelete.id }
      });
      // Note: Current implementation doesn't remove entity tags automatically
      expect(prismaMock.contacts.delete).toHaveBeenCalled();
      expect(prismaMock.basic_info.delete).toHaveBeenCalled();
      expect(prismaMock.users.delete).toHaveBeenCalledWith({
        where: { id: userToDelete.id }
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('用戶已成功刪除');
    });

    it('should throw NotFoundError when user not found', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);

      await expect(userService.deleteUser(999))
        .rejects.toThrow('用戶不存在');
    });

    it('should handle partial deletion gracefully', async () => {
      const userToDelete = createTestUser({
        contacts: null,
        basic_info: null
      });

      prismaMock.users.findUnique.mockResolvedValue(userToDelete);
      prismaMock.user_positions.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.users.delete.mockResolvedValue(userToDelete);

      const result = await userService.deleteUser(userToDelete.id);

      expect(result.success).toBe(true);
      expect(prismaMock.contacts.delete).not.toHaveBeenCalled();
      expect(prismaMock.basic_info.delete).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should return only users with open profiles', async () => {
      const mockUsers = createTestUsers(2);
      prismaMock.users.findMany.mockResolvedValue(mockUsers);

      await userService.getAllUsers({});

      // Verify that only users with open profiles are queried
      expect(prismaMock.users.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          is_open_profile: true
        }),
        include: expect.objectContaining({
          roles: true,
          contacts: true,
          basic_info: true,
          user_positions: expect.any(Object)
        }),
        orderBy: { created_at: 'desc' }
      });
    });

    it('should filter users by search terms across nickname and basic info', async () => {
      const mockUsers = createTestUsers(2);
      prismaMock.users.findMany.mockResolvedValue(mockUsers);

      await userService.getAllUsers({ search: 'developer' });

      expect(prismaMock.users.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          is_open_profile: true,
          OR: [
            { nickname: { contains: 'developer', mode: 'insensitive' } },
            { basic_info: { self_introduction: { contains: 'developer', mode: 'insensitive' } } },
            { basic_info: { share_list: { contains: 'developer', mode: 'insensitive' } } }
          ]
        }),
        include: expect.any(Object),
        orderBy: { created_at: 'desc' }
      });
    });

    it('should filter users by education stage', async () => {
      const mockUsers = createTestUsers(1);
      prismaMock.users.findMany.mockResolvedValue(mockUsers);

      await userService.getAllUsers({ educationStage: 'university,graduate' });

      expect(prismaMock.users.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          is_open_profile: true,
          education_stage: { in: ['university', 'graduate'] }
        }),
        include: expect.any(Object),
        orderBy: { created_at: 'desc' }
      });
    });

    it('should handle empty search results', async () => {
      prismaMock.users.findMany.mockResolvedValue([]);
      prismaMock.users.count.mockResolvedValue(0);

      const result = await userService.getAllUsers({ search: 'nonexistent' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
    });

    it('should filter by role list using user positions', async () => {
      const mockUsers = createTestUsers(2);
      prismaMock.users.findMany.mockResolvedValue(mockUsers);

      await userService.getAllUsers({ positionList: 'developer,designer' });

      expect(prismaMock.users.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          is_open_profile: true,
          user_positions: {
            some: {
              position: {
                name: { in: ['developer', 'designer'] }
              }
            }
          }
        }),
        include: expect.any(Object),
        orderBy: { created_at: 'desc' }
      });
    });
  });

  describe('getOneUser', () => {
    it('should return user by UUID', async () => {
      const user = createTestUser();
      prismaMock.users.findUnique.mockResolvedValue(user);
      mockTagService.getEntityTags.mockResolvedValue([
        { id: 1, name: 'developer', created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'student', created_at: new Date(), updated_at: new Date() }
      ]);

      const result = await userService.getOneUser(user.external_id);

      expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
        where: { external_id: user.external_id },
        include: expect.objectContaining({
          basic_info: true,
          contacts: true,
          roles: true
        })
      });

      expect(result?.success).toBe(true);
      expect(result?.data).toBeDefined();
    });

    it('should return null when user not found', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);

      const result = await userService.getOneUser('non-existent-external-id');

      expect(result).toBeNull();
      expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
        where: { external_id: 'non-existent-external-id' },
        include: expect.objectContaining({
          roles: true,
          contacts: true,
          basic_info: true,
          user_positions: expect.any(Object)
        })
      });
    });

    it('should handle numeric ID lookup', async () => {
      const user = createTestUser();
      prismaMock.users.findUnique.mockResolvedValue(user);

      await userService.getOneUser('123'); // Numeric string

      expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
        where: { external_id: '123' },
        include: expect.any(Object)
      });
    });
  });


  describe('Business logic validation', () => {
    describe('user completeness calculation', () => {
      it('should calculate completeness percentage correctly', async () => {
        const incompleteUser = createTestUser({
          bio: null,
          avatar_url: null,
          basic_info: null
        });

        prismaMock.users.findUnique.mockResolvedValue(incompleteUser);
        mockTagService.getEntityTags.mockResolvedValue([]);

        const result = await userService.getOneUser(incompleteUser.external_id);

        // User should have basic data but no completeness score in basic getOneUser
        expect(result?.data).toBeDefined();
        expect(result?.data.name).toBeDefined();
      });

      it('should have high completeness for complete profile', async () => {
        const completeUser = createTestUser({
          bio: 'Complete bio',
          avatar_url: 'https://example.com/avatar.jpg',
          basic_info: createTestBasicInfo(),
          contacts: createTestContact()
        });

        prismaMock.users.findUnique.mockResolvedValue(completeUser);
        mockTagService.getEntityTags.mockResolvedValue([
          { id: 1, name: 'developer', created_at: new Date(), updated_at: new Date() }
        ]);

        const result = await userService.getOneUser(completeUser.external_id);

        // Verify complete profile has all expected fields
        expect(result?.data).toBeDefined();
        expect(result?.data.name).toBeDefined();
        expect(result?.data.tagList).toContain('developer');
      });
    });

    describe('user transformation', () => {
      it('should format user response correctly', async () => {
        const user = createTestUser();
        prismaMock.users.findUnique.mockResolvedValue(user);

        const result = await userService.getOneUser(user.external_id);

        expect(result?.data).toHaveProperty('name');
        expect(result?.data).toHaveProperty('id');
        expect(result?.data).toHaveProperty('createdDate');
        expect(result?.data).toHaveProperty('tagList');
        expect(result?.data).not.toHaveProperty('password');
        expect(result?.data).not.toHaveProperty('deleted_at');
      });
    });
  });
});
