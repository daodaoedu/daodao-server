/**
 * OAuth State Unit Tests
 * Tests OAuth state encoding, decoding, and validation utilities
 */

import {
  generateNonce,
  createOAuthState,
  encodeOAuthState,
  decodeOAuthState,
  validateOAuthState,
  getCallbackUrl,
  getFinalRedirectUrl,
  OAuthState
} from '@/utils/oauth-state';

describe('OAuth State Utils', () => {
  describe('generateNonce', () => {
    it('should generate a random string of default length (32 hex chars = 16 bytes)', () => {
      const nonce = generateNonce();
      expect(nonce).toHaveLength(32); // 16 bytes = 32 hex characters
      expect(nonce).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate a random string of custom length', () => {
      const nonce = generateNonce(8);
      expect(nonce).toHaveLength(16); // 8 bytes = 16 hex characters
    });

    it('should generate unique values', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('createOAuthState', () => {
    it('should create state with provided redirectUrl', () => {
      const state = createOAuthState('/profile');

      expect(state.redirectUrl).toBe('/profile');
      expect(state.source).toBe('app');
      expect(state.timestamp).toBeLessThanOrEqual(Date.now());
      expect(state.nonce).toBeDefined();
    });

    it('should use default redirectUrl when empty string provided', () => {
      const state = createOAuthState('');

      expect(state.redirectUrl).toBe('/dashboard');
    });

    it('should create state with custom source', () => {
      const state = createOAuthState('/home', 'website');

      expect(state.source).toBe('website');
    });

    it('should default source to app', () => {
      const state = createOAuthState('/home');

      expect(state.source).toBe('app');
    });

    it('should generate unique nonces for each state', () => {
      const state1 = createOAuthState('/page1');
      const state2 = createOAuthState('/page2');

      expect(state1.nonce).not.toBe(state2.nonce);
    });
  });

  describe('encodeOAuthState', () => {
    it('should encode state to base64url string', () => {
      const state: OAuthState = {
        redirectUrl: '/dashboard',
        source: 'app',
        timestamp: 1704067200000,
        nonce: 'test-nonce-123'
      };

      const encoded = encodeOAuthState(state);

      expect(typeof encoded).toBe('string');
      expect(encoded).not.toContain('+'); // base64url doesn't use +
      expect(encoded).not.toContain('/'); // base64url doesn't use /
    });

    it('should produce decodable output', () => {
      const state: OAuthState = {
        redirectUrl: '/profile/settings',
        source: 'website',
        timestamp: Date.now(),
        nonce: generateNonce()
      };

      const encoded = encodeOAuthState(state);
      const decoded = decodeOAuthState(encoded);

      expect(decoded).toEqual(state);
    });

    it('should handle special characters in redirectUrl', () => {
      const state: OAuthState = {
        redirectUrl: '/search?q=test&page=1',
        source: 'app',
        timestamp: Date.now(),
        nonce: generateNonce()
      };

      const encoded = encodeOAuthState(state);
      const decoded = decodeOAuthState(encoded);

      expect(decoded?.redirectUrl).toBe('/search?q=test&page=1');
    });

    it('should handle unicode characters', () => {
      const state: OAuthState = {
        redirectUrl: '/用戶/設定',
        source: 'app',
        timestamp: Date.now(),
        nonce: generateNonce()
      };

      const encoded = encodeOAuthState(state);
      const decoded = decodeOAuthState(encoded);

      expect(decoded?.redirectUrl).toBe('/用戶/設定');
    });
  });

  describe('decodeOAuthState', () => {
    it('should decode valid base64url state', () => {
      const originalState: OAuthState = {
        redirectUrl: '/dashboard',
        source: 'app',
        timestamp: 1704067200000,
        nonce: 'abc123'
      };

      const encoded = encodeOAuthState(originalState);
      const decoded = decodeOAuthState(encoded);

      expect(decoded).toEqual(originalState);
    });

    it('should return null for invalid base64', () => {
      const decoded = decodeOAuthState('not-valid-base64!!!');

      expect(decoded).toBeNull();
    });

    it('should return null for valid base64 but invalid JSON', () => {
      const invalidJson = Buffer.from('not json', 'utf-8').toString('base64url');
      const decoded = decodeOAuthState(invalidJson);

      expect(decoded).toBeNull();
    });

    it('should return null for empty string', () => {
      const decoded = decodeOAuthState('');

      expect(decoded).toBeNull();
    });
  });

  describe('validateOAuthState', () => {
    const createValidEncodedState = (overrides: Partial<OAuthState> = {}): string => {
      const state: OAuthState = {
        redirectUrl: '/dashboard',
        source: 'app',
        timestamp: Date.now(),
        nonce: generateNonce(),
        ...overrides
      };
      return encodeOAuthState(state);
    };

    it('should return valid for properly formatted state', () => {
      const encoded = createValidEncodedState();

      const result = validateOAuthState(encoded);

      expect(result.valid).toBe(true);
      expect(result.state).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for malformed state', () => {
      const result = validateOAuthState('invalid-state');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid state format');
    });

    it('should return invalid when redirectUrl is missing', () => {
      const state = {
        source: 'app',
        timestamp: Date.now(),
        nonce: generateNonce()
      };
      const encoded = Buffer.from(JSON.stringify(state), 'utf-8').toString('base64url');

      const result = validateOAuthState(encoded);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required state fields');
    });

    it('should return invalid when source is missing', () => {
      const state = {
        redirectUrl: '/dashboard',
        timestamp: Date.now(),
        nonce: generateNonce()
      };
      const encoded = Buffer.from(JSON.stringify(state), 'utf-8').toString('base64url');

      const result = validateOAuthState(encoded);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required state fields');
    });

    it('should return invalid for invalid source value', () => {
      const state = {
        redirectUrl: '/dashboard',
        source: 'invalid-source',
        timestamp: Date.now(),
        nonce: generateNonce()
      };
      const encoded = Buffer.from(JSON.stringify(state), 'utf-8').toString('base64url');

      const result = validateOAuthState(encoded);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid source value');
    });

    it('should return invalid for expired state', () => {
      const expiredTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      const encoded = createValidEncodedState({ timestamp: expiredTimestamp });

      const result = validateOAuthState(encoded);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('State has expired');
    });

    it('should return invalid for future timestamp', () => {
      const futureTimestamp = Date.now() + 60 * 1000; // 1 minute in future
      const encoded = createValidEncodedState({ timestamp: futureTimestamp });

      const result = validateOAuthState(encoded);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid timestamp');
    });

    it('should skip expiry check when checkExpiry is false', () => {
      const expiredTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
      const encoded = createValidEncodedState({ timestamp: expiredTimestamp });

      const result = validateOAuthState(encoded, { checkExpiry: false });

      expect(result.valid).toBe(true);
    });

    it('should use custom expiry time', () => {
      const timestamp = Date.now() - 2 * 60 * 1000; // 2 minutes ago
      const encoded = createValidEncodedState({ timestamp });

      // With default 5 minutes, should be valid
      const result1 = validateOAuthState(encoded);
      expect(result1.valid).toBe(true);

      // With custom 1 minute, should be expired
      const result2 = validateOAuthState(encoded, { expiryMs: 60 * 1000 });
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('State has expired');
    });

    it('should return state object when valid', () => {
      const originalState: OAuthState = {
        redirectUrl: '/settings',
        source: 'website',
        timestamp: Date.now(),
        nonce: 'unique-nonce'
      };
      const encoded = encodeOAuthState(originalState);

      const result = validateOAuthState(encoded);

      expect(result.valid).toBe(true);
      expect(result.state).toEqual(originalState);
    });
  });

  describe('getCallbackUrl', () => {
    it('should generate callback URL with encoded state', () => {
      const state: OAuthState = {
        redirectUrl: '/dashboard',
        source: 'app',
        timestamp: Date.now(),
        nonce: generateNonce()
      };
      const frontendUrl = 'https://app.daodao.so';

      const callbackUrl = getCallbackUrl(state, frontendUrl);

      expect(callbackUrl).toContain('https://app.daodao.so/auth/callback?state=');

      // Extract and verify state parameter
      const stateParam = callbackUrl.split('state=')[1];
      const decoded = decodeOAuthState(stateParam);
      expect(decoded).toEqual(state);
    });

    it('should work with localhost URL', () => {
      const state: OAuthState = {
        redirectUrl: '/test',
        source: 'app',
        timestamp: Date.now(),
        nonce: 'test'
      };

      const callbackUrl = getCallbackUrl(state, 'http://localhost:3000');

      expect(callbackUrl).toContain('http://localhost:3000/auth/callback');
    });
  });

  describe('getFinalRedirectUrl', () => {
    const frontendUrl = 'https://app.daodao.so';

    it('should prepend frontendUrl to relative paths', () => {
      const state: OAuthState = {
        redirectUrl: '/dashboard',
        source: 'app',
        timestamp: Date.now(),
        nonce: 'test'
      };

      const finalUrl = getFinalRedirectUrl(state, frontendUrl);

      expect(finalUrl).toBe('https://app.daodao.so/dashboard');
    });

    it('should return absolute URL as-is', () => {
      const state: OAuthState = {
        redirectUrl: 'https://other-site.com/page',
        source: 'app',
        timestamp: Date.now(),
        nonce: 'test'
      };

      const finalUrl = getFinalRedirectUrl(state, frontendUrl);

      expect(finalUrl).toBe('https://other-site.com/page');
    });

    it('should handle complex relative paths', () => {
      const state: OAuthState = {
        redirectUrl: '/user/profile/settings?tab=security',
        source: 'website',
        timestamp: Date.now(),
        nonce: 'test'
      };

      const finalUrl = getFinalRedirectUrl(state, frontendUrl);

      expect(finalUrl).toBe('https://app.daodao.so/user/profile/settings?tab=security');
    });
  });

  describe('Integration: Full OAuth State Flow', () => {
    it('should handle complete state roundtrip', () => {
      // 1. Create state
      const originalState = createOAuthState('/my-profile', 'website');

      // 2. Encode for URL
      const encoded = encodeOAuthState(originalState);

      // 3. Decode after callback
      const decoded = decodeOAuthState(encoded);

      // 4. Validate
      const validationResult = validateOAuthState(encoded);

      // 5. Get final URL
      const finalUrl = getFinalRedirectUrl(decoded!, 'https://daodao.so');

      expect(decoded).toEqual(originalState);
      expect(validationResult.valid).toBe(true);
      expect(finalUrl).toBe('https://daodao.so/my-profile');
    });

    it('should reject tampered state', () => {
      const state = createOAuthState('/admin');
      const encoded = encodeOAuthState(state);

      // Tamper with the encoded state
      const tampered = encoded.slice(0, -5) + 'xxxxx';

      const result = validateOAuthState(tampered);

      expect(result.valid).toBe(false);
    });
  });
});
