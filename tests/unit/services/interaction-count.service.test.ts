/**
 * Interaction Count Service Unit Tests
 *
 * 涵蓋範圍：
 * - 13.1 跨實踐累計計數邏輯（正規化 pair、雙向累計）
 * - 13.6 對話環（A留言→B回覆→A回覆）累計計數正確為 3
 * - 13.9 B 在 A 的實踐留言 1 次 + A 在 B 的實踐留言 2 次，計數正確為 3
 */

import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

import { interactionCountService } from '@/services/interaction-count.service';

// ============================================================================
// Helpers
// ============================================================================

const makeCountRecord = (a: number, b: number, count: number) => ({
  id: 1,
  user_a_id: a,
  user_b_id: b,
  count,
  updated_at: new Date(),
});

// ============================================================================
// Tests
// ============================================================================

describe('Interaction Count Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // increment
  // --------------------------------------------------------------------------

  describe('increment', () => {
    it('以 (min,max) 正規化後 upsert（A→B 與 B→A 寫入同一筆記錄）', async () => {
      prismaMock.interaction_counts.upsert.mockResolvedValue(makeCountRecord(1, 2, 1) as any);

      await interactionCountService.increment(5, 2);

      expect(prismaMock.interaction_counts.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_a_id_user_b_id: { user_a_id: 2, user_b_id: 5 },
          },
        }),
      );
    });

    it('(B→A) 方向呼叫，與 (A→B) 寫入相同 pair', async () => {
      prismaMock.interaction_counts.upsert.mockResolvedValue(makeCountRecord(1, 3, 1) as any);

      await interactionCountService.increment(3, 1); // B=3, A=1 → pair (1,3)

      expect(prismaMock.interaction_counts.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_a_id_user_b_id: { user_a_id: 1, user_b_id: 3 },
          },
        }),
      );
    });

    it('自我互動（userX === userY）不呼叫 DB', async () => {
      await interactionCountService.increment(1, 1);
      expect(prismaMock.interaction_counts.upsert).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // getCount
  // --------------------------------------------------------------------------

  describe('getCount', () => {
    it('無記錄時回傳 0', async () => {
      prismaMock.interaction_counts.findUnique.mockResolvedValue(null);

      const count = await interactionCountService.getCount(1, 2);

      expect(count).toBe(0);
    });

    it('有記錄時回傳正確計數', async () => {
      prismaMock.interaction_counts.findUnique.mockResolvedValue({ count: 5 } as any);

      const count = await interactionCountService.getCount(1, 2);

      expect(count).toBe(5);
    });

    it('自我查詢（userX === userY）回傳 0，不查 DB', async () => {
      const count = await interactionCountService.getCount(3, 3);

      expect(count).toBe(0);
      expect(prismaMock.interaction_counts.findUnique).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // hasFamiliarityBypass
  // --------------------------------------------------------------------------

  describe('hasFamiliarityBypass', () => {
    it('互動次數 < 3，回傳 false', async () => {
      prismaMock.interaction_counts.findUnique.mockResolvedValue({ count: 2 } as any);

      const result = await interactionCountService.hasFamiliarityBypass(1, 2);

      expect(result).toBe(false);
    });

    it('互動次數 === 3，回傳 true（恰好達門檻）', async () => {
      prismaMock.interaction_counts.findUnique.mockResolvedValue({ count: 3 } as any);

      const result = await interactionCountService.hasFamiliarityBypass(1, 2);

      expect(result).toBe(true);
    });

    it('互動次數 > 3，回傳 true', async () => {
      prismaMock.interaction_counts.findUnique.mockResolvedValue({ count: 10 } as any);

      const result = await interactionCountService.hasFamiliarityBypass(1, 2);

      expect(result).toBe(true);
    });

    it('無記錄（count=0），回傳 false', async () => {
      prismaMock.interaction_counts.findUnique.mockResolvedValue(null);

      const result = await interactionCountService.hasFamiliarityBypass(1, 2);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 13.6 對話環累計計數
  // --------------------------------------------------------------------------

  describe('對話環累計計數（13.6）', () => {
    it('A留言→B回覆→A回覆，連續 3 次 increment 後 getCount 應為 3', async () => {
      let storedCount = 0;

      // 每次 upsert 模擬計數+1
      (prismaMock.interaction_counts.upsert as jest.Mock).mockImplementation(async () => {
        storedCount += 1;
        return makeCountRecord(1, 2, storedCount);
      });

      (prismaMock.interaction_counts.findUnique as jest.Mock).mockImplementation(async () =>
        storedCount === 0 ? null : { count: storedCount },
      );

      await interactionCountService.increment(1, 2); // A 在 B 的實踐留言
      await interactionCountService.increment(2, 1); // B 回覆 A（反向，同 pair）
      await interactionCountService.increment(1, 2); // A 再留言

      const count = await interactionCountService.getCount(1, 2);

      expect(prismaMock.interaction_counts.upsert).toHaveBeenCalledTimes(3);
      expect(count).toBe(3);
    });
  });

  // --------------------------------------------------------------------------
  // 13.9 跨實踐雙向累計
  // --------------------------------------------------------------------------

  describe('跨實踐雙向累計（13.9）', () => {
    it('B 在 A 的實踐留言 1 次 + A 在 B 的實踐留言 2 次，計數應為 3', async () => {
      let storedCount = 0;

      (prismaMock.interaction_counts.upsert as jest.Mock).mockImplementation(async () => {
        storedCount += 1;
        return makeCountRecord(1, 2, storedCount);
      });

      (prismaMock.interaction_counts.findUnique as jest.Mock).mockImplementation(async () =>
        ({ count: storedCount }),
      );

      // B 在 A 的實踐留言 1 次
      await interactionCountService.increment(2, 1);
      // A 在 B 的實踐留言 2 次
      await interactionCountService.increment(1, 2);
      await interactionCountService.increment(1, 2);

      const count = await interactionCountService.getCount(1, 2);

      expect(prismaMock.interaction_counts.upsert).toHaveBeenCalledTimes(3);
      // 所有呼叫均正規化為同一 pair
      for (const call of prismaMock.interaction_counts.upsert.mock.calls) {
        expect((call[0] as any).where.user_a_id_user_b_id).toEqual({
          user_a_id: 1,
          user_b_id: 2,
        });
      }
      expect(count).toBe(3);
    });
  });
});
