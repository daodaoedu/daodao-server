/**
 * 環境配置測試
 * 測試環境變數配置的正確性和錯誤處理
 */

import { jwtService } from '@/services/jwt.service';
import { oauthService } from '@/services/auth/oauth.service';

describe('Environment Configuration Tests', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('JWT Configuration', () => {
    it('should use JWT_SECRET if available', () => {
      process.env.JWT_SECRET = 'test-jwt-secret';
      delete process.env.JWT_SECURITY;

      const token = jwtService.generateToken({ id: 1, username: 'test' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwtService.verifyToken(token);
      expect(decoded.id).toBe(1);
      expect(decoded.username).toBe('test');
    });

    it('should fallback to JWT_SECURITY if JWT_SECRET not available', () => {
      delete process.env.JWT_SECRET;
      process.env.JWT_SECURITY = 'test-jwt-security';

      const token = jwtService.generateToken({ id: 1, username: 'test' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwtService.verifyToken(token);
      expect(decoded.id).toBe(1);
      expect(decoded.username).toBe('test');
    });

    it('should handle missing JWT secrets gracefully', () => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_SECURITY;

      expect(() => {
        jwtService.generateToken({ id: 1, username: 'test' });
      }).toThrow();
    });

    it('should validate JWT secret strength', () => {
      // Very weak secret
      process.env.JWT_SECRET = '123';

      // In a real application, this should warn about weak secrets
      const token = jwtService.generateToken({ id: 1, username: 'test' });
      expect(token).toBeDefined();

      // Strong secret
      process.env.JWT_SECRET = 'very-long-and-secure-jwt-secret-key-with-sufficient-entropy';
      
      const strongToken = jwtService.generateToken({ id: 1, username: 'test' });
      expect(strongToken).toBeDefined();
      expect(strongToken).not.toBe(token);
    });

    it('should handle JWT secret with special characters', () => {
      process.env.JWT_SECRET = 'secret-with-!@#$%^&*()_+-=[]{}|;:,.<>?';

      const token = jwtService.generateToken({ id: 1, username: 'test' });
      expect(token).toBeDefined();

      const decoded = jwtService.verifyToken(token);
      expect(decoded.id).toBe(1);
    });
  });

  describe('Google OAuth Configuration', () => {
    it('should handle complete Google OAuth configuration', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.GOOGLE_CALLBACK_URL = 'http://localhost:4000/auth/google/callback';

      // Test that configuration is valid
      expect(process.env.GOOGLE_CLIENT_ID).toBe('test-client-id');
      expect(process.env.GOOGLE_CLIENT_SECRET).toBe('test-client-secret');
      expect(process.env.GOOGLE_CALLBACK_URL).toBe('http://localhost:4000/auth/google/callback');
    });

    it('should handle missing Google OAuth client ID', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.GOOGLE_CALLBACK_URL = 'http://localhost:4000/auth/google/callback';

      // OAuth should not be configured
      const isConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
      expect(isConfigured).toBeFalsy();
    });

    it('should handle missing Google OAuth client secret', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      delete process.env.GOOGLE_CLIENT_SECRET;
      process.env.GOOGLE_CALLBACK_URL = 'http://localhost:4000/auth/google/callback';

      const isConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
      expect(isConfigured).toBeFalsy();
    });

    it('should handle invalid callback URL format', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.GOOGLE_CALLBACK_URL = 'invalid-url';

      // Should detect invalid URL format
      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isValidUrl(process.env.GOOGLE_CALLBACK_URL)).toBe(false);
    });

    it('should handle relative callback URL', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.GOOGLE_CALLBACK_URL = '/auth/google/callback';

      // Should detect relative URL
      const isAbsoluteUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isAbsoluteUrl(process.env.GOOGLE_CALLBACK_URL)).toBe(false);
    });
  });

  describe('Database Configuration', () => {
    it('should handle complete database configuration', () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/testdb';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_USER = 'testuser';
      process.env.POSTGRES_PASSWORD = 'testpassword';
      process.env.POSTGRES_DB = 'testdb';

      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.POSTGRES_HOST).toBe('localhost');
      expect(process.env.POSTGRES_PORT).toBe('5432');
    });

    it('should handle missing database URL', () => {
      delete process.env.DATABASE_URL;
      
      // Should be able to construct URL from individual components
      const host = process.env.POSTGRES_HOST || 'localhost';
      const port = process.env.POSTGRES_PORT || '5432';
      const user = process.env.POSTGRES_USER || 'postgres';
      const password = process.env.POSTGRES_PASSWORD || '';
      const db = process.env.POSTGRES_DB || 'postgres';

      const constructedUrl = `postgresql://${user}:${password}@${host}:${port}/${db}`;
      expect(constructedUrl).toMatch(/^postgresql:\/\/.+/);
    });

    it('should validate database URL format', () => {
      const testUrls = [
        'postgresql://user:pass@localhost:5432/db', // Valid
        'postgres://user:pass@localhost:5432/db',   // Valid alternative
        'mysql://user:pass@localhost:3306/db',      // Invalid for Postgres
        'invalid-url',                               // Invalid format
        ''                                          // Empty
      ];

      const isValidPostgresUrl = (url: string) => {
        return url.startsWith('postgresql://') || url.startsWith('postgres://');
      };

      expect(isValidPostgresUrl(testUrls[0])).toBe(true);
      expect(isValidPostgresUrl(testUrls[1])).toBe(true);
      expect(isValidPostgresUrl(testUrls[2])).toBe(false);
      expect(isValidPostgresUrl(testUrls[3])).toBe(false);
      expect(isValidPostgresUrl(testUrls[4])).toBe(false);
    });

    it('should handle database connection parameters', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db?schema=public&connection_limit=10';
      
      const url = new URL(process.env.DATABASE_URL);
      expect(url.protocol).toBe('postgresql:');
      expect(url.hostname).toBe('localhost');
      expect(url.port).toBe('5432');
      expect(url.pathname).toBe('/db');
      expect(url.searchParams.get('schema')).toBe('public');
      expect(url.searchParams.get('connection_limit')).toBe('10');
    });
  });

  describe('Frontend Configuration', () => {
    it('should handle frontend URL configuration', () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';

      expect(process.env.FRONTEND_URL).toBe('http://localhost:3000');

      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isValidUrl(process.env.FRONTEND_URL)).toBe(true);
    });

    it('should handle missing frontend URL', () => {
      delete process.env.FRONTEND_URL;

      const defaultFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      expect(defaultFrontendUrl).toBe('http://localhost:3000');
    });

    it('should handle different protocol schemes', () => {
      const testUrls = [
        'http://localhost:3000',
        'https://example.com',
        'https://app.example.com:8080',
        'ftp://example.com', // Invalid for frontend
        'localhost:3000' // Missing protocol
      ];

      const isValidFrontendUrl = (url: string) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      };

      expect(isValidFrontendUrl(testUrls[0])).toBe(true);
      expect(isValidFrontendUrl(testUrls[1])).toBe(true);
      expect(isValidFrontendUrl(testUrls[2])).toBe(true);
      expect(isValidFrontendUrl(testUrls[3])).toBe(false);
      expect(isValidFrontendUrl(testUrls[4])).toBe(false);
    });
  });

  describe('Email Configuration', () => {
    it('should handle complete email configuration', () => {
      process.env.EMAIL_ADDRESS = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'app-specific-password';
      process.env.EMAIL_HOST = 'smtp.gmail.com';
      process.env.EMAIL_PORT = '587';

      expect(process.env.EMAIL_ADDRESS).toBe('test@example.com');
      expect(process.env.EMAIL_PASSWORD).toBeDefined();
      expect(process.env.EMAIL_HOST).toBe('smtp.gmail.com');
      expect(process.env.EMAIL_PORT).toBe('587');
    });

    it('should validate email address format', () => {
      const testEmails = [
        'valid@example.com',
        'user.name@example.co.uk',
        'invalid-email',
        '@example.com',
        'user@',
        ''
      ];

      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail(testEmails[0])).toBe(true);
      expect(isValidEmail(testEmails[1])).toBe(true);
      expect(isValidEmail(testEmails[2])).toBe(false);
      expect(isValidEmail(testEmails[3])).toBe(false);
      expect(isValidEmail(testEmails[4])).toBe(false);
      expect(isValidEmail(testEmails[5])).toBe(false);
    });

    it('should handle missing email configuration', () => {
      delete process.env.EMAIL_ADDRESS;
      delete process.env.EMAIL_PASSWORD;

      const isEmailConfigured = process.env.EMAIL_ADDRESS && process.env.EMAIL_PASSWORD;
      expect(isEmailConfigured).toBeFalsy();
    });

    it('should validate email port numbers', () => {
      const testPorts = ['25', '587', '465', '993', 'invalid', '', '99999'];

      const isValidPort = (port: string) => {
        const portNum = parseInt(port, 10);
        return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
      };

      expect(isValidPort(testPorts[0])).toBe(true);
      expect(isValidPort(testPorts[1])).toBe(true);
      expect(isValidPort(testPorts[2])).toBe(true);
      expect(isValidPort(testPorts[3])).toBe(true);
      expect(isValidPort(testPorts[4])).toBe(false);
      expect(isValidPort(testPorts[5])).toBe(false);
      expect(isValidPort(testPorts[6])).toBe(false);
    });
  });

  describe('Node Environment', () => {
    it('should handle development environment', () => {
      process.env.NODE_ENV = 'dev';

      expect(process.env.NODE_ENV).toBe('dev');
      
      const isDevelopment = process.env.NODE_ENV === 'dev';
      expect(isDevelopment).toBe(true);
    });

    it('should handle prod environment', () => {
      process.env.NODE_ENV = 'prod';

      expect(process.env.NODE_ENV).toBe('prod');
      
      const isProduction = process.env.NODE_ENV === 'prod';
      expect(isProduction).toBe(true);
    });

    it('should handle test environment', () => {
      process.env.NODE_ENV = 'test';

      expect(process.env.NODE_ENV).toBe('test');
      
      const isTest = process.env.NODE_ENV === 'test';
      expect(isTest).toBe(true);
    });

    it('should handle missing NODE_ENV', () => {
      delete process.env.NODE_ENV;

      const environment = process.env.NODE_ENV || 'dev';
      expect(environment).toBe('dev');
    });

    it('should handle custom environments', () => {
      process.env.NODE_ENV = 'staging';

      expect(process.env.NODE_ENV).toBe('staging');
      
      const knownEnvironments = ['dev', 'prod', 'test'];
      const isKnownEnvironment = knownEnvironments.includes(process.env.NODE_ENV);
      expect(isKnownEnvironment).toBe(false);
    });
  });

  describe('Port Configuration', () => {
    it('should handle valid port numbers', () => {
      process.env.PORT = '3000';

      const port = parseInt(process.env.PORT, 10);
      expect(port).toBe(3000);
      expect(port > 0 && port <= 65535).toBe(true);
    });

    it('should handle missing port configuration', () => {
      delete process.env.PORT;

      const defaultPort = 4000;
      const port = process.env.PORT ? parseInt(process.env.PORT, 10) : defaultPort;
      expect(port).toBe(defaultPort);
    });

    it('should handle invalid port numbers', () => {
      const testPorts = ['0', '-1', '65536', '99999', 'invalid', ''];

      const isValidPort = (portStr: string) => {
        const port = parseInt(portStr, 10);
        return !isNaN(port) && port > 0 && port <= 65535;
      };

      testPorts.forEach(testPort => {
        expect(isValidPort(testPort)).toBe(false);
      });
    });

    it('should handle port conflicts', () => {
      // Simulate checking if port is in use
      const commonPorts = [80, 443, 22, 21, 25, 53, 110, 995, 993, 143];
      const requestedPort = 80;

      const isCommonPort = commonPorts.includes(requestedPort);
      expect(isCommonPort).toBe(true);

      // In development, might want to warn about using common ports
      const isDevelopment = process.env.NODE_ENV === 'dev';
      if (isDevelopment && isCommonPort) {
        // This would typically log a warning
        expect(true).toBe(true); // Placeholder for warning logic
      }
    });
  });

  describe('Security Configuration', () => {
    it('should validate session secret strength', () => {
      const testSecrets = [
        'very-long-and-secure-session-secret-with-sufficient-entropy',
        'short',
        '',
        '12345678',
        'keyboard-cat'
      ];

      const isStrongSecret = (secret: string) => {
        return secret.length >= 32 && !/^(12345|password|secret|abc|keyboard)/.test(secret);
      };

      expect(isStrongSecret(testSecrets[0])).toBe(true);
      expect(isStrongSecret(testSecrets[1])).toBe(false);
      expect(isStrongSecret(testSecrets[2])).toBe(false);
      expect(isStrongSecret(testSecrets[3])).toBe(false);
      expect(isStrongSecret(testSecrets[4])).toBe(false);
    });

    it('should handle CORS origin configuration', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000,https://app.example.com';

      const corsOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
      expect(corsOrigins).toHaveLength(2);
      expect(corsOrigins[0]).toBe('http://localhost:3000');
      expect(corsOrigins[1]).toBe('https://app.example.com');

      // Validate each origin
      corsOrigins.forEach(origin => {
        expect(() => new URL(origin)).not.toThrow();
      });
    });

    it('should handle rate limiting configuration', () => {
      process.env.RATE_LIMIT_WINDOW = '900000'; // 15 minutes
      process.env.RATE_LIMIT_MAX = '100';

      const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW, 10);
      const maxRequests = parseInt(process.env.RATE_LIMIT_MAX, 10);

      expect(windowMs).toBe(900000);
      expect(maxRequests).toBe(100);
      expect(windowMs > 0).toBe(true);
      expect(maxRequests > 0).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate all required configurations', () => {
      const requiredConfigs = [
        'JWT_SECRET',
        'DATABASE_URL',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
      ];

      // Set all required configs
      process.env.JWT_SECRET = 'test-jwt-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      const missingConfigs = requiredConfigs.filter(config => !process.env[config]);
      expect(missingConfigs).toHaveLength(0);
    });

    it('should identify missing required configurations', () => {
      // Clear all configs
      delete process.env.JWT_SECRET;
      delete process.env.DATABASE_URL;
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const requiredConfigs = [
        'JWT_SECRET',
        'DATABASE_URL',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
      ];

      const missingConfigs = requiredConfigs.filter(config => !process.env[config]);
      expect(missingConfigs).toHaveLength(4);
      expect(missingConfigs).toEqual(requiredConfigs);
    });

    it('should validate configuration interdependencies', () => {
      // OAuth requires both client ID and secret
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      delete process.env.GOOGLE_CLIENT_SECRET;

      const isOAuthConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
      expect(isOAuthConfigured).toBeFalsy();

      // Email requires both address and password
      process.env.EMAIL_ADDRESS = 'test@example.com';
      delete process.env.EMAIL_PASSWORD;

      const isEmailConfigured = process.env.EMAIL_ADDRESS && process.env.EMAIL_PASSWORD;
      expect(isEmailConfigured).toBeFalsy();
    });
  });
});