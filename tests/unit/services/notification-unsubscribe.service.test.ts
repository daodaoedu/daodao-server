/**
 * Notification Unsubscribe Service Unit Tests
 *
 * 涵蓋範圍：
 * - generateUnsubscribeToken：產生合法 JWT，含正確 payload
 * - verifyUnsubscribeToken：驗證合法 token
 * - verifyUnsubscribeToken：拒絕無效 token、過期 token、錯誤 purpose
 * - generateUnsubscribeUrl：URL 格式正確
 * - generateSettingsUrl：URL 格式正確
 */

// 確保使用 test setup 中的 JWT_SECRET
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.FRONTEND_URL = 'https://daodao.cc';

import jwt from 'jsonwebtoken';
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  generateUnsubscribeUrl,
  generateSettingsUrl,
} from '@/services/notification-unsubscribe.service';

// ============================================================================
// Tests
// ============================================================================

describe('NotificationUnsubscribeService', () => {
  // --------------------------------------------------------------------------
  // generateUnsubscribeToken
  // --------------------------------------------------------------------------

  describe('generateUnsubscribeToken', () => {
    it('回傳合法的 JWT 字串', () => {
      const token = generateUnsubscribeToken(1, 'Comment');
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('payload 包含 userId、notificationType、purpose', () => {
      const token = generateUnsubscribeToken(42, 'Reaction');
      const decoded = jwt.decode(token) as Record<string, unknown>;

      expect(decoded.userId).toBe(42);
      expect(decoded.notificationType).toBe('Reaction');
      expect(decoded.purpose).toBe('unsubscribe');
    });

    it('token 有效期約 90 天', () => {
      const before = Math.floor(Date.now() / 1000);
      const token = generateUnsubscribeToken(1, 'Comment');
      const after = Math.floor(Date.now() / 1000);

      const decoded = jwt.decode(token) as Record<string, unknown>;
      const exp = decoded.exp as number;
      const iat = decoded.iat as number;

      expect(exp - iat).toBeGreaterThanOrEqual(90 * 24 * 60 * 60 - 5);
      expect(exp - iat).toBeLessThanOrEqual(90 * 24 * 60 * 60 + 5);
      expect(iat).toBeGreaterThanOrEqual(before);
      expect(iat).toBeLessThanOrEqual(after + 1);
    });

    it('不同 userId / notificationType 產生不同 token', () => {
      const t1 = generateUnsubscribeToken(1, 'Comment');
      const t2 = generateUnsubscribeToken(2, 'Comment');
      const t3 = generateUnsubscribeToken(1, 'Reaction');

      expect(t1).not.toBe(t2);
      expect(t1).not.toBe(t3);
    });
  });

  // --------------------------------------------------------------------------
  // verifyUnsubscribeToken
  // --------------------------------------------------------------------------

  describe('verifyUnsubscribeToken', () => {
    it('合法 token 回傳 { userId, notificationType }', () => {
      const token = generateUnsubscribeToken(7, 'Connect');
      const result = verifyUnsubscribeToken(token);

      expect(result).not.toBeNull();
      expect(result!.userId).toBe(7);
      expect(result!.notificationType).toBe('Connect');
    });

    it('無效字串回傳 null', () => {
      expect(verifyUnsubscribeToken('not-a-jwt')).toBeNull();
    });

    it('空字串回傳 null', () => {
      expect(verifyUnsubscribeToken('')).toBeNull();
    });

    it('過期 token 回傳 null', () => {
      const expiredToken = jwt.sign(
        { userId: 1, notificationType: 'Comment', purpose: 'unsubscribe' },
        'test-secret-key-for-testing',
        { expiresIn: -1 },
      );

      expect(verifyUnsubscribeToken(expiredToken)).toBeNull();
    });

    it('purpose 不是 unsubscribe 時回傳 null', () => {
      const wrongPurposeToken = jwt.sign(
        { userId: 1, notificationType: 'Comment', purpose: 'reset-password' },
        'test-secret-key-for-testing',
        { expiresIn: 3600 },
      );

      expect(verifyUnsubscribeToken(wrongPurposeToken)).toBeNull();
    });

    it('用不同 secret 簽署的 token 回傳 null', () => {
      const wrongSecretToken = jwt.sign(
        { userId: 1, notificationType: 'Comment', purpose: 'unsubscribe' },
        'wrong-secret',
        { expiresIn: 3600 },
      );

      expect(verifyUnsubscribeToken(wrongSecretToken)).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // generateUnsubscribeUrl
  // --------------------------------------------------------------------------

  describe('generateUnsubscribeUrl', () => {
    it('URL 以 FRONTEND_URL 開頭並包含正確路徑', () => {
      const url = generateUnsubscribeUrl(1, 'Comment');
      expect(url.startsWith('https://daodao.cc/api/v1/notifications/unsubscribe?token=')).toBe(true);
    });

    it('URL 中的 token 可被解碼，內含正確 userId 與 notificationType', () => {
      const url = generateUnsubscribeUrl(5, 'Reaction');
      const tokenParam = new URL(url).searchParams.get('token');

      expect(tokenParam).not.toBeNull();
      const result = verifyUnsubscribeToken(tokenParam!);
      expect(result?.userId).toBe(5);
      expect(result?.notificationType).toBe('Reaction');
    });
  });

  // --------------------------------------------------------------------------
  // generateSettingsUrl
  // --------------------------------------------------------------------------

  describe('generateSettingsUrl', () => {
    it('回傳正確的設定頁 URL', () => {
      const url = generateSettingsUrl();
      expect(url).toBe('https://daodao.cc/settings/notifications');
    });
  });
});
