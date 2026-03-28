/**
 * Interaction Count Service
 * 追蹤兩個用戶之間的累計互動次數（跨實踐、雙向計入）
 * 用途：連結系統的「動態門檻 / 信任豁免」判斷依據（>= 3 次可跳過填寫原因）
 */

import { prisma } from './database/prisma.service';

// ============================================================================
// Helpers
// ============================================================================

/** 正規化兩個 user ID，確保 a <= b（對應資料表的 CHECK 約束）*/
const normalizePair = (x: number, y: number): { a: number; b: number } => ({
  a: Math.min(x, y),
  b: Math.max(x, y),
});

// ============================================================================
// Service Functions
// ============================================================================

/**
 * 將兩個用戶之間的互動計數加一（upsert）
 * 不論互動方向（A→B 或 B→A），都計入同一筆記錄
 *
 * 計入行為：留言、回覆留言、@ 標記對方
 */
const increment = async (userX: number, userY: number): Promise<void> => {
  if (userX === userY) return; // 自我互動不計入

  const { a, b } = normalizePair(userX, userY);

  await prisma.interaction_counts.upsert({
    where: {
      user_a_id_user_b_id: { user_a_id: a, user_b_id: b },
    },
    update: {
      count:      { increment: 1 },
      updated_at: new Date(),
    },
    create: {
      user_a_id: a,
      user_b_id: b,
      count:     1,
    },
  });
};

/**
 * 取得兩個用戶之間的累計互動次數
 * @returns 互動次數，若無記錄則回傳 0
 */
const getCount = async (userX: number, userY: number): Promise<number> => {
  if (userX === userY) return 0;

  const { a, b } = normalizePair(userX, userY);

  const record = await prisma.interaction_counts.findUnique({
    where: {
      user_a_id_user_b_id: { user_a_id: a, user_b_id: b },
    },
    select: { count: true },
  });

  return record?.count ?? 0;
};

/**
 * 判斷兩個用戶是否已達「信任豁免（Familiarity Bypass）」門檻（>= 3 次）
 */
const hasFamiliarityBypass = async (
  userX: number,
  userY: number
): Promise<boolean> => {
  const count = await getCount(userX, userY);
  return count >= 3;
};

// ============================================================================
// Export
// ============================================================================

export const interactionCountService = {
  increment,
  getCount,
  hasFamiliarityBypass,
};
