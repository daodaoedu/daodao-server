/**
 * OAuth 服務單元測試
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
  initializePassport,
  initializePassportSession,
  authenticateGoogle,
  authenticateGoogleCallback,
  oauthService
} from '../../../services/auth/oauth.service';

// Mock models
jest.mock('../../../models/index', () => ({
  User: {
    findByPk: jest.fn()
  },
  Contact: {
    findOne: jest.fn()
  },
  TempUser: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

// Mock passport
jest.mock('passport', () => ({
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  initialize: jest.fn(() => 'passport-initialize-middleware'),
  session: jest.fn(() => 'passport-session-middleware'),
  authenticate: jest.fn(() => 'passport-authenticate-middleware')
}));

describe('OAuth Service', () => {
  let originalEnv: NodeJS.ProcessEnv;
  const { User, Contact, TempUser } = require('../../../models/index');

  beforeAll(() => {
    originalEnv = process.env;
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment Variables Validation', () => {
    it('should throw error if GOOGLE_CLIENT_ID is missing', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      
      expect(() => {
        require('../../../services/auth/oauth.service');
      }).toThrow('Missing required OAuth environment variables');
      
      // Restore env var
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    });

    it('should throw error if GOOGLE_CLIENT_SECRET is missing', () => {
      delete process.env.GOOGLE_CLIENT_SECRET;
      
      expect(() => {
        require('../../../services/auth/oauth.service');
      }).toThrow('Missing required OAuth environment variables');
      
      // Restore env var
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    });

    it('should throw error if GOOGLE_CALLBACK_URL is missing', () => {
      delete process.env.GOOGLE_CALLBACK_URL;
      
      expect(() => {
        require('../../../services/auth/oauth.service');
      }).toThrow('Missing required OAuth environment variables');
      
      // Restore env var
      process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
    });
  });

  describe('Passport Configuration', () => {
    it('should configure Google OAuth strategy', () => {
      expect(passport.use).toHaveBeenCalledWith(expect.any(GoogleStrategy));
    });

    it('should configure user serialization', () => {
      expect(passport.serializeUser).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should configure user deserialization', () => {
      expect(passport.deserializeUser).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('User Serialization', () => {
    it('should serialize user with id and type', (done) => {
      const mockUser = { id: 1, dataValues: { id: 1, username: 'test' } };
      const mockDone = jest.fn((err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual({ id: 1, type: 'user' });
        done();
      });

      // Get the serialize function from the mock call
      const serializeFunction = (passport.serializeUser as jest.Mock).mock.calls[0][0];
      serializeFunction(mockUser, mockDone);
    });

    it('should serialize temp user', (done) => {
      const mockTempUser = { id: 1 }; // No dataValues = temp user
      const mockDone = jest.fn((err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual({ id: 1, type: 'temp' });
        done();
      });

      const serializeFunction = (passport.serializeUser as jest.Mock).mock.calls[0][0];
      serializeFunction(mockTempUser, mockDone);
    });

    it('should handle user with external_id', (done) => {
      const mockUser = { external_id: 1 };
      const mockDone = jest.fn((err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual({ id: 1, type: 'user' });
        done();
      });

      const serializeFunction = (passport.serializeUser as jest.Mock).mock.calls[0][0];
      serializeFunction(mockUser, mockDone);
    });

    it('should handle invalid user object', (done) => {
      const mockUser = {}; // No id or external_id
      const mockDone = jest.fn((err, result) => {
        expect(err).toEqual(new Error('Invalid user object'));
        expect(result).toBeNull();
        done();
      });

      const serializeFunction = (passport.serializeUser as jest.Mock).mock.calls[0][0];
      serializeFunction(mockUser, mockDone);
    });
  });

  describe('User Deserialization', () => {
    it('should deserialize formal user', async () => {
      const mockUser = { id: 1, username: 'test' };
      User.findByPk.mockResolvedValue(mockUser);

      const mockDone = jest.fn();
      const deserializeFunction = (passport.deserializeUser as jest.Mock).mock.calls[0][0];
      
      await deserializeFunction({ id: '1', type: 'user' }, mockDone);

      expect(User.findByPk).toHaveBeenCalledWith('1');
      expect(mockDone).toHaveBeenCalledWith(null, mockUser);
    });

    it('should deserialize temp user', async () => {
      const mockTempUser = { id: 1, email: 'temp@test.com' };
      TempUser.findByPk.mockResolvedValue(mockTempUser);

      const mockDone = jest.fn();
      const deserializeFunction = (passport.deserializeUser as jest.Mock).mock.calls[0][0];
      
      await deserializeFunction({ id: '1', type: 'temp' }, mockDone);

      expect(TempUser.findByPk).toHaveBeenCalledWith('1');
      expect(mockDone).toHaveBeenCalledWith(null, mockTempUser);
    });

    it('should handle deserialization error', async () => {
      const error = new Error('Database error');
      User.findByPk.mockRejectedValue(error);

      const mockDone = jest.fn();
      const deserializeFunction = (passport.deserializeUser as jest.Mock).mock.calls[0][0];
      
      await deserializeFunction({ id: '1', type: 'user' }, mockDone);

      expect(mockDone).toHaveBeenCalledWith(error, null);
    });
  });

  describe('Google OAuth Strategy', () => {
    let strategyCallback: Function;

    beforeEach(() => {
      // Get the strategy callback function
      const strategyCall = (passport.use as jest.Mock).mock.calls.find(call => 
        call[0] instanceof GoogleStrategy
      );
      if (strategyCall) {
        strategyCallback = strategyCall[0]._verify;
      }
    });

    it('should handle existing formal user', async () => {
      const mockProfile = {
        id: 'google-123',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }],
        photos: [{ value: 'http://photo.url' }]
      };

      const mockContact = {
        email: 'test@example.com',
        user: { id: 1, username: 'test' }
      };

      Contact.findOne.mockResolvedValue(mockContact);

      const mockDone = jest.fn();
      await strategyCallback('access-token', 'refresh-token', mockProfile, mockDone);

      expect(Contact.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [{
          model: User,
          as: 'user',
          required: false
        }]
      });
      expect(mockDone).toHaveBeenCalledWith(null, mockContact.user);
    });

    it('should create new temp user', async () => {
      const mockProfile = {
        id: 'google-123',
        displayName: 'New User',
        emails: [{ value: 'new@example.com' }],
        photos: [{ value: 'http://photo.url' }]
      };

      Contact.findOne.mockResolvedValue(null);
      TempUser.findOne.mockResolvedValue(null);
      
      const mockNewTempUser = { id: 1, google_id: 'google-123' };
      TempUser.create.mockResolvedValue(mockNewTempUser);

      const mockDone = jest.fn();
      await strategyCallback('access-token', 'refresh-token', mockProfile, mockDone);

      expect(TempUser.create).toHaveBeenCalledWith({
        google_id: 'google-123',
        email: 'new@example.com',
        name: 'New User',
        photo_url: 'http://photo.url',
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      });
      expect(mockDone).toHaveBeenCalledWith(null, mockNewTempUser);
    });

    it('should update existing temp user', async () => {
      const mockProfile = {
        id: 'google-123',
        displayName: 'Updated User',
        emails: [{ value: 'existing@example.com' }],
        photos: [{ value: 'http://new-photo.url' }]
      };

      Contact.findOne.mockResolvedValue(null);
      
      const mockExistingTempUser = {
        id: 1,
        google_id: 'google-123',
        update: jest.fn().mockResolvedValue(true)
      };
      TempUser.findOne.mockResolvedValue(mockExistingTempUser);

      const mockDone = jest.fn();
      await strategyCallback('access-token', 'refresh-token', mockProfile, mockDone);

      expect(mockExistingTempUser.update).toHaveBeenCalledWith({
        name: 'Updated User',
        photo_url: 'http://new-photo.url',
        updated_at: expect.any(Date)
      });
      expect(mockDone).toHaveBeenCalledWith(null, mockExistingTempUser);
    });

    it('should handle unique constraint error when creating temp user', async () => {
      const mockProfile = {
        id: 'google-123',
        displayName: 'New User',
        emails: [{ value: 'new@example.com' }]
      };

      Contact.findOne.mockResolvedValue(null);
      TempUser.findOne.mockResolvedValueOnce(null); // First call returns null
      
      const uniqueConstraintError = new Error('Unique constraint error');
      uniqueConstraintError.name = 'SequelizeUniqueConstraintError';
      TempUser.create.mockRejectedValue(uniqueConstraintError);
      
      const mockExistingTempUser = { id: 1, google_id: 'google-123' };
      TempUser.findOne.mockResolvedValueOnce(mockExistingTempUser); // Second call returns existing user

      const mockDone = jest.fn();
      await strategyCallback('access-token', 'refresh-token', mockProfile, mockDone);

      expect(TempUser.findOne).toHaveBeenCalledTimes(2);
      expect(mockDone).toHaveBeenCalledWith(null, mockExistingTempUser);
    });

    it('should handle profile without email', async () => {
      const mockProfile = {
        id: 'google-123',
        displayName: 'No Email User',
        emails: []
      };

      const mockDone = jest.fn();
      await strategyCallback('access-token', 'refresh-token', mockProfile, mockDone);

      expect(mockDone).toHaveBeenCalledWith(
        new Error('No email found in Google profile'),
        false
      );
    });

    it('should handle profile with undefined emails', async () => {
      const mockProfile = {
        id: 'google-123',
        displayName: 'No Email User'
        // emails property is undefined
      };

      const mockDone = jest.fn();
      await strategyCallback('access-token', 'refresh-token', mockProfile, mockDone);

      expect(mockDone).toHaveBeenCalledWith(
        new Error('No email found in Google profile'),
        false
      );
    });

    it('should handle database errors', async () => {
      const mockProfile = {
        id: 'google-123',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }]
      };

      const dbError = new Error('Database connection failed');
      Contact.findOne.mockRejectedValue(dbError);

      const mockDone = jest.fn();
      await strategyCallback('access-token', 'refresh-token', mockProfile, mockDone);

      expect(mockDone).toHaveBeenCalledWith(dbError, false);
    });

    it('should handle failed temp user creation', async () => {
      const mockProfile = {
        id: 'google-123',
        displayName: 'New User',
        emails: [{ value: 'new@example.com' }]
      };

      Contact.findOne.mockResolvedValue(null);
      TempUser.findOne.mockResolvedValue(null);
      TempUser.create.mockResolvedValue(null); // Creation failed

      const mockDone = jest.fn();
      await strategyCallback('access-token', 'refresh-token', mockProfile, mockDone);

      expect(mockDone).toHaveBeenCalledWith(
        new Error('無法創建或找到用戶'),
        false
      );
    });
  });

  describe('Middleware Functions', () => {
    it('should return passport initialize middleware', () => {
      const result = initializePassport();
      expect(passport.initialize).toHaveBeenCalled();
      expect(result).toBe('passport-initialize-middleware');
    });

    it('should return passport session middleware', () => {
      const result = initializePassportSession();
      expect(passport.session).toHaveBeenCalled();
      expect(result).toBe('passport-session-middleware');
    });

    it('should return Google authentication middleware', () => {
      const result = authenticateGoogle;
      expect(passport.authenticate).toHaveBeenCalledWith('google', {
        scope: ['profile', 'email']
      });
      expect(result).toBe('passport-authenticate-middleware');
    });

    it('should return Google callback authentication middleware', () => {
      const result = authenticateGoogleCallback;
      expect(passport.authenticate).toHaveBeenCalledWith('google', {
        failureRedirect: 'http://localhost:3000/auth/failure'
      });
      expect(result).toBe('passport-authenticate-middleware');
    });
  });

  describe('OAuth Service Object', () => {
    it('should export all required methods', () => {
      expect(oauthService.initializePassport).toBeDefined();
      expect(oauthService.initializePassportSession).toBeDefined();
      expect(oauthService.authenticateGoogle).toBeDefined();
      expect(oauthService.authenticateGoogleCallback).toBeDefined();
      
      expect(typeof oauthService.initializePassport).toBe('function');
      expect(typeof oauthService.initializePassportSession).toBe('function');
    });

    it('should have working methods', () => {
      const initResult = oauthService.initializePassport();
      const sessionResult = oauthService.initializePassportSession();
      
      expect(initResult).toBeDefined();
      expect(sessionResult).toBeDefined();
      expect(oauthService.authenticateGoogle).toBeDefined();
      expect(oauthService.authenticateGoogleCallback).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete OAuth flow for new user', async () => {
      const mockProfile = {
        id: 'google-new-123',
        displayName: 'Integration Test User',
        emails: [{ value: 'integration@example.com' }],
        photos: [{ value: 'http://integration-photo.url' }]
      };

      // Mock no existing user or temp user
      Contact.findOne.mockResolvedValue(null);
      TempUser.findOne.mockResolvedValue(null);
      
      const mockNewTempUser = { 
        id: 999, 
        google_id: 'google-new-123',
        email: 'integration@example.com' 
      };
      TempUser.create.mockResolvedValue(mockNewTempUser);

      const strategyCall = (passport.use as jest.Mock).mock.calls.find(call => 
        call[0] instanceof GoogleStrategy
      );
      const strategyCallback = strategyCall[0]._verify;

      const mockDone = jest.fn();
      await strategyCallback('access-token', 'refresh-token', mockProfile, mockDone);

      expect(Contact.findOne).toHaveBeenCalled();
      expect(TempUser.findOne).toHaveBeenCalled();
      expect(TempUser.create).toHaveBeenCalled();
      expect(mockDone).toHaveBeenCalledWith(null, mockNewTempUser);
    });

    it('should handle complete OAuth flow for existing user', async () => {
      const mockProfile = {
        id: 'google-existing-123',
        displayName: 'Existing User',
        emails: [{ value: 'existing@example.com' }]
      };

      const mockExistingUser = { id: 1, username: 'existing' };
      const mockContact = {
        email: 'existing@example.com',
        user: mockExistingUser
      };

      Contact.findOne.mockResolvedValue(mockContact);

      const strategyCall = (passport.use as jest.Mock).mock.calls.find(call => 
        call[0] instanceof GoogleStrategy
      );
      const strategyCallback = strategyCall[0]._verify;

      const mockDone = jest.fn();
      await strategyCallback('access-token', 'refresh-token', mockProfile, mockDone);

      expect(Contact.findOne).toHaveBeenCalled();
      expect(TempUser.findOne).not.toHaveBeenCalled();
      expect(TempUser.create).not.toHaveBeenCalled();
      expect(mockDone).toHaveBeenCalledWith(null, mockExistingUser);
    });
  });
});