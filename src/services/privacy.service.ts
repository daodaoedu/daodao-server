/**
 * Privacy Service
 * 基於夥伴關係的隱私橋接（Privacy Bridge）
 *
 * 隱私層級：
 * - public：所有人（含訪客）皆可見
 * - private：僅本人可見
 * - connections_only：僅成功「連結」的夥伴可查看細節
 */

import { prisma } from './database/prisma.service';

export type ContentVisibility = 'public' | 'private' | 'connections_only';

// ============================================================================
// Service Functions
// ============================================================================

/**
 * 判斷請求者是否有權存取指定可見性的內容
 *
 * @param requesterId - 請求者的內部 user ID（未登入則為 null/undefined）
 * @param ownerId     - 內容擁有者的內部 user ID
 * @param visibility  - 內容的可見性設定
 * @returns true 表示可存取
 */
const canAccessContent = async (
  requesterId: number | null | undefined,
  ownerId: number,
  visibility: ContentVisibility | string
): Promise<boolean> => {
  switch (visibility) {
    case 'public':
      return true;

    case 'private':
      // 僅本人可見
      return requesterId != null && requesterId === ownerId;

    case 'connections_only': {
      // 本人永遠可見
      if (requesterId != null && requesterId === ownerId) return true;
      // 未登入則無法存取
      if (requesterId == null) return false;

      // 查詢是否有連結關係
      const a = Math.min(requesterId, ownerId);
      const b = Math.max(requesterId, ownerId);

      const connection = await prisma.connections.findUnique({
        where: { user_a_id_user_b_id: { user_a_id: a, user_b_id: b } },
        select: { id: true },
      });

      return connection !== null;
    }

    default:
      // 未知的 visibility 視為 public（容錯）
      return true;
  }
};

// ============================================================================
// Export
// ============================================================================

export const privacyService = {
  canAccessContent,
};
