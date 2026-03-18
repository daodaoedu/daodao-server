/**
 * Privacy Service Unit Tests
 *
 * 涵蓋範圍：
 * - 13.4 解除連結後，canAccessContent 回傳 false
 * - 13.5 非連結用戶存取 connections_only 內容回傳 false
 */

import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

import { privacyService } from '@/services/privacy.service';

// ============================================================================
// Tests
// ============================================================================

describe('Privacy Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // public
  // --------------------------------------------------------------------------

  describe('public visibility', () => {
    it('任何人（包含未登入）均可存取', async () => {
      expect(await privacyService.canAccessContent(null, 1, 'public')).toBe(true);
      expect(await privacyService.canAccessContent(99, 1, 'public')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // private
  // --------------------------------------------------------------------------

  describe('private visibility', () => {
    it('本人可存取', async () => {
      expect(await privacyService.canAccessContent(1, 1, 'private')).toBe(true);
    });

    it('他人無法存取', async () => {
      expect(await privacyService.canAccessContent(2, 1, 'private')).toBe(false);
    });

    it('未登入無法存取', async () => {
      expect(await privacyService.canAccessContent(null, 1, 'private')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // connections_only（13.4, 13.5）
  // --------------------------------------------------------------------------

  describe('connections_only visibility', () => {
    it('本人（requesterId === ownerId）永遠可存取', async () => {
      const result = await privacyService.canAccessContent(1, 1, 'connections_only');
      expect(result).toBe(true);
      // 本人不需查詢 DB
      expect(prismaMock.connections.findUnique).not.toHaveBeenCalled();
    });

    it('未登入（null）無法存取', async () => {
      const result = await privacyService.canAccessContent(null, 1, 'connections_only');
      expect(result).toBe(false);
      expect(prismaMock.connections.findUnique).not.toHaveBeenCalled();
    });

    it('非夥伴無法存取（13.5：解除連結後或從未連結）', async () => {
      prismaMock.connections.findUnique.mockResolvedValue(null);

      const result = await privacyService.canAccessContent(2, 1, 'connections_only');

      expect(result).toBe(false);
      expect(prismaMock.connections.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_a_id_user_b_id: { user_a_id: 1, user_b_id: 2 },
          },
        }),
      );
    });

    it('已連結的夥伴可存取', async () => {
      prismaMock.connections.findUnique.mockResolvedValue({
        id: 1, user_a_id: 1, user_b_id: 2, connected_at: new Date(),
      } as any);

      const result = await privacyService.canAccessContent(2, 1, 'connections_only');

      expect(result).toBe(true);
    });

    it('13.4：解除連結後（DB 查無記錄）立即回傳 false', async () => {
      // 模擬「之前有連結，解除後 DB 已刪除」的狀態
      prismaMock.connections.findUnique.mockResolvedValue(null);

      const result = await privacyService.canAccessContent(2, 1, 'connections_only');

      expect(result).toBe(false);
    });

    it('查詢時以 (min,max) 正規化 user ID 順序', async () => {
      prismaMock.connections.findUnique.mockResolvedValue(null);

      // requesterId=5, ownerId=3 → pair should be (3,5)
      await privacyService.canAccessContent(5, 3, 'connections_only');

      expect(prismaMock.connections.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_a_id_user_b_id: { user_a_id: 3, user_b_id: 5 },
          },
        }),
      );
    });
  });

  // --------------------------------------------------------------------------
  // unknown visibility（容錯）
  // --------------------------------------------------------------------------

  describe('unknown visibility', () => {
    it('未知 visibility 視為 public，回傳 true', async () => {
      const result = await privacyService.canAccessContent(null, 1, 'unknown_type');
      expect(result).toBe(true);
    });
  });
});
