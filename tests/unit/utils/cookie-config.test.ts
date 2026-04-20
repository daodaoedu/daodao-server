/**
 * Cookie Config Unit Tests
 * Tests cookie configuration utilities
 */

import {
  AUTH_COOKIE_NAME,
  COOKIE_MAX_AGE_MS,
  getCookieOptions,
  setAuthCookie,
  clearAuthCookie,
  getAuthToken
} from '@/utils/cookie-config';

describe('Cookie Config', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Constants', () => {
    it('should export AUTH_COOKIE_NAME as auth_token', () => {
      expect(AUTH_COOKIE_NAME).toBe('auth_token');
    });

    it('should export COOKIE_MAX_AGE_MS as 7 days in milliseconds', () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(COOKIE_MAX_AGE_MS).toBe(sevenDaysMs);
    });
  });

  describe('getCookieOptions', () => {
    it('should return cross-site cookie options for any environment', () => {
      process.env.NODE_ENV = 'development';

      const options = getCookieOptions();

      expect(options).toEqual({
        httpOnly: true,
        secure: true,              // 總是 true（sameSite: 'none' 要求）
        sameSite: 'none',          // 允許跨站請求
        path: '/',
        maxAge: COOKIE_MAX_AGE_MS
      });
    });

    it('should return same options for production environment', () => {
      process.env.NODE_ENV = 'production';

      const options = getCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe('none');
      expect(options.path).toBe('/');
    });

    it('should include domain in production when COOKIE_DOMAIN is set', () => {
      process.env.NODE_ENV = 'production';
      process.env.COOKIE_DOMAIN = '.daodao.so';

      const options = getCookieOptions();

      expect(options.domain).toBe('.daodao.so');
    });

    it('should not include domain when COOKIE_DOMAIN is not set', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.COOKIE_DOMAIN;

      const options = getCookieOptions();

      expect(options.domain).toBeUndefined();
    });

    it('should always return secure: true', () => {
      process.env.NODE_ENV = 'development';

      const options = getCookieOptions();

      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe('none');
    });

    it('should allow overriding maxAge option', () => {
      const customMaxAge = 1000 * 60 * 60; // 1 hour

      const options = getCookieOptions({ maxAge: customMaxAge });

      expect(options.maxAge).toBe(customMaxAge);
    });
  });

  describe('setAuthCookie', () => {
    it('should set cookie with correct name and token', () => {
      const mockRes = {
        cookie: jest.fn()
      };
      const token = 'test-jwt-token';

      setAuthCookie(mockRes as any, token);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        token,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/'
        })
      );
    });

    it('should pass custom options to getCookieOptions', () => {
      const mockRes = {
        cookie: jest.fn()
      };
      const token = 'test-jwt-token';
      const customMaxAge = 1000 * 60 * 30; // 30 minutes

      setAuthCookie(mockRes as any, token, { maxAge: customMaxAge });

      expect(mockRes.cookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        token,
        expect.objectContaining({
          maxAge: customMaxAge
        })
      );
    });
  });

  describe('clearAuthCookie', () => {
    it('should clear cookie with correct name', () => {
      const mockRes = {
        clearCookie: jest.fn()
      };

      clearAuthCookie(mockRes as any);

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/'
        })
      );
    });

    it('should not include maxAge in clear options', () => {
      const mockRes = {
        clearCookie: jest.fn()
      };

      clearAuthCookie(mockRes as any);

      const callArgs = mockRes.clearCookie.mock.calls[0][1];
      expect(callArgs.maxAge).toBeUndefined();
    });

    it('should include domain in production when COOKIE_DOMAIN is set', () => {
      process.env.NODE_ENV = 'production';
      process.env.COOKIE_DOMAIN = '.daodao.so';

      const mockRes = {
        clearCookie: jest.fn()
      };

      clearAuthCookie(mockRes as any);

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        expect.objectContaining({
          domain: '.daodao.so'
        })
      );
    });
  });

  describe('getAuthToken', () => {
    it('should return token from cookie when present', () => {
      const mockReq = {
        cookies: {
          [AUTH_COOKIE_NAME]: 'cookie-token'
        },
        headers: {
          authorization: 'Bearer header-token'
        }
      };

      const token = getAuthToken(mockReq);

      expect(token).toBe('cookie-token');
    });

    it('should return token from Authorization header when cookie is not present', () => {
      const mockReq = {
        cookies: {},
        headers: {
          authorization: 'Bearer header-token'
        }
      };

      const token = getAuthToken(mockReq);

      expect(token).toBe('header-token');
    });

    it('should return undefined when no token is present', () => {
      const mockReq = {
        cookies: {},
        headers: {}
      };

      const token = getAuthToken(mockReq);

      expect(token).toBeUndefined();
    });

    it('should return undefined when cookies object is undefined', () => {
      const mockReq = {
        headers: {}
      };

      const token = getAuthToken(mockReq as any);

      expect(token).toBeUndefined();
    });

    it('should return undefined when Authorization header does not start with Bearer', () => {
      const mockReq = {
        cookies: {},
        headers: {
          authorization: 'Basic sometoken'
        }
      };

      const token = getAuthToken(mockReq);

      expect(token).toBeUndefined();
    });

    it('should prioritize cookie over Authorization header', () => {
      const mockReq = {
        cookies: {
          [AUTH_COOKIE_NAME]: 'priority-cookie-token'
        },
        headers: {
          authorization: 'Bearer fallback-header-token'
        }
      };

      const token = getAuthToken(mockReq);

      expect(token).toBe('priority-cookie-token');
    });

    it('should handle empty cookie value', () => {
      const mockReq = {
        cookies: {
          [AUTH_COOKIE_NAME]: ''
        },
        headers: {
          authorization: 'Bearer header-token'
        }
      };

      const token = getAuthToken(mockReq);

      // Empty string is falsy, should fall back to header
      expect(token).toBe('header-token');
    });
  });
});
